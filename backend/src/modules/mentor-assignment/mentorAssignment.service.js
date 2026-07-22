import mongoose from "mongoose";
import MentorAssignment from "../mentors/mentorAssignment.model.js";
import User from "../users/user.model.js";
import Batch from "../batches/batch.model.js";
import { createLogDb } from "../logs/log.service.js";
import { orchestratorService } from "../notifications/services/orchestrator.service.js";

const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * Assigns a mentor to a batch
 */
export const assignMentorDb = async (data, user) => {
  const { mentorId, batchId, remarks } = data;

  // 1. Verify mentor exists, role is mentor, and is active
  const mentor = await User.findById(mentorId);
  if (!mentor) {
    throw createError("Mentor user not found", 404);
  }
  if (mentor.role !== "mentor") {
    throw createError("User role must be mentor", 400);
  }
  if (!mentor.isActive) {
    throw createError("Mentor is not active", 400);
  }

  // 2. Verify batch exists and is active, and fetch nested organization details
  const batch = await Batch.findById(batchId).populate({
    path: "departmentId",
    populate: {
      path: "courseId"
    }
  });

  if (!batch) {
    throw createError("Batch not found", 404);
  }
  if (!batch.isActive) {
    throw createError("Batch is not active", 400);
  }

  const batchOrgId = batch.departmentId?.courseId?.organizationId?.toString() || batch.departmentId?.courseId?.organizationId?._id?.toString();
  if (!batchOrgId) {
    throw createError("Batch organization could not be resolved", 400);
  }

  // 3. Verify organizations match
  const mentorOrgId = mentor.organization?.toString();
  if (batchOrgId !== mentorOrgId) {
    throw createError("Mentor and Batch must belong to the same organization", 400);
  }

  // 4. Database Transaction for safe writes
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 5. Ensure no active mentor assignment already exists for the batch
    const existingActive = await MentorAssignment.findOne({ batchId, status: "ACTIVE" }).session(session);
    if (existingActive) {
      throw createError("An active mentor is already assigned to this batch", 400);
    }

    // 6. Create new assignment
    const [assignment] = await MentorAssignment.create([{
      organizationId: batchOrgId,
      mentorId,
      batchId,
      assignedBy: user.id || user._id,
      assignedAt: new Date(),
      status: "ACTIVE",
      remarks: remarks || null
    }], { session });

    // 7. Log to Timeline/Activity logs
    await createLogDb({
      action: "Mentor Assigned",
      entityType: "User",
      entityId: mentorId,
      user: user.id || user._id,
      userRole: user.role || "System",
      details: `Assigned mentor ${mentor.name} to batch ${batch.name}`,
      status: "success"
    }, session);

    // 8. Dispatch notification (not breaking transaction if notifications fail)
    try {
      await orchestratorService.triggerNotification({
        eventName: "MENTOR_ASSIGNED",
        target: { type: "USER", filter: { userId: mentorId } },
        data: {
          batchName: batch.name
        },
        channels: ["in-app"]
      });
    } catch (notifErr) {
      console.error("Failed to trigger assignment notification:", notifErr);
    }

    await session.commitTransaction();
    return assignment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Returns a paginated list of mentor assignments with search and filters
 */
export const getPaginatedAssignmentsDb = async (filters, options) => {
  const { page = 1, limit = 10, search, status, mentorId, batchId, organizationId, startDate, endDate } = filters;
  const { sortBy = "createdAt", sortOrder = "desc" } = options;

  const query = {};

  if (status) {
    query.status = status.toUpperCase();
  }
  if (mentorId) {
    query.mentorId = mentorId;
  }
  if (batchId) {
    query.batchId = batchId;
  }
  if (organizationId) {
    query.organizationId = organizationId;
  }

  if (startDate || endDate) {
    query.assignedAt = {};
    if (startDate) query.assignedAt.$gte = new Date(new Date(startDate).setHours(0, 0, 0, 0));
    if (endDate) query.assignedAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  if (search) {
    const matchingMentors = await User.find({
      role: "mentor",
      name: { $regex: search, $options: "i" }
    }).select("_id");

    const matchingBatches = await Batch.find({
      name: { $regex: search, $options: "i" }
    }).select("_id");

    query.$or = [
      { mentorId: { $in: matchingMentors.map(m => m._id) } },
      { batchId: { $in: matchingBatches.map(b => b._id) } }
    ];
  }

  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const skip = (page - 1) * limit;

  const assignments = await MentorAssignment.find(query)
    .populate("mentorId", "name email phone")
    .populate("batchId", "name code")
    .populate("organizationId", "name code")
    .populate("assignedBy", "name email")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalCount = await MentorAssignment.countDocuments(query);

  return {
    assignments,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit)
  };
};

/**
 * Fetches single assignment details
 */
export const getAssignmentByIdDb = async (id) => {
  const assignment = await MentorAssignment.findById(id)
    .populate("mentorId", "name email phone")
    .populate("batchId", "name code")
    .populate("organizationId", "name code")
    .populate("assignedBy", "name email")
    .lean();

  if (!assignment) {
    throw createError("Assignment not found", 404);
  }

  return assignment;
};

/**
 * Updates status or remarks on assignment
 */
export const updateAssignmentDb = async (id, updateData, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const assignment = await MentorAssignment.findById(id).session(session);
    if (!assignment) {
      throw createError("Assignment not found", 404);
    }

    if (["COMPLETED", "CANCELLED", "TRANSFERRED"].includes(assignment.status)) {
      throw createError(`Cannot update assignment. Current status is ${assignment.status}`, 400);
    }

    const updates = {};
    if (updateData.remarks !== undefined) {
      updates.remarks = updateData.remarks;
    }

    if (updateData.status) {
      updates.status = updateData.status.toUpperCase();
      updates.endedAt = new Date();
    }

    const updatedAssignment = await MentorAssignment.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, session }
    )
      .populate("mentorId", "name email")
      .populate("batchId", "name");

    let action = "Assignment Updated";
    if (updates.status === "COMPLETED") {
      action = "Assignment Completed";
    } else if (updates.status === "CANCELLED") {
      action = "Assignment Cancelled";
    }

    await createLogDb({
      action,
      entityType: "User",
      entityId: updatedAssignment.mentorId?._id || updatedAssignment.mentorId,
      user: user.id || user._id,
      userRole: user.role || "System",
      details: `Updated assignment status to ${updatedAssignment.status} for mentor ${updatedAssignment.mentorId?.name} and batch ${updatedAssignment.batchId?.name}`,
      status: "success"
    }, session);

    if (updates.status === "COMPLETED" || updates.status === "CANCELLED") {
      try {
        await orchestratorService.triggerNotification({
          eventName: "MENTOR_COMPLETED",
          target: { type: "USER", filter: { userId: updatedAssignment.mentorId?._id || updatedAssignment.mentorId } },
          data: {
            batchName: updatedAssignment.batchId?.name
          },
          channels: ["in-app"]
        });
      } catch (notifErr) {
        console.error("Failed to trigger assignment completion notification:", notifErr);
      }
    }

    await session.commitTransaction();
    return updatedAssignment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Transfers mentorship of a batch to a new mentor
 */
export const transferMentorDb = async (id, newMentorId, remarks, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const oldAssignment = await MentorAssignment.findById(id)
      .populate("mentorId", "name")
      .populate("batchId", "name")
      .session(session);

    if (!oldAssignment) {
      throw createError("Original mentor assignment not found", 404);
    }

    if (oldAssignment.status !== "ACTIVE") {
      throw createError(`Cannot transfer from a non-active assignment (current status: ${oldAssignment.status})`, 400);
    }

    const newMentor = await User.findById(newMentorId).session(session);
    if (!newMentor) {
      throw createError("New mentor user not found", 404);
    }
    if (newMentor.role !== "mentor") {
      throw createError("User role must be mentor", 400);
    }
    if (!newMentor.isActive) {
      throw createError("New mentor is not active", 400);
    }

    if (newMentor.organization?.toString() !== oldAssignment.organizationId?.toString()) {
      throw createError("New mentor must belong to the same organization as original assignment", 400);
    }

    const currentDate = new Date();

    // 1. End the old assignment
    oldAssignment.status = "TRANSFERRED";
    oldAssignment.endedAt = currentDate;
    await oldAssignment.save({ session });

    // 2. Create the new assignment
    const [newAssignment] = await MentorAssignment.create([{
      organizationId: oldAssignment.organizationId,
      mentorId: newMentorId,
      batchId: oldAssignment.batchId?._id || oldAssignment.batchId,
      assignedBy: user.id || user._id,
      assignedAt: currentDate,
      status: "ACTIVE",
      remarks: remarks || `Transferred from mentor ${oldAssignment.mentorId?.name}`
    }], { session });

    // 3. Log activity
    await createLogDb({
      action: "Mentor Transferred",
      entityType: "User",
      entityId: newMentorId,
      user: user.id || user._id,
      userRole: user.role || "System",
      details: `Transferred mentorship of batch ${oldAssignment.batchId?.name} from ${oldAssignment.mentorId?.name} to ${newMentor.name}`,
      status: "success"
    }, session);

    // 4. Send notifications
    try {
      // Notify new mentor
      await orchestratorService.triggerNotification({
        eventName: "MENTOR_ASSIGNED",
        target: { type: "USER", filter: { userId: newMentorId } },
        data: {
          batchName: oldAssignment.batchId?.name
        },
        channels: ["in-app"]
      });

      // Notify old mentor
      await orchestratorService.triggerNotification({
        eventName: "MENTOR_TRANSFERRED",
        target: { type: "USER", filter: { userId: oldAssignment.mentorId?._id || oldAssignment.mentorId } },
        data: {
          batchName: oldAssignment.batchId?.name
        },
        channels: ["in-app"]
      });
    } catch (notifErr) {
      console.error("Failed to trigger transfer notifications:", notifErr);
    }

    await session.commitTransaction();
    return { oldAssignment, newAssignment };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
