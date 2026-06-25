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

// --- Amendment Controllers ---

export const studentAmendPass = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const pass = req.pass;

  if (pass.studentId.toString() !== studentId) {
    return sendError(res, 403, "You can only amend your own passes.");
  }

  const { amendmentType, reason, proposedDates } = req.body;

  const activeAmendment = {
    requestedBy: studentId,
    requesterRole: "student",
    amendmentType,
    previous: {
      fromDate: pass.fromDate,
      toDate: pass.toDate,
      totalDays: pass.totalDays,
      date: pass.date,
      outTime: pass.outTime,
      expectedReturnTime: pass.expectedReturnTime
    },
    proposed: proposedDates || {},
    reason,
    parentApproval: { status: "pending" },
    wardenApproval: { status: "pending" },
    status: "pending",
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) 
  };

  const updatedPass = await Pass.findOneAndUpdate(
    { _id: pass._id, activeAmendment: null },
    { 
      $set: { activeAmendment },
      $push: {
        timeline: {
          action: amendmentType === "date_change" ? "student_requested_change" : "student_requested_cancellation",
          actorId: studentId,
          actorRole: "student",
          remarks: reason,
          timestamp: new Date()
        }
      }
    },
    { new: true }
  );

  if (!updatedPass) {
    return sendError(res, 409, "Could not create amendment. It may have already been amended.");
  }

  await Notification.create({
    recipient: pass.parentId,
    title: "Amendment Requested",
    message: `Your ward requested a ${amendmentType.replace("_", " ")} for their pass.`,
    type: "info"
  });

  return sendSuccess(res, 200, "Amendment requested successfully", updatedPass);
});

export const parentAmendPass = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const pass = req.pass; 

  if (pass.parentId.toString() !== parentId) {
    return sendError(res, 403, "You can only amend passes for your linked student.");
  }

  const { amendmentType, reason, proposedDates } = req.body;

  const activeAmendment = {
    requestedBy: parentId,
    requesterRole: "parent",
    amendmentType,
    previous: {
      fromDate: pass.fromDate,
      toDate: pass.toDate,
      totalDays: pass.totalDays,
      date: pass.date,
      outTime: pass.outTime,
      expectedReturnTime: pass.expectedReturnTime
    },
    proposed: proposedDates || {},
    reason,
    parentApproval: { status: "not_required" },
    wardenApproval: { status: "pending" },
    status: "pending",
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  };

  const updatedPass = await Pass.findOneAndUpdate(
    { _id: pass._id, activeAmendment: null },
    { 
      $set: { activeAmendment },
      $push: {
        timeline: {
          action: amendmentType === "date_change" ? "parent_requested_change" : "parent_requested_cancellation",
          actorId: parentId,
          actorRole: "parent",
          remarks: reason,
          timestamp: new Date()
        }
      }
    },
    { new: true }
  );

  if (!updatedPass) {
    return sendError(res, 409, "Could not create amendment. It may have already been amended.");
  }
  
  return sendSuccess(res, 200, "Amendment requested successfully", updatedPass);
});

export const parentApproveAmendment = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const { id } = req.params;

  const pass = await Pass.findOne({ _id: id, parentId });
  if (!pass) return sendError(res, 404, "Pass not found.");

  if (!pass.activeAmendment || pass.activeAmendment.status !== "pending") {
    return sendError(res, 422, "No pending amendment to approve.");
  }

  if (pass.activeAmendment.parentApproval.status !== "pending") {
    return sendError(res, 422, "Parent approval is not pending for this amendment.");
  }

  const updatedPass = await Pass.findOneAndUpdate(
    { _id: id, "activeAmendment.status": "pending", "activeAmendment.parentApproval.status": "pending" },
    {
      $set: {
        "activeAmendment.parentApproval.status": "approved",
        "activeAmendment.parentApproval.actionAt": new Date(),
        "activeAmendment.parentApproval.remarks": "Approved by parent"
      },
      $push: {
        timeline: {
          action: "parent_approved_amendment",
          actorId: parentId,
          actorRole: "parent",
          remarks: "Approved student's amendment request.",
          timestamp: new Date()
        }
      }
    },
    { new: true }
  );

  if (!updatedPass) {
    return sendError(res, 409, "Could not approve amendment. State has changed.");
  }

  return sendSuccess(res, 200, "Amendment approved by parent successfully", updatedPass);
});

export const parentRejectAmendment = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const { id } = req.params;
  const { remarks } = req.body;

  const pass = await Pass.findOne({ _id: id, parentId });
  if (!pass) return sendError(res, 404, "Pass not found.");

  if (!pass.activeAmendment || pass.activeAmendment.status !== "pending") {
    return sendError(res, 422, "No pending amendment to reject.");
  }

  if (pass.activeAmendment.parentApproval.status !== "pending") {
    return sendError(res, 422, "Parent approval is not pending for this amendment.");
  }

  const updatedPass = await Pass.findOneAndUpdate(
    { _id: id, "activeAmendment.status": "pending", "activeAmendment.parentApproval.status": "pending" },
    {
      $set: {
        activeAmendment: null 
      },
      $push: {
        timeline: {
          action: "parent_rejected_amendment",
          actorId: parentId,
          actorRole: "parent",
          remarks: remarks,
          timestamp: new Date()
        }
      }
    },
    { new: true }
  );

  if (!updatedPass) {
    return sendError(res, 409, "Could not reject amendment. State has changed.");
  }

  await Notification.create({
    recipient: pass.studentId,
    title: "Amendment Rejected",
    message: `Your parent rejected your pass amendment request.`,
    type: "error"
  });

  return sendSuccess(res, 200, "Amendment rejected by parent successfully", updatedPass);
});

export const wardenApproveAmendment = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const { id } = req.params;

  const hostel = await getWardenHostelDb(wardenId);
  if (!hostel) return sendError(res, 403, "No active hostel assignment found.");

  const pass = await Pass.findOne({ _id: id, hostelId: hostel._id });
  if (!pass) return sendError(res, 404, "Pass not found.");

  if (!pass.activeAmendment || pass.activeAmendment.status !== "pending") {
    return sendError(res, 422, "No pending amendment to approve.");
  }

  if (pass.activeAmendment.parentApproval.status === "pending") {
    return sendError(res, 422, "Cannot approve. Parent approval is still pending.");
  }

  const amendment = pass.activeAmendment;
  const updateQuery = {
    $set: { activeAmendment: null },
    $push: {
      timeline: {
        action: "warden_approved_amendment",
        actorId: wardenId,
        actorRole: "warden",
        remarks: "Warden approved the amendment.",
        timestamp: new Date()
      }
    }
  };

  if (amendment.amendmentType === "date_change") {
    if (pass.passType === "home_pass") {
      updateQuery.$set.fromDate = amendment.proposed.fromDate;
      updateQuery.$set.toDate = amendment.proposed.toDate;
      updateQuery.$set.totalDays = amendment.proposed.totalDays;
    } else {
      updateQuery.$set.date = amendment.proposed.date;
      updateQuery.$set.outTime = amendment.proposed.outTime;
      updateQuery.$set.expectedReturnTime = amendment.proposed.expectedReturnTime;
    }
    updateQuery.$push.timeline = {
      action: "amendment_applied",
      actorId: wardenId,
      actorRole: "warden",
      remarks: "Applied new dates.",
      timestamp: new Date(Date.now() + 10)
    };
  } else if (amendment.amendmentType === "cancellation") {
    updateQuery.$set.status = "cancelled";
    updateQuery.$push.timeline = {
      action: "amendment_cancelled",
      actorId: wardenId,
      actorRole: "warden",
      remarks: "Applied cancellation.",
      timestamp: new Date(Date.now() + 10)
    };
  }

  const updatedPass = await Pass.findOneAndUpdate(
    { 
      _id: id, 
      hostelId: hostel._id, 
      "activeAmendment.status": "pending",
      "activeAmendment.parentApproval.status": { $ne: "pending" }
    },
    updateQuery,
    { new: true }
  );

  if (!updatedPass) {
    return sendError(res, 409, "Race condition detected or pass state changed. Could not apply amendment.");
  }

  await Notification.create({
    recipient: pass.studentId,
    title: "Amendment Approved",
    message: `Your pass amendment request has been approved by the warden.`,
    type: "success"
  });

  return sendSuccess(res, 200, "Amendment approved and applied successfully", updatedPass);
});

export const wardenRejectAmendment = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const { id } = req.params;
  const { remarks } = req.body;

  const hostel = await getWardenHostelDb(wardenId);
  if (!hostel) return sendError(res, 403, "No active hostel assignment found.");

  const pass = await Pass.findOne({ _id: id, hostelId: hostel._id });
  if (!pass) return sendError(res, 404, "Pass not found.");

  if (!pass.activeAmendment || pass.activeAmendment.status !== "pending") {
    return sendError(res, 422, "No pending amendment to reject.");
  }

  const updatedPass = await Pass.findOneAndUpdate(
    { _id: id, hostelId: hostel._id, "activeAmendment.status": "pending" },
    {
      $set: { activeAmendment: null },
      $push: {
        timeline: {
          action: "warden_rejected_amendment",
          actorId: wardenId,
          actorRole: "warden",
          remarks: remarks,
          timestamp: new Date()
        }
      }
    },
    { new: true }
  );

  if (!updatedPass) {
    return sendError(res, 409, "Race condition detected. Could not reject amendment.");
  }

  await Notification.create({
    recipient: pass.studentId,
    title: "Amendment Rejected",
    message: `Your pass amendment request has been rejected by the warden. Reason: ${remarks}`,
    type: "error"
  });

  return sendSuccess(res, 200, "Amendment rejected successfully", updatedPass);
});

export const wardenAdminCancelPass = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const { id } = req.params;
  const { remarks } = req.body;

  const hostel = await getWardenHostelDb(wardenId);
  if (!hostel) return sendError(res, 403, "No active hostel assignment found.");

  const pass = await Pass.findOne({ _id: id, hostelId: hostel._id });
  if (!pass) return sendError(res, 404, "Pass not found.");

  if (["completed", "cancelled", "rejected", "returned"].includes(pass.status)) {
    return sendError(res, 422, `Cannot administratively cancel a pass with status ${pass.status}`);
  }

  if (pass.returnTracking && pass.returnTracking.leftHostelAt) {
    return sendError(res, 422, "Cannot cancel. Student has already left the hostel.");
  }

  const updatedPass = await Pass.findOneAndUpdate(
    { _id: id, hostelId: hostel._id, status: { $nin: ["completed", "cancelled", "rejected", "returned"] }, "returnTracking.leftHostelAt": null },
    {
      $set: { 
        status: "cancelled",
        activeAmendment: null 
      },
      $push: {
        timeline: {
          action: "admin_cancelled",
          actorId: wardenId,
          actorRole: "warden",
          remarks: `Administrative Cancellation: ${remarks}`,
          timestamp: new Date()
        }
      }
    },
    { new: true }
  );

  if (!updatedPass) {
    return sendError(res, 409, "Pass state changed. Could not apply administrative cancellation.");
  }

  await Notification.create({
    recipient: pass.studentId,
    title: "Pass Cancelled (Admin)",
    message: `Your pass has been cancelled by the warden due to administrative reasons. Reason: ${remarks}`,
    type: "error"
  });
  
  await Notification.create({
    recipient: pass.parentId,
    title: "Pass Cancelled (Admin)",
    message: `A pass for your ward has been cancelled by the warden due to administrative reasons. Reason: ${remarks}`,
    type: "error"
  });

  return sendSuccess(res, 200, "Pass administratively cancelled successfully", updatedPass);
});


