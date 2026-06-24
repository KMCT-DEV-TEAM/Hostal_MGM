import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import {
  createPassDb,
  getStudentPassesDb,
  getPassByIdDb,
  updatePassDb,
  addTimelineEventDb,
} from "./pass.service.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";

export const createPass = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const {
    passType,
    reason,
    fromDate,
    toDate,
    totalDays,
    date,
    outTime,
    expectedReturnTime,
  } = req.body;

  const student = await Student.findById(studentId);
  if (!student) {
    return sendError(res, 404, "Student not found");
  }

  if (!student.hostelId) {
    return sendError(res, 400, "Student is not assigned to a hostel");
  }

  const parent = await Parent.findOne({
    studentId,
    isActive: true,
    defaultGuardian: true,
  });

  if (!parent) {
    return sendError(
      res,
      400,
      "No default guardian configured for this student"
    );
  }

  const passData = {
    hostelId: student.hostelId,
    studentId,
    parentId: parent._id,
    passType,
    reason,
    timeline: [
      {
        action: "created",
        actorId: studentId,
        actorRole: "student",
        remarks: "Pass request submitted.",
      },
    ],
  };

  if (passType === "home_pass") {
    passData.fromDate = fromDate;
    passData.toDate = toDate;
    passData.totalDays = totalDays;
  } else if (passType === "out_pass") {
    passData.date = date;
    passData.outTime = outTime;
    passData.expectedReturnTime = expectedReturnTime;
  }

  const newPass = await createPassDb(passData);

  return sendSuccess(res, 201, "Pass request created successfully", newPass);
});

export const getMyPasses = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { passes, pagination } = await getStudentPassesDb(studentId, req.query);

  return sendSuccess(res, 200, "Passes fetched successfully", {
    passes,
    pagination,
  });
});

export const updatePass = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { id } = req.params;
  console.log(id)
  const pass = await getPassByIdDb(id);
  if (!pass) {
    return sendError(res, 404, "Pass not found");
  }

  if (pass.studentId.toString() !== studentId) {
    return sendError(res, 403, "You do not have permission to edit this pass");
  }

  if (pass.status !== "pending_parent" && pass.status !== "pending_warden") {
    return sendError(res, 400, "Pass cannot be edited in its current status");
  }

  const allowedFields = [
    "reason",
    "fromDate",
    "toDate",
    "totalDays",
    "date",
    "outTime",
    "expectedReturnTime",
  ];

  const updateData = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const updatedPass = await updatePassDb(id, updateData);

  await addTimelineEventDb(id, {
    action: "updated",
    actorId: studentId,
    actorRole: "student",
    remarks: "Pass details updated by student.",
  });

  return sendSuccess(res, 200, "Pass updated successfully", updatedPass);
});

export const cancelPass = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { id } = req.params;

  const updatedPass = await updatePassDb(id, { status: "cancelled" });

  await addTimelineEventDb(id, {
    action: "cancelled",
    actorId: studentId,
    actorRole: "student",
    remarks: "Pass request cancelled by student.",
  });

  return sendSuccess(res, 200, "Pass cancelled successfully", updatedPass);
});
