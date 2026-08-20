

import { prisma } from "../../config/prisma.js";
import AppError from "../../utils/AppError.js";
import { orchestratorService } from "../notification/services/orchestrator.service.js";
import {
  getStudentById,
  getHostelById,
  findActiveAllocation,
  createAllocation,
  syncHostelOrganizations,
  getHostelHistoryDb,
  getStudentHostelTimelineDb,
  updateAllocationStatus,
} from "./studentHostel.repository.js";

// ---------------------------------------------------------------------------
// CROSS-MODULE DEPENDENCY STUBS
// ---------------------------------------------------------------------------
// TODO: MIGRATION - Implement these when their respective modules are migrated.

const validateFurnitureClearance = async (studentId) => {
  // Returns immediately. Migration pending.
};

const validateAttendanceForTransfer = async (studentId, oldHostelId) => {
  // Returns immediately. Migration pending.
};

const handlePassesForTransfer = async (
  studentId,
  oldHostelId,
  newHostelId,
  actor,
  tx,
) => {
  // Returns immediately. Migration pending.
};

const handleStudentHostelChangeVisitor = async (studentId, tx, actor) => {
  // Returns immediately. Migration pending.
};

const addHostelTransferContextToComplaints = async (
  studentId,
  allocationId,
  actor,
  tx,
) => {
  // Returns immediately. Migration pending.
};



// ---------------------------------------------------------------------------
// STUBS FOR CROSS-MODULE INTEGRATIONS (VACATE)
// ---------------------------------------------------------------------------

const validateStudentNotOutside = async (studentId) => {
  // Returns immediately. Migration pending.
};

const handleAttendanceForVacate = async (studentId, hostelId, tx, actorId) => {
  // Returns immediately. Migration pending.
};

const cancelActionablePasses = async (studentId, actor, tx) => {
  // Returns immediately. Migration pending.
};

const handleStudentVacateVisitor = async (studentId, tx, actor) => {
  // Returns immediately. Migration pending.
};

const addHostelVacateContextToComplaints = async (studentId, allocationId, actor, tx) => {
  // Returns immediately. Migration pending.
};
/**
 * Allocates a student to a new hostel (initial allocation).
 * Orchestrates pre-flight validation and Prisma transaction.
 */
const allocateStudentToHostelService = async (
  studentId,
  hostelId,
  roomNumber,
  { reason, remarks, joinedAt } = {},
  currentUser,
) => {

  // Rule 1 — Student must exist
  const student = await getStudentById(studentId);
  if (!student) {
    throw new AppError("Student not found", 404);
  }

  // Rule 2 — Student must be active
  if (!student.isActive) {
    throw new AppError("Student is not active", 400);
  }

  // Rule 3 — Hostel must exist
  const hostel = await getHostelById(hostelId);
  if (!hostel) {
    throw new AppError("Hostel not found", 404);
  }

  // Rule 4 — Hostel must be active
  if (!hostel.isActive) {
    throw new AppError("Hostel is not active", 400);
  }

  // Rule 5 — Student must not have an existing active allocation
  // MongoDB: StudentHostelAllocation.findOne({ studentId, status: "active" })
  const existingAllocation = await findActiveAllocation(studentId);
  if (existingAllocation) {
    throw new AppError("Student is already allocated to a hostel", 400);
  }

  // -------------------------------------------------------------------------
  // PHASE 2: Atomic writes — Prisma interactive transaction
  //
  // MongoDB equivalent:
  //   session.startTransaction()
  //   allocation.save({ session })
  //   student.save({ session })          ← hostelId / roomNumber / hostelStatus
  //   syncHostelOrganizations(session)
  //   session.commitTransaction()
  // -------------------------------------------------------------------------

  const joinedAtDate = joinedAt ? new Date(joinedAt) : new Date();
  const actorId = currentUser.id || currentUser._id;

  const { newAllocation, updatedStudent } = await prisma.$transaction(
    async (tx) => {
      // Step 1 — Create the allocation record (MongoDB: allocation.save)
      const newAllocation = await createAllocation(tx, {
        studentId,
        organizationId: student.organizationId,
        hostelId,
        roomNumber: roomNumber.trim(),
        allocatedById: actorId,
        joinedAt: joinedAtDate,
        reason: reason ?? null,
        remarks: remarks ?? null,
      });

      // Step 2 — Sync hostel ↔ organization membership (MongoDB: syncHostelOrganizations)
      await syncHostelOrganizations(tx, hostelId);

      return { newAllocation };
    },
  );

  // -------------------------------------------------------------------------
  // PHASE 3: Shape the response to match MongoDB's return contract exactly.
  //
  // MongoDB allocateHostelInternal returns:
  //   { allocation, student, oldHostelId: null }
  //
  // updateStudentHostelService wraps it as:
  //   { action: "allocated", allocation, student, oldHostelId: null }
  //
  // The controller reads:
  //   result.action               → determines HTTP 201 vs 200
  //   result.student._id          → used in activity log
  //   result.student.name         → used in activity log / notification
  //   result.student.roomNumber   → used in activity log
  //   result.oldHostelId          → used in socket event (vacate path)
  // -------------------------------------------------------------------------
  return {
    action: "allocated", // DEVIATION 4 fix — matches MongoDB

    allocation: {
      _id: newAllocation.id, // _id for MongoDB-style API consumers
      id: newAllocation.id,
      studentId: newAllocation.studentId,
      hostelId: newAllocation.hostelId,
      roomNumber: newAllocation.roomNumber,
      status: newAllocation.status, // "active" (matches MongoDB exactly)
      joinedAt: newAllocation.joinedAt,
      allocatedBy: newAllocation.allocatedById, // field name matches MongoDB schema field
      reason: newAllocation.reason,
      remarks: newAllocation.remarks,
      createdAt: newAllocation.createdAt,
      updatedAt: newAllocation.updatedAt,
    },

    student: {
      _id: student.id, // matches MongoDB result.student._id
      id: student.id,
      name: student.name, // DEVIATION 5 fix — "name" not "name"
      roomNumber: newAllocation.roomNumber, // derived from allocation source-of-truth for API compatibility
      hostelStatus: "active", // derived from allocation source-of-truth for API compatibility
    },

    hostel: {
      _id: hostel.id,
      id: hostel.id,
      name: hostel.name,
      code: hostel.code,
    },

    oldHostelId: null,
  };
};


/**
 * Transfers a student from their current hostel to a new one.
 */
const changeHostelInternal = async (
  studentId,
  activeAllocation,
  hostelId,
  roomNumber,
  { reason, remarks, joinedAt } = {},
  currentUser,
) => {
  // Rule 1 & 2 handled by unified dispatcher

  // Rule 3 — New Hostel must exist
  const newHostel = await getHostelById(hostelId);
  if (!newHostel) {
    throw new AppError("New hostel not found", 404);
  }

  // Rule 4 — New Hostel must be active
  if (!newHostel.isActive) {
    throw new AppError("New hostel is not active", 400);
  }

  // Rule 5 — New hostel must differ from current hostel
  if (activeAllocation.hostelId === hostelId) {
    throw new AppError("New hostel must differ from current hostel", 400);
  }

  const oldHostelId = activeAllocation.hostelId;
  const actorId = currentUser.id || currentUser._id;
  const joinedAtDate = joinedAt ? new Date(joinedAt) : new Date();

  // Preflight checks
  await Promise.all([
    validateFurnitureClearance(studentId),
    validateAttendanceForTransfer(studentId, oldHostelId),
  ]);

  const { newAllocation, student } = await prisma.$transaction(async (tx) => {
    // Re-verify student exists in tx scope
    const txStudent = await tx.student.findUnique({ where: { id: studentId } });

    // Mark old allocation as transferred
    await updateAllocationStatus(
      tx,
      activeAllocation.id,
      "transferred", // status
      actorId, // vacatedById
      reason || "Hostel Change",
    );

    // Create new allocation
    const allocation = await createAllocation(tx, {
      studentId,
      organizationId: txStudent.organizationId,
      hostelId,
      roomNumber: roomNumber.trim(),
      allocatedById: actorId,
      joinedAt: joinedAtDate,
      reason: reason ?? null,
      remarks: remarks ?? null,
    });

    // Dependent mutations
    await handlePassesForTransfer(
      studentId,
      oldHostelId,
      hostelId,
      currentUser,
      tx,
    );
    await handleStudentHostelChangeVisitor(studentId, tx, currentUser);
    await addHostelTransferContextToComplaints(
      studentId,
      activeAllocation.id,
      currentUser,
      tx,
    );

    // Sync Organizations
    await syncHostelOrganizations(tx, oldHostelId);
    await syncHostelOrganizations(tx, hostelId);

    return { newAllocation: allocation, student: txStudent };
  });

  return {
    action: "transferred",

    allocation: {
      _id: newAllocation.id,
      id: newAllocation.id,
      studentId: newAllocation.studentId,
      hostelId: newAllocation.hostelId,
      roomNumber: newAllocation.roomNumber,
      status: newAllocation.status,
      joinedAt: newAllocation.joinedAt,
      allocatedBy: newAllocation.allocatedById,
      reason: newAllocation.reason,
      remarks: newAllocation.remarks,
      createdAt: newAllocation.createdAt,
      updatedAt: newAllocation.updatedAt,
    },

    student: {
      _id: student.id,
      id: student.id,
      name: student.name,
      roomNumber: newAllocation.roomNumber,
      hostelStatus: "active",
    },

    hostel: {
      _id: newHostel.id,
      id: newHostel.id,
      name: newHostel.name,
      code: newHostel.code,
    },

    oldHostelId: oldHostelId,
  };
};


/**
 * Dispatcher service for allocating or transferring a student.
 */
export const updateStudentHostelService = async (
  studentId,
  data,
  currentUser,
) => {
  const { hostelId, roomNumber, reason, remarks, joinedAt } = data;

  // Verify Student
  const student = await getStudentById(studentId);
  if (!student) {
    throw new AppError("Student not found", 404);
  }
  if (!student.isActive) {
    throw new AppError("Student is not active", 400);
  }

  // Route to transfer or allocate
  const activeAllocation = await findActiveAllocation(studentId);
  if (activeAllocation) {
    return await changeHostelInternal(
      studentId,
      activeAllocation,
      hostelId,
      roomNumber,
      { reason, remarks, joinedAt },
      currentUser,
    );
  } else {
    // If we call allocateStudentToHostelService, it does redundant student validation,
    // but that's harmless (and keeps the helper decoupled).
    return await allocateStudentToHostelService(
      studentId,
      hostelId,
      roomNumber,
      { reason, remarks, joinedAt },
      currentUser,
    );
  }
};

/**
 * Service to orchestrate vacating a student from their current hostel.
 */
export const vacateHostelService = async (studentId, data, currentUser) => {
  const actorId = currentUser.id || currentUser._id;
  const { reason, remarks } = data || {};

  // 1. Context Loading
  const student = await getStudentById(studentId);
  if (!student) {
    throw new AppError("Student not found", 404);
  }

  const activeAllocation = await findActiveAllocation(studentId);
  if (!activeAllocation) {
    throw new AppError("Student is not currently allocated to any hostel", 400);
  }

  const oldHostelId = activeAllocation.hostelId;

  // 2. Preflight Checks
  await validateFurnitureClearance(studentId);
  await validateStudentNotOutside(studentId);

  // 3. Start Transaction
  const { updatedAllocation, txStudent } = await prisma.$transaction(async (tx) => {
    // 4. Update Allocation Status
    const alloc = await updateAllocationStatus(
      tx,
      activeAllocation.id,
      "vacated", // status
      actorId,   // vacatedById
      reason
    );

    // Re-verify student in tx (MongoDB does this for atomic guarantees)
    const txStud = await tx.student.findUnique({ where: { id: studentId } });

    // 5. Cross-Module Atomic Mutations
    await handleAttendanceForVacate(studentId, oldHostelId, tx, actorId);
    await cancelActionablePasses(studentId, currentUser, tx);
    await handleStudentVacateVisitor(studentId, tx, currentUser);
    await addHostelVacateContextToComplaints(studentId, activeAllocation.id, currentUser, tx);

    // 6. Sync Organizations
    await syncHostelOrganizations(tx, oldHostelId);

    return { updatedAllocation: alloc, txStudent: txStud };
  });

  // 7. Post-Commit Notifications
  try {
    const oldHostel = await getHostelById(oldHostelId);
    // In Prisma, we would typically fetch wardens via HostelWarden join, but mimicking exact Mongo behavior:
    const oldWardenIds = await prisma.hostelWarden.findMany({
      where: { hostelId: oldHostelId },
      select: { userId: true }
    }).then(wardens => wardens.map(w => w.userId));

    const sender = currentUser ? { id: actorId, role: currentUser.role, name: currentUser.name } : null;
    const studentName = txStudent.name;

    // Notify Student and Parent
    orchestratorService.triggerNotification({
      sender,
      eventName: "HOSTEL_VACATED",
      target: [
        { type: "STUDENT", filter: { studentIds: [studentId] } },
        { type: "PARENT", filter: { studentIds: [studentId] } }
      ],
      data: { message: "Your hostel accommodation has been successfully vacated.", studentName }
    }).catch(err => console.error(err));

    // Notify Wardens
    if (oldWardenIds.length > 0) {
      orchestratorService.triggerNotification({
        sender,
        eventName: "HOSTEL_VACATED",
        target: { type: "USER", filter: { userIds: oldWardenIds } },
        data: { message: "A student has vacated your hostel.", studentName }
      }).catch(err => console.error(err));
    }
  } catch (notifErr) {
    console.error("[Notification Error]", notifErr);
  }

  // 8. Return exactly matching MongoDB response structure
  return {
    action: "vacated",
    oldAllocation: activeAllocation,
    newAllocation: updatedAllocation,
    student: {
      ...txStudent,
      name: txStudent.name // Map for legacy compatibility if needed
    },
    oldHostelId
  };
};

/**
 * Service wrapper for retrieving paginated hostel allocation history.
 */
export const getHostelHistoryService = async (query) => {
  const result = await getHostelHistoryDb(query);

  const totalPages = Math.ceil(result.total / result.limitNumber);

  return {
    history: result.history,
    pagination: {
      totalRecords: result.total,
      totalPages: totalPages,
      currentPage: result.pageNumber,
      limit: result.limitNumber,
    }
  };
};

/**
 * Service wrapper for retrieving a student's complete allocation timeline.
 */
export const getStudentHostelTimelineService = async (studentId) => {
  const result = await getStudentHostelTimelineDb(studentId);
  return result;
};
