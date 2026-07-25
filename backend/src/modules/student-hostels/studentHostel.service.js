import mongoose from "mongoose";
import StudentHostelAllocation from "./studentHostel.model.js";
import Student from "../students/student.model.js";
import Hostel from "../hostels/hostel.model.js";
import FurnitureAsset from "../furnitures/furnitureAsset.model.js";
import FurnitureAssetHistory from "../furnitures/furnitureAssetHistory.model.js";
import { syncHostelOrganizations } from "../hostels/hostel.service.js";
import { AttendanceWindow } from "../attendance/attendance.model.js";
import { reassignActivePasses } from "../passes/pass.service.js";
import { orchestratorService } from "../notifications/services/orchestrator.service.js";
import Parent from "../parents/parent.model.js";

const deallocateFurniture = async (studentId, actor, session) => {
  const assets = await FurnitureAsset.find({ studentId }).session(session);
  if (assets.length > 0) {
    const assetIds = assets.map(a => a._id);
    await FurnitureAsset.updateMany(
      { _id: { $in: assetIds } },
      { $set: { status: "available", studentId: null, updatedBy: actor._id } },
      { session }
    );
    const timelines = assets.map(asset => ({
      furnitureAssetId: asset._id,
      action: "returned",
      previousStatus: "allocated",
      currentStatus: "available",
      studentId: studentId,
      performedBy: actor._id,
      performedByRole: actor.role,
      remarks: "Automatically returned on hostel vacate/change"
    }));
    await FurnitureAssetHistory.insertMany(timelines, { session });
  }
};

const allocateHostelInternal = async (studentId, data, actor) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { hostelId, roomNumber, reason, remarks, joinedAt } = data;
    console.log("allocateHostelInternal -> START", { studentId, data, actorId: actor._id || actor.id });

    const student = await Student.findById(studentId).session(session);
    if (!student) {
      const error = new Error("Student not found");
      error.statusCode = 404;
      throw error;
    }
    if (!student.isActive) {
      const error = new Error("Student is not active");
      error.statusCode = 400;
      throw error;
    }

    const hostel = await Hostel.findById(hostelId).session(session);
    if (!hostel) {
      const error = new Error("Hostel not found");
      error.statusCode = 404;
      throw error;
    }
    if (!hostel.isActive) {
      const error = new Error("Hostel is not active");
      error.statusCode = 400;
      throw error;
    }

    const existingAllocation = await StudentHostelAllocation.findOne({
      studentId,
      status: "active"
    }).session(session);

    if (existingAllocation) {
      const error = new Error("Student is already allocated to a hostel");
      error.statusCode = 400;
      throw error;
    }

    const allocation = new StudentHostelAllocation({
      studentId,
      organizationId: student.organizationId,
      hostelId,
      roomNumber,
      status: "active",
      allocatedBy: actor._id || actor.id,
      joinedAt: joinedAt || new Date(),
      reason,
      remarks,
    });
    await allocation.save({ session });

    student.hostelId = hostelId;
    student.roomNumber = roomNumber;
    student.hostelStatus = "active";
    await student.save({ session });

    await syncHostelOrganizations(hostelId, session);

    await session.commitTransaction();
    console.log("allocateHostelInternal -> SUCCESS", { allocationId: allocation._id, studentId });
    return { allocation, student, oldHostelId: null };
  } catch (error) {
    console.error("allocateHostelInternal -> ERROR", error);
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const changeHostelInternal = async (studentId, data, actor) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { hostelId, roomNumber, reason, remarks, joinedAt } = data;
    console.log("changeHostelInternal -> START", { studentId, data, actorId: actor._id || actor.id });

    const student = await Student.findById(studentId).session(session);
    if (!student) {
      const error = new Error("Student not found");
      error.statusCode = 404;
      throw error;
    }

    // Validate that no open attendance window exists for the current hostel
    if (student.hostelId) {
      const openWindowExists = await AttendanceWindow.exists({
        hostelId: student.hostelId,
        status: "open"
      }).session(session);

      if (openWindowExists) {
        const error = new Error("Cannot transfer hostel. Attendance window is currently open for the student's current hostel.");
        error.statusCode = 400;
        throw error;
      }
    }

    const newHostel = await Hostel.findById(hostelId).session(session);
    if (!newHostel) {
      const error = new Error("New hostel not found");
      error.statusCode = 404;
      throw error;
    }
    if (!newHostel.isActive) {
      const error = new Error("New hostel is not active");
      error.statusCode = 400;
      throw error;
    }

    const activeAllocation = await StudentHostelAllocation.findOne({
      studentId: student._id,
      status: "active"
    }).session(session);

    if (!activeAllocation) {
      const error = new Error("Student is not currently allocated to any hostel");
      error.statusCode = 400;
      throw error;
    }

    if (activeAllocation.hostelId.toString() === hostelId.toString()) {
      const error = new Error("New hostel must differ from current hostel");
      error.statusCode = 400;
      throw error;
    }

    const oldHostelId = activeAllocation.hostelId;

    activeAllocation.status = "transferred";
    activeAllocation.vacatedAt = new Date();
    activeAllocation.vacatedBy = actor._id || actor.id;
    activeAllocation.reason = reason || "Hostel Change";
    await activeAllocation.save({ session });

    const newAllocation = new StudentHostelAllocation({
      studentId: student._id,
      organizationId: student.organizationId,
      hostelId,
      roomNumber,
      status: "active",
      allocatedBy: actor._id || actor.id,
      joinedAt: joinedAt || new Date(),
      reason,
      remarks,
    });
    await newAllocation.save({ session });

    student.hostelId = hostelId;
    student.roomNumber = roomNumber;
    student.hostelStatus = "active";
    await student.save({ session });

    // Sync active passes within the same transaction
    const passSyncResult = await reassignActivePasses(student._id, oldHostelId, hostelId, actor, session);

    await deallocateFurniture(student._id, actor, session);

    await syncHostelOrganizations(oldHostelId, session);
    await syncHostelOrganizations(hostelId, session);

    await session.commitTransaction();
    console.log("changeHostelInternal -> SUCCESS", { newAllocationId: newAllocation._id, oldAllocationId: activeAllocation._id, studentId: student._id });

    // Post-commit Notifications
    if (passSyncResult && passSyncResult.updatedCount > 0) {
      try {
        const oldHostel = await Hostel.findById(oldHostelId).lean();
        const oldWardenIds = oldHostel && oldHostel.wardens ? oldHostel.wardens.map(id => id.toString()) : [];
        const newWardenIds = newHostel && newHostel.wardens ? newHostel.wardens.map(id => id.toString()) : [];

        // Group 1: Notify Student, Parent, and New Hostel Wardens
        const targets = [
          { type: 'STUDENT', filter: { studentIds: [student._id.toString()] } },
          { type: 'PARENT', filter: { studentIds: [student._id.toString()] } }
        ];


        if (newWardenIds.length > 0) {
          targets.push({ type: 'USER', filter: { userIds: newWardenIds } });
        }

        await orchestratorService.triggerNotification({
          eventName: 'PASS_HOSTEL_TRANSFERRED',
          target: targets,
          data: {
            studentMessage: "Your active pass has been transferred to your new hostel.",
            parentMessage: "Your child's active pass has been reassigned because of a hostel transfer.",
            wardenMessage: "A new active pass has been assigned to your hostel."
          }
        });

        // Group 2: Notify Old Hostel Wardens (requires a different wardenMessage)
        if (oldWardenIds.length > 0) {
          await orchestratorService.triggerNotification({
            eventName: 'PASS_HOSTEL_TRANSFERRED',
            target: {
              type: 'USER',
              filter: { userIds: oldWardenIds }
            },
            data: {
              wardenMessage: "Active pass removed from your hostel."
            }
          });
        }
      } catch (notifErr) {
        console.error("[HostelTransferService] Post-commit notification error:", notifErr);
      }
    }

    // Structured Audit Log
    console.log("[HostelTransferService] Audit Log - Student Hostel Transfer Success", {
      studentId: student._id,
      oldHostelId,
      newHostelId: hostelId,
      updatedPassCount: passSyncResult.updatedCount,
      actor: actor._id || actor.id,
      timestamp: new Date()
    });

    return {
      oldAllocation: activeAllocation,
      newAllocation,
      student,
      oldHostelId,
      passSyncResult
    };
  } catch (error) {
    console.error("changeHostelInternal -> ERROR", error);
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const updateStudentHostelService = async (studentId, data, actor) => {
  const student = await Student.findById(studentId);
  if (!student) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  if (!student.hostelId) {
    const result = await allocateHostelInternal(studentId, data, actor);
    return { action: "allocated", ...result };
  }

  const result = await changeHostelInternal(studentId, data, actor);
  return { action: "changed", ...result };
};

export const vacateHostelService = async (studentId, data, actor) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reason, remarks } = data;

    const student = await Student.findById(studentId).session(session);
    if (!student) {
      const error = new Error("Student not found");
      error.statusCode = 404;
      throw error;
    }

    const activeAllocation = await StudentHostelAllocation.findOne({
      studentId,
      status: "active"
    }).session(session);

    if (!activeAllocation) {
      const error = new Error("Student is not currently allocated to any hostel");
      error.statusCode = 400;
      throw error;
    }

    const oldHostelId = activeAllocation.hostelId;

    activeAllocation.status = "vacated";
    activeAllocation.vacatedAt = new Date();
    activeAllocation.vacatedBy = actor._id || actor.id;
    activeAllocation.reason = reason;
    activeAllocation.remarks = remarks;
    await activeAllocation.save({ session });

    student.hostelId = null;
    student.roomNumber = null;
    student.hostelStatus = "inactive";
    await student.save({ session });

    await deallocateFurniture(studentId, actor, session);

    await syncHostelOrganizations(oldHostelId, session);

    await session.commitTransaction();
    return { allocation: activeAllocation, student, oldHostelId };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
