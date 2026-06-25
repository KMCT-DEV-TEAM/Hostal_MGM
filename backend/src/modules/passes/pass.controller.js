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
  getParentDb,
  getWardenHostelDb,
  getWardenDashboardStatsDb,
  getWardenPassesDb,
  getWardenPassDetailsDb,
  updateWardenPassWorkflowDb
} from "./pass.service.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import Notification from "../notifications/notification.model.js";
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

// --- Warden Controllers ---

export const getWardenDashboardStats = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const hostel = await getWardenHostelDb(wardenId);

  if (!hostel) {
    return sendError(res, 403, "No active hostel assignment found for this warden.");
  }

  const stats = await getWardenDashboardStatsDb(hostel._id);
  return sendSuccess(res, 200, "Dashboard stats fetched successfully", stats);
});

export const getWardenPasses = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const hostel = await getWardenHostelDb(wardenId);

  if (!hostel) {
    return sendError(res, 403, "No active hostel assignment found for this warden.");
  }

  const data = await getWardenPassesDb(hostel._id, req.query);
  return sendSuccess(res, 200, "Passes fetched successfully", data);
});

export const getWardenPassDetails = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const { id } = req.params;
  const hostel = await getWardenHostelDb(wardenId);

  if (!hostel) {
    return sendError(res, 403, "No active hostel assignment found.");
  }

  const pass = await getWardenPassDetailsDb(id, hostel._id);
  if (!pass) {
    return sendError(res, 404, "Pass not found or does not belong to your hostel.");
  }

  return sendSuccess(res, 200, "Pass details fetched successfully", pass);
});

export const approveWardenPass = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const { id } = req.params;
  
  const hostel = await getWardenHostelDb(wardenId);
  if (!hostel) return sendError(res, 403, "No active hostel assignment found.");

  const pass = await Pass.findOne({ _id: id, hostelId: hostel._id });
  if (!pass) return sendError(res, 404, "Pass not found.");

  if (pass.status !== "pending_warden") {
    return sendError(res, 422, `Pass cannot be approved in current status: ${pass.status}`);
  }

  const updateQuery = {
    $set: {
      status: "approved",
      "wardenApproval.status": "approved",
      "wardenApproval.actionBy": wardenId,
      "wardenApproval.actionAt": new Date(),
      "wardenApproval.remarks": "Approved by warden"
    },
    $push: {
      timeline: {
        action: "warden_approved",
        actorId: wardenId,
        actorRole: "warden",
        remarks: "Approved by warden",
        timestamp: new Date()
      }
    }
  };

  const updatedPass = await updateWardenPassWorkflowDb(id, hostel._id, updateQuery);

  // Notify student
  await Notification.create({
    recipient: updatedPass.studentId._id,
    title: "Pass Approved",
    message: `Your pass has been approved by the warden.`,
    type: "success"
  });

  return sendSuccess(res, 200, "Pass approved successfully", updatedPass);
});

export const rejectWardenPass = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const { id } = req.params;
  const { remarks } = req.body;
  
  const hostel = await getWardenHostelDb(wardenId);
  if (!hostel) return sendError(res, 403, "No active hostel assignment found.");

  const pass = await Pass.findOne({ _id: id, hostelId: hostel._id });
  if (!pass) return sendError(res, 404, "Pass not found.");

  if (pass.status !== "pending_warden") {
    return sendError(res, 422, `Pass cannot be rejected in current status: ${pass.status}`);
  }

  const updateQuery = {
    $set: {
      status: "rejected",
      "wardenApproval.status": "rejected",
      "wardenApproval.actionBy": wardenId,
      "wardenApproval.actionAt": new Date(),
      "wardenApproval.remarks": remarks
    },
    $push: {
      timeline: {
        action: "warden_rejected",
        actorId: wardenId,
        actorRole: "warden",
        remarks: remarks,
        timestamp: new Date()
      }
    }
  };

  const updatedPass = await updateWardenPassWorkflowDb(id, hostel._id, updateQuery);

  await Notification.create({
    recipient: updatedPass.studentId._id,
    title: "Pass Rejected",
    message: `Your pass request was rejected. Reason: ${remarks}`,
    type: "error"
  });

  return sendSuccess(res, 200, "Pass rejected successfully", updatedPass);
});

export const markStudentLeftHostel = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const { id } = req.params;
  
  const hostel = await getWardenHostelDb(wardenId);
  if (!hostel) return sendError(res, 403, "No active hostel assignment found.");

  const pass = await Pass.findOne({ _id: id, hostelId: hostel._id });
  if (!pass) return sendError(res, 404, "Pass not found.");

  if (pass.status !== "approved") {
    return sendError(res, 422, `Student cannot leave. Pass status is ${pass.status}`);
  }

  if (pass.returnTracking && pass.returnTracking.leftHostelAt) {
    return sendError(res, 409, "Student has already been marked as left.");
  }

  const updateQuery = {
    $set: {
      "returnTracking.leftHostelAt": new Date(),
      "returnTracking.markedBy": wardenId
    },
    $push: {
      timeline: {
        action: "updated",
        actorId: wardenId,
        actorRole: "warden",
        remarks: "Student left the hostel.",
        timestamp: new Date()
      }
    }
  };

  const updatedPass = await updateWardenPassWorkflowDb(id, hostel._id, updateQuery);

  await Notification.create({
    recipient: updatedPass.studentId._id,
    title: "Hostel Exit",
    message: `You have been marked as left the hostel. Have a safe trip!`,
    type: "info"
  });

  return sendSuccess(res, 200, "Student marked as left successfully", updatedPass);
});

export const markStudentReturned = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const { id } = req.params;
  
  const hostel = await getWardenHostelDb(wardenId);
  if (!hostel) return sendError(res, 403, "No active hostel assignment found.");

  const pass = await Pass.findOne({ _id: id, hostelId: hostel._id });
  if (!pass) return sendError(res, 404, "Pass not found.");

  if (!pass.returnTracking || !pass.returnTracking.leftHostelAt) {
    return sendError(res, 422, "Student has not left the hostel yet.");
  }

  if (pass.returnTracking.returnedAt) {
    return sendError(res, 409, "Student is already marked as returned.");
  }

  const returnedAt = new Date();
  
  // Calculate on-time / late
  let returnStatus = "on_time";
  if (pass.passType === "home_pass" && pass.toDate) {
    const expectedEnd = new Date(pass.toDate);
    expectedEnd.setUTCHours(23, 59, 59, 999);
    if (returnedAt > expectedEnd) returnStatus = "late";
  } else if (pass.passType === "out_pass" && pass.date && pass.expectedReturnTime) {
    const [hours, minutes] = pass.expectedReturnTime.split(":");
    const expectedEnd = new Date(pass.date);
    expectedEnd.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);
    if (returnedAt > expectedEnd) returnStatus = "late";
  }

  const updateQuery = {
    $set: {
      status: "returned", 
      "returnTracking.returnedAt": returnedAt,
      "returnTracking.returnStatus": returnStatus
    },
    $push: {
      timeline: {
        action: "returned",
        actorId: wardenId,
        actorRole: "warden",
        remarks: `Student returned ${returnStatus.replace("_", " ")}.`,
        timestamp: returnedAt
      }
    }
  };

  const updatedPass = await updateWardenPassWorkflowDb(id, hostel._id, updateQuery);

  await Notification.create({
    recipient: updatedPass.studentId._id,
    title: "Hostel Return",
    message: `You have been marked as returned to the hostel. Status: ${returnStatus.replace("_", " ")}`,
    type: "info"
  });

  return sendSuccess(res, 200, "Student marked as returned successfully", updatedPass);
});

