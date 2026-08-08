import mongoose from "mongoose";
import StudentHostelAllocation from "./studentHostel.model.js";
import Student from "../students/student.model.js";
import Hostel from "../hostels/hostel.model.js";
import FurnitureAsset from "../furnitures/furnitureAsset.model.js";
import FurnitureAssetHistory from "../furnitures/furnitureAssetHistory.model.js";
import { syncHostelOrganizations } from "../hostels/hostel.service.js";
import { orchestratorService } from "../notifications/services/orchestrator.service.js";
import Parent from "../parents/parent.model.js";

// New Domain Helpers
import { validateFurnitureClearance } from "../furnitures/furniture.service.js";
import { validateAttendanceForTransfer, handleAttendanceForVacate } from "../attendance/attendance.service.js";
import { handlePassesForTransfer, cancelActionablePasses, validateStudentNotOutside } from "../passes/pass.service.js";
import { handleStudentHostelChangeVisitor, handleStudentVacateVisitor } from "../visitor/visitor.service.js";
import { addHostelTransferContextToComplaints, addHostelVacateContextToComplaints } from "../complaints/complaint.service.js";

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
  // 1. Context Loading
  const [student, activeAllocation, newHostel] = await Promise.all([
    Student.findById(studentId).lean(),
    StudentHostelAllocation.findOne({ studentId, status: "active" }).lean(),
    Hostel.findById(data.hostelId).lean()
  ]);

  if (!student) throw Object.assign(new Error("Student not found"), { statusCode: 404 });
  if (!student.isActive) throw Object.assign(new Error("This student is not active"), { statusCode: 400 });
  if (!activeAllocation) throw Object.assign(new Error("Student is not currently allocated to any hostel"), { statusCode: 400 });

  if (!newHostel) throw Object.assign(new Error("New hostel not found"), { statusCode: 404 });
  if (!newHostel.isActive) throw Object.assign(new Error("New hostel is not active"), { statusCode: 400 });

  // if (newHostel.organizationId && student.organizationId && newHostel.organizationId.toString() !== student.organizationId.toString()) {
  //     throw Object.assign(new Error("New hostel does not belong to the student's organization"), { statusCode: 400 });
  // }

  if (activeAllocation.hostelId.toString() === data.hostelId.toString()) {
    throw Object.assign(new Error("New hostel must differ from current hostel"), { statusCode: 400 });
  }

  const oldHostelId = activeAllocation.hostelId;

  // 2. Preflight Checks
  await Promise.all([
    validateFurnitureClearance(studentId),
    validateAttendanceForTransfer(studentId, oldHostelId)
  ]);

  // 3. Start Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  let newAllocation;
  try {
    // 4. Revalidate Critical State & Conditional Updates
    const allocUpdate = await StudentHostelAllocation.updateOne(
      { _id: activeAllocation._id, status: "active" },
      {
        $set: {
          status: "transferred",
          vacatedAt: new Date(),
          vacatedBy: actor._id || actor.id,
          reason: data.reason || "Hostel Change"
        }
      },
      { session }
    );
    if (allocUpdate.modifiedCount !== 1) throw Object.assign(new Error("Conflict: Allocation already modified"), { statusCode: 409 });

    const studentUpdate = await Student.updateOne(
      { _id: studentId, hostelId: oldHostelId, hostelStatus: "active" },
      { $set: { hostelId: data.hostelId, roomNumber: data.roomNumber, hostelStatus: "active" } },
      { session }
    );
    if (studentUpdate.modifiedCount !== 1) throw Object.assign(new Error("Conflict: Student hostel state changed concurrently"), { statusCode: 409 });

    newAllocation = new StudentHostelAllocation({
      studentId: student._id,
      organizationId: student.organizationId,
      hostelId: data.hostelId,
      roomNumber: data.roomNumber,
      status: "active",
      allocatedBy: actor._id || actor.id,
      joinedAt: data.joinedAt || new Date(),
      reason: data.reason,
      remarks: data.remarks,
    });
    await newAllocation.save({ session });

    // 5. Atomic Mutations (Dependencies)
    const passSyncResult = await handlePassesForTransfer(studentId, oldHostelId, data.hostelId, actor, session);
    await handleStudentHostelChangeVisitor(studentId, session, actor);
    await addHostelTransferContextToComplaints(studentId, activeAllocation._id, actor, session);

    await syncHostelOrganizations(oldHostelId, session);
    await syncHostelOrganizations(data.hostelId, session);

    // 6. Commit
    await session.commitTransaction();
    console.log("changeHostelInternal -> SUCCESS", { newAllocationId: newAllocation._id, oldAllocationId: activeAllocation._id, studentId: student._id });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  // 7. Post-Commit Notifications
  try {
    const oldWardenIds = (await Hostel.findById(oldHostelId).select("wardens").lean())?.wardens?.map(id => id.toString()) || [];
    const newWardenIds = newHostel.wardens?.map(id => id.toString()) || [];

    orchestratorService.triggerNotification({
      eventName: 'HOSTEL_TRANSFERRED',
      target: [
        { type: 'STUDENT', filter: { studentIds: [studentId.toString()] } },
        { type: 'PARENT', filter: { studentIds: [studentId.toString()] } }
      ],
      data: { message: "Your hostel accommodation has been changed." }
    }).catch(err => console.error(err));

    if (newWardenIds.length > 0) {
      orchestratorService.triggerNotification({
        eventName: 'HOSTEL_TRANSFERRED',
        target: { type: 'USER', filter: { userIds: newWardenIds } },
        data: { message: "A new student has joined your hostel." }
      }).catch(err => console.error(err));
    }

    if (oldWardenIds.length > 0) {
      orchestratorService.triggerNotification({
        eventName: 'HOSTEL_TRANSFERRED',
        target: { type: 'USER', filter: { userIds: oldWardenIds } },
        data: { message: "A student has been transferred out of your hostel." }
      }).catch(err => console.error(err));
    }
  } catch (notifErr) {
    console.error("[Notification Error]", notifErr);
  }

  return {
    oldAllocation: activeAllocation,
    newAllocation,
    student,
    oldHostelId
  };
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
  // 1. Context Loading
  const [student, activeAllocation] = await Promise.all([
    Student.findById(studentId).lean(),
    StudentHostelAllocation.findOne({ studentId, status: "active" }).lean()
  ]);

  if (!student) throw Object.assign(new Error("Student not found"), { statusCode: 404 });
  if (!activeAllocation) throw Object.assign(new Error("Student is not currently allocated to any hostel"), { statusCode: 400 });

  const oldHostelId = activeAllocation.hostelId;

  // 2. Preflight Checks
  await Promise.all([
    validateFurnitureClearance(studentId),
    validateStudentNotOutside(studentId)
  ]);

  // 3. Start Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 4. Revalidate Critical State & Conditional Updates
    const allocUpdate = await StudentHostelAllocation.updateOne(
      { _id: activeAllocation._id, status: "active" },
      {
        $set: {
          status: "vacated",
          vacatedAt: new Date(),
          vacatedBy: actor._id || actor.id,
          reason: data.reason,
          remarks: data.remarks
        }
      },
      { session }
    );
    if (allocUpdate.modifiedCount !== 1) throw Object.assign(new Error("Conflict: Allocation already modified"), { statusCode: 409 });

    const studentUpdate = await Student.updateOne(
      { _id: studentId, hostelId: oldHostelId, hostelStatus: "active" },
      { $set: { hostelId: null, roomNumber: null, hostelStatus: "inactive" } },
      { session }
    );
    if (studentUpdate.modifiedCount !== 1) throw Object.assign(new Error("Conflict: Student hostel state changed concurrently"), { statusCode: 409 });

    // 5. Atomic Mutations (Dependencies)
    await handleAttendanceForVacate(studentId, oldHostelId, session, actor._id || actor.id);
    await cancelActionablePasses(studentId, actor, session);
    await handleStudentVacateVisitor(studentId, session, actor);
    await addHostelVacateContextToComplaints(studentId, activeAllocation._id, actor, session);

    await syncHostelOrganizations(oldHostelId, session);

    // 6. Commit
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  // 7. Post-Commit Notifications
  try {
    const oldWardenIds = (await Hostel.findById(oldHostelId).select("wardens").lean())?.wardens?.map(id => id.toString()) || [];

    orchestratorService.triggerNotification({
      eventName: 'HOSTEL_VACATED',
      target: [
        { type: 'STUDENT', filter: { studentIds: [studentId.toString()] } },
        { type: 'PARENT', filter: { studentIds: [studentId.toString()] } }
      ],
      data: { message: "Your hostel accommodation has been successfully vacated." }
    }).catch(err => console.error(err));

    if (oldWardenIds.length > 0) {
      orchestratorService.triggerNotification({
        eventName: 'HOSTEL_VACATED',
        target: { type: 'USER', filter: { userIds: oldWardenIds } },
        data: { message: "A student has vacated your hostel." }
      }).catch(err => console.error(err));
    }
  } catch (notifErr) {
    console.error("[Notification Error]", notifErr);
  }

  return { allocation: activeAllocation, student, oldHostelId };
};
