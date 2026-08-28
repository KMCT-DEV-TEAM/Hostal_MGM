import { prisma } from "../../config/prisma.js";
import { createLogDb } from "../logs/log.service.js";
import { orchestratorService } from "../notification/services/orchestrator.service.js";
import { ROLES } from "../../constants/roles.js";
import { MENTOR_ASSIGNMENT_STATUS } from "../../constants/status.js";

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
  const mentor = await prisma.user.findUnique({ where: { id: mentorId } });
  if (!mentor) {
    throw createError("Mentor user not found", 404);
  }
  if (mentor.role !== ROLES.MENTOR) {
    throw createError("User role must be mentor", 400);
  }
  if (!mentor.isActive) {
    throw createError("Mentor is not active", 400);
  }

  // 2. Verify batch exists and is active, and fetch nested organization details
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      department: {
        include: {
          course: {
            select: { organizationId: true }
          }
        }
      }
    }
  });

  if (!batch) {
    throw createError("Batch not found", 404);
  }
  if (!batch.isActive) {
    throw createError("Batch is not active", 400);
  }

  const batchOrgId = batch.department?.course?.organizationId;
  if (!batchOrgId) {
    throw createError("Batch organization could not be resolved", 400);
  }

  // 3. Verify organizations match
  if (batchOrgId !== mentor.organizationId) {
    throw createError("Mentor and Batch must belong to the same organization", 400);
  }

  return await prisma.$transaction(async (tx) => {
    // 5. Ensure no active mentor assignment already exists for the batch
    const existingActive = await tx.mentorAssignment.findFirst({
      where: {
        batchId,
        status: MENTOR_ASSIGNMENT_STATUS.ACTIVE,
      }
    });

    if (existingActive) {
      throw createError("An active mentor is already assigned to this batch", 400);
    }

    // 6. Create new assignment
    const assignment = await tx.mentorAssignment.create({
      data: {
        organizationId: batchOrgId,
        mentorId,
        batchId,
        assignedById: user.id,
        assignedAt: new Date(),
        status: MENTOR_ASSIGNMENT_STATUS.ACTIVE,
        remarks: remarks || null
      }
    });

    // 7. Log to Timeline/Activity logs
    await createLogDb({
      action: "Mentor Assigned",
      entityType: "User",
      entityId: mentorId,
      user: user.id,
      userRole: user.role,
      details: `Assigned mentor ${mentor.name} to batch ${batch.name}`,
      status: "success"
    }, tx);

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

    return assignment;
  });
};

/**
 * Returns a paginated list of mentor assignments with search and filters
 */
export const getPaginatedAssignmentsDb = async (filters, options) => {
  const { page = 1, limit = 10, search, status, mentorId, batchId, organizationId, startDate, endDate } = filters;
  const { sortBy = "createdAt", sortOrder = "desc" } = options;

  const where = {};

  if (status && status !== "All") {
    if (status.toLowerCase() === "all") {
      where.status = {
        in: ["ACTIVE", "COMPLETED", "CANCELLED", "TRANSFERRED"]
      };
    } else {
      where.status = status.toUpperCase();
    }
  }

  if (mentorId) where.mentorId = mentorId;
  if (batchId) where.batchId = batchId;
  if (organizationId) where.organizationId = organizationId;

  if (search) {
    where.OR = [
      { mentor: { name: { contains: search, mode: "insensitive" } } },
      { batch: { name: { contains: search, mode: "insensitive" } } },
      { batch: { code: { contains: search, mode: "insensitive" } } }
    ];
  }

  const skip = (page - 1) * limit;

  const [assignments, totalCount] = await Promise.all([
    prisma.mentorAssignment.findMany({
      where,
      include: {
        mentor: { select: { id: true, name: true, email: true, phone: true } },
        batch: { select: { id: true, name: true, code: true } },
        organization: { select: { id: true, name: true, code: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.mentorAssignment.count({ where })
  ]);

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
  const assignment = await prisma.mentorAssignment.findUnique({
    where: { id },
    include: {
      mentor: { select: { id: true, name: true, email: true, phone: true } },
      batch: { select: { id: true, name: true, code: true } },
      organization: { select: { id: true, name: true, code: true } },
      assignedBy: { select: { id: true, name: true, email: true } },
    }
  });

  if (!assignment) {
    throw createError("Assignment not found", 404);
  }

  return assignment;
};

/**
 * Updates status or remarks on assignment
 */
export const updateAssignmentDb = async (id, updateData, user) => {
  return await prisma.$transaction(async (tx) => {
    const assignment = await tx.mentorAssignment.findUnique({
      where: { id },
      include: {
        mentor: { select: { id: true, name: true } },
        batch: { select: { id: true, name: true } },
      }
    });

    if (!assignment) {
      throw createError("Assignment not found", 404);
    }

    if ([MENTOR_ASSIGNMENT_STATUS.COMPLETED, MENTOR_ASSIGNMENT_STATUS.CANCELLED, MENTOR_ASSIGNMENT_STATUS.TRANSFERRED].includes(assignment.status)) {
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

    const updatedAssignment = await tx.mentorAssignment.update({
      where: { id },
      data: updates,
      include: {
        mentor: { select: { id: true, name: true, email: true } },
        batch: { select: { id: true, name: true } },
      }
    });

    let action = "Assignment Updated";
    if (updates.status === MENTOR_ASSIGNMENT_STATUS.COMPLETED) {
      action = "Assignment Completed";
    } else if (updates.status === MENTOR_ASSIGNMENT_STATUS.CANCELLED) {
      action = "Assignment Cancelled";
    }

    await createLogDb({
      action,
      entityType: "User",
      entityId: updatedAssignment.mentorId,
      user: user.id,
      userRole: user.role,
      details: `Updated assignment status to ${updatedAssignment.status} for mentor ${updatedAssignment.mentor.name} and batch ${updatedAssignment.batch.name}`,
      status: "success"
    }, tx);

    if (updates.status === MENTOR_ASSIGNMENT_STATUS.COMPLETED || updates.status === MENTOR_ASSIGNMENT_STATUS.CANCELLED) {
      try {
        await orchestratorService.triggerNotification({
          eventName: "MENTOR_COMPLETED",
          target: { type: "USER", filter: { userId: updatedAssignment.mentorId } },
          data: {
            batchName: updatedAssignment.batch.name
          },
          channels: ["in-app"]
        });
      } catch (notifErr) {
        console.error("Failed to trigger assignment completion notification:", notifErr);
      }
    }

    return updatedAssignment;
  });
};

/**
 * Transfers mentorship of a batch to a new mentor
 */
export const transferMentorDb = async (id, newMentorId, remarks, user) => {
  return await prisma.$transaction(async (tx) => {
    const oldAssignment = await tx.mentorAssignment.findUnique({
      where: { id },
      include: {
        mentor: { select: { id: true, name: true } },
        batch: { select: { id: true, name: true } },
      }
    });

    if (!oldAssignment) {
      throw createError("Original mentor assignment not found", 404);
    }

    if (oldAssignment.status !== MENTOR_ASSIGNMENT_STATUS.ACTIVE) {
      throw createError(`Cannot transfer from a non-active assignment (current status: ${oldAssignment.status})`, 400);
    }

    const newMentor = await tx.user.findUnique({ where: { id: newMentorId } });
    if (!newMentor) {
      throw createError("New mentor user not found", 404);
    }
    if (newMentor.role !== ROLES.MENTOR) {
      throw createError("User role must be mentor", 400);
    }
    if (!newMentor.isActive) {
      throw createError("New mentor is not active", 400);
    }

    if (newMentor.organizationId !== oldAssignment.organizationId) {
      throw createError("New mentor must belong to the same organization as original assignment", 400);
    }

    const currentDate = new Date();

    // 1. End the old assignment
    const updatedOldAssignment = await tx.mentorAssignment.update({
      where: { id },
      data: {
        status: MENTOR_ASSIGNMENT_STATUS.TRANSFERRED,
        endedAt: currentDate
      }
    });

    // 2. Create the new assignment
    const newAssignment = await tx.mentorAssignment.create({
      data: {
        organizationId: oldAssignment.organizationId,
        mentorId: newMentorId,
        batchId: oldAssignment.batchId,
        assignedById: user.id,
        assignedAt: currentDate,
        status: MENTOR_ASSIGNMENT_STATUS.ACTIVE,
        remarks: remarks || `Transferred from mentor ${oldAssignment.mentor.name}`
      }
    });

    // 3. Log activity
    await createLogDb({
      action: "Mentor Transferred",
      entityType: "User",
      entityId: newMentorId,
      user: user.id,
      userRole: user.role,
      details: `Transferred mentorship of batch ${oldAssignment.batch.name} from ${oldAssignment.mentor.name} to ${newMentor.name}`,
      status: "success"
    }, tx);

    // 4. Send notifications
    try {
      // Notify new mentor
      await orchestratorService.triggerNotification({
        eventName: "MENTOR_ASSIGNED",
        target: { type: "USER", filter: { userId: newMentorId } },
        data: {
          batchName: oldAssignment.batch.name
        },
        channels: ["in-app"]
      });

      // Notify old mentor
      await orchestratorService.triggerNotification({
        eventName: "MENTOR_TRANSFERRED",
        target: { type: "USER", filter: { userId: oldAssignment.mentorId } },
        data: {
          batchName: oldAssignment.batch.name
        },
        channels: ["in-app"]
      });
    } catch (notifErr) {
      console.error("Failed to trigger transfer notifications:", notifErr);
    }

    return { oldAssignment: updatedOldAssignment, newAssignment };
  });
};

/**
 * Atomically releases a mentor assignment
 */
export const releaseAssignmentDb = async (id, reason, targetStatus = MENTOR_ASSIGNMENT_STATUS.COMPLETED, user) => {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.mentorAssignment.findUnique({
      where: { id },
      include: {
        mentor: { select: { id: true, name: true, email: true } },
        batch: { select: { id: true, name: true } }
      }
    });

    if (!existing) {
      throw createError("Assignment not found", 404);
    }

    if (existing.status !== MENTOR_ASSIGNMENT_STATUS.ACTIVE) {
      throw createError(`Cannot release assignment. Current status is ${existing.status}`, 409);
    }

    if (user.role === ROLES.ADMIN && existing.organizationId !== (user.organizationId || user.organization)) {
      throw createError("Not authorized to release this assignment", 403);
    }

    const updatedAssignment = await tx.mentorAssignment.update({
      where: { id },
      data: {
        status: targetStatus.toUpperCase(),
        endedAt: new Date(),
        remarks: reason
      },
      include: {
        mentor: { select: { id: true, name: true, email: true } },
        batch: { select: { id: true, name: true } }
      }
    });

    await createLogDb({
      action: targetStatus.toUpperCase() === MENTOR_ASSIGNMENT_STATUS.COMPLETED ? "Assignment Completed" : "Assignment Cancelled",
      entityType: "User",
      entityId: updatedAssignment.mentorId,
      user: user.id,
      userRole: user.role,
      details: `Released mentor ${updatedAssignment.mentor.name} from batch ${updatedAssignment.batch.name}. Reason: ${reason}`,
      status: "success"
    }, tx);

    const students = await tx.student.findMany({
      where: { batchId: updatedAssignment.batchId },
      select: { id: true }
    });
    const studentIds = students.map(s => s.id);

    // Trigger Notifications outside of transaction (best practice, but we do it here inside since await doesn't throw)
    try {
      await orchestratorService.triggerNotification({
        eventName: "MENTOR_RELEASED",
        target: { type: "USER", filter: { userId: updatedAssignment.mentorId } },
        data: {
          batchName: updatedAssignment.batch.name,
          reason
        },
        channels: ["in-app"]
      });

      if (studentIds.length > 0) {
        await orchestratorService.triggerNotification({
          eventName: "MENTOR_RELEASED",
          target: [
            { type: "STUDENT", filter: { studentIds } },
            { type: "PARENT", filter: { studentIds } }
          ],
          data: {
            batchName: updatedAssignment.batch.name,
            message: "The mentor for your batch has been unassigned."
          },
          channels: ["in-app"]
        });
      }
    } catch (notifErr) {
      console.error("Failed to trigger assignment release notification:", notifErr);
    }

    return updatedAssignment;
  });
};
