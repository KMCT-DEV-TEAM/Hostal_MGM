import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import {
  createPassDb,
  getStudentPassesDb,
  getPassByIdDb,
  updatePassDb,
  addTimelineEventDb,
  getDashboardStatsDb,
  getPassesDb,
  getPassDetailsDb,
  updatePassApprovalDb,
  getParentDb
} from "./pass.service.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import Pass from "./pass.model.js";

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



export const getPasses = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const parent = await getParentDb(parentId);

  if (!parent || !parent.studentId) {
    return sendError(res, 404, "Parent or linked student not found");
  }

  const { passes, pagination } = await getPassesDb(parent.studentId, req.query);
  return sendSuccess(res, 200, "Passes fetched successfully", { passes, pagination });
});

export const getPassDetails = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const { id } = req.params;

  const parent = await getParentDb(parentId);

  if (!parent || !parent.studentId) {
    return sendError(res, 404, "Parent or linked student not found");
  }

  const pass = await getPassDetailsDb(id, parent.studentId);
  if (!pass) {
    return sendError(res, 404, "Pass not found");
  }

  return sendSuccess(res, 200, "Pass details fetched successfully", pass);
});

export const approvePass = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const { id } = req.params;
  const { remarks } = req.body;

  const parent = await getParentDb(parentId);

  if (!parent || !parent.isActive) {
    return sendError(res, 403, "Parent account is inactive or not found");
  }

  if (!parent.defaultGuardian) {
    return sendError(res, 403, "Only the default guardian can approve passes");
  }



  const pass = await Pass.findOne({ _id: id, studentId: parent.studentId });
  if (!pass) {
    return sendError(res, 404, "Pass not found");
  }

  if (pass.status !== "pending_parent") {
    return sendError(res, 400, "Pass is not pending parent approval");
  }

  const updatedPass = await updatePassApprovalDb(id, parentId, "approve", remarks);
  return sendSuccess(res, 200, "Pass approved successfully", updatedPass);
});

export const rejectPass = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const { id } = req.params;
  const { remarks } = req.body;

  const parent = await getParentDb(parentId);

  if (!parent || !parent.isActive) {
    return sendError(res, 403, "Parent account is inactive or not found");
  }

  if (!parent.defaultGuardian) {
    return sendError(res, 403, "Only the default guardian can reject passes");
  }

  const pass = await Pass.findOne({ _id: id, studentId: parent.studentId });

  if (!pass) {
    return sendError(res, 404, "Pass not found");
  }

  if (pass.status !== "pending_parent") {
    return sendError(res, 400, "Pass is not pending parent approval");
  }

  const updatedPass = await updatePassApprovalDb(id, parentId, "reject", remarks);
  return sendSuccess(res, 200, "Pass rejected successfully", updatedPass);
});
