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
    data: passes,
    pagination,
  });
});

export const updatePass = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const { id } = req.params;
  
  const pass = await getPassByIdDb(id);
  if (!pass) return sendError(res, 404, "Pass not found");

  if (pass.returnTracking && pass.returnTracking.leftHostelAt) {
    return sendError(res, 422, "Cannot edit pass after student has left the hostel.");
  }
  if (["cancelled", "rejected", "completed", "returned"].includes(pass.status)) {
    return sendError(res, 422, `Cannot edit pass in status ${pass.status}`);
  }

  const allowedFields = ["reason", "fromDate", "toDate", "totalDays", "date", "outTime", "expectedReturnTime"];
  const updateQuery = { $set: {} };
  
  let isEdited = false;
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateQuery.$set[field] = req.body[field];
      isEdited = true;
    }
  });

  if (!isEdited) return sendError(res, 400, "No changes provided");

  updateQuery.$set["changeInfo.edited"] = true;
  updateQuery.$set["changeInfo.editedBy"] = userRole;
  updateQuery.$set["changeInfo.editedAt"] = new Date();
  
  let newStatus = pass.status;
  let resetParent = false;
  let resetWarden = false;
  
  if (userRole === "student") {
    if (pass.status === "pending_warden" || pass.status === "approved") {
      resetParent = true;
      resetWarden = true;
      newStatus = "pending_parent";
    }
  } else if (userRole === "parent") {
    if (pass.status === "approved" || pass.status === "pending_warden") {
      resetWarden = true;
      newStatus = "pending_warden";
    }
  }
  
  updateQuery.$set.status = newStatus;
  
  if (resetParent) {
    updateQuery.$set["parentApproval.status"] = "pending";
    updateQuery.$set["parentApproval.remarks"] = "";
  }
  if (resetWarden) {
    updateQuery.$set["wardenApproval.status"] = "pending";
    updateQuery.$set["wardenApproval.remarks"] = "";
  }

  const timelineEvents = [
    {
      action: userRole === "student" ? "student_edited_leave" : "parent_edited_leave",
      actorId: userId,
      actorRole: userRole,
      remarks: "Leave request modified.",
      timestamp: new Date()
    }
  ];

  if (resetParent || resetWarden) {
    timelineEvents.push({
      action: "approval_reset",
      actorId: userId,
      actorRole: "system",
      remarks: "Approvals reset due to leave modification.",
      timestamp: new Date(Date.now() + 10)
    });
  }

  const updatedPass = await Pass.findByIdAndUpdate(
    id,
    {
      ...updateQuery,
      $push: {
        timeline: { $each: timelineEvents }
      }
    },
    { new: true }
  );
  
  if (userRole === "student") {
    await Notification.create({
      recipient: updatedPass.parentId,
      title: "Leave Modified",
      message: `Your ward updated their pass request.`,
      type: "info"
    });
  } else if (userRole === "parent") {
    const Hostel = (await import("../hostels/hostel.model.js")).default;
    const hostel = await Hostel.findById(updatedPass.hostelId);
    if (hostel && hostel.wardens && hostel.wardens.length > 0) {
      await Notification.insertMany(hostel.wardens.map(wardenId => ({
        recipient: wardenId,
        title: "Leave Modified",
        message: `A parent modified a pass request for their ward.`,
        type: "info"
      })));
    }
  }

  return sendSuccess(res, 200, "Pass updated successfully", updatedPass);
});

export const cancelPass = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const { id } = req.params;

  const pass = await getPassByIdDb(id);
  if (!pass) return sendError(res, 404, "Pass not found");

  if (["cancelled", "rejected", "completed", "returned"].includes(pass.status)) {
    return sendError(res, 422, `Cannot cancel pass in status ${pass.status}`);
  }

  let requiresReapproval = false;
  let newStatus = pass.status;
  
  if (userRole === "student") {
    if (pass.status === "approved" || pass.status === "pending_warden") {
      requiresReapproval = true;
      newStatus = "pending_parent";
    }
  } else if (userRole === "parent") {
    if (pass.status === "approved") {
      requiresReapproval = true;
      newStatus = "pending_warden";
    }
  }

  if (requiresReapproval) {
    const updateQuery = {
      $set: {
        "cancellationRequest.requested": true,
        "cancellationRequest.requestedBy": userRole,
        "cancellationRequest.reason": "User requested cancellation.",
        status: newStatus
      },
      $push: {
        timeline: {
          action: userRole === "student" ? "student_cancelled_request" : "parent_cancelled_request",
          actorId: userId,
          actorRole: userRole,
          remarks: "Requested cancellation of pass.",
          timestamp: new Date()
        }
      }
    };
    
    if (userRole === "student") {
      updateQuery.$set["parentApproval.status"] = "pending";
      updateQuery.$set["parentApproval.remarks"] = "";
      updateQuery.$set["wardenApproval.status"] = "pending";
      updateQuery.$set["wardenApproval.remarks"] = "";
    } else if (userRole === "parent") {
      updateQuery.$set["wardenApproval.status"] = "pending";
      updateQuery.$set["wardenApproval.remarks"] = "";
    }

    const updatedPass = await Pass.findByIdAndUpdate(id, updateQuery, { new: true });
    
    if (userRole === "student") {
      await Notification.create({ recipient: updatedPass.parentId, title: "Cancellation Requested", message: "Student requested cancellation of a pass.", type: "info" });
    }
    return sendSuccess(res, 200, "Cancellation requested. Awaiting approval.", updatedPass);
  }

  const updatedPass = await Pass.findByIdAndUpdate(id, {
    $set: { status: "cancelled" },
    $push: {
      timeline: {
        action: "cancelled",
        actorId: userId,
        actorRole: userRole,
        remarks: "Pass cancelled.",
        timestamp: new Date()
      }
    }
  }, { new: true });

  return sendSuccess(res, 200, "Pass cancelled successfully", updatedPass);
});



export const getPasses = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const parent = await getParentDb(parentId);

  if (!parent || !parent.studentId) {
    return sendError(res, 404, "Parent or linked student not found");
  }

  const { passes, pagination } = await getPassesDb(parent.studentId, req.query);
  return sendSuccess(res, 200, "Passes fetched successfully", { data: passes, pagination });
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

  const isCancellation = pass.cancellationRequest && pass.cancellationRequest.requested;
  
  const statusUpdate = "pending_warden";
  const parentStatus = "approved";
  const timelineAction = "parent_approved";
  let defaultRemark = "Approved by parent";

  if (isCancellation) {
    defaultRemark = "Cancellation request approved by parent";
  }

  const updatedPass = await Pass.findByIdAndUpdate(
    id,
    {
      $set: {
        status: statusUpdate,
        "parentApproval.status": parentStatus,
        "parentApproval.actionBy": parentId,
        "parentApproval.actionAt": new Date(),
        "parentApproval.remarks": remarks || ""
      },
      $push: {
        timeline: {
          action: timelineAction,
          actorId: parentId,
          actorRole: "parent",
          remarks: remarks || defaultRemark,
          timestamp: new Date()
        }
      }
    },
    { new: true }
  ).populate("studentId", "name admissionNo roomNo");

  const Hostel = (await import("../hostels/hostel.model.js")).default;
  const hostel = await Hostel.findById(updatedPass.hostelId);
  if (hostel && hostel.wardens && hostel.wardens.length > 0) {
    await Notification.insertMany(hostel.wardens.map(wardenId => ({
      recipient: wardenId,
      title: isCancellation ? "Cancellation Approved by Parent" : "Pass Approved by Parent",
      message: `A parent approved a ${isCancellation ? "cancellation " : ""}request. Awaiting warden approval.`,
      type: "info"
    })));
  }

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

  const { passes, pagination } = await getWardenPassesDb(hostel._id, req.query);
  return sendSuccess(res, 200, "Passes fetched successfully", { data: passes, pagination });
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
  const { remarks } = req.body;
  
  const hostel = await getWardenHostelDb(wardenId);
  if (!hostel) return sendError(res, 403, "No active hostel assignment found.");

  const pass = await Pass.findOne({ _id: id, hostelId: hostel._id });
  if (!pass) return sendError(res, 404, "Pass not found.");

  if (pass.status !== "pending_warden") {
    return sendError(res, 422, `Pass cannot be approved in current status: ${pass.status}`);
  }

  const isCancellation = pass.cancellationRequest && pass.cancellationRequest.requested;

  const updateQuery = {
    $set: {
      status: isCancellation ? "cancelled" : "approved",
      "wardenApproval.status": "approved",
      "wardenApproval.actionBy": wardenId,
      "wardenApproval.actionAt": new Date(),
      "wardenApproval.remarks": remarks || "Approved by warden"
    },
    $push: {
      timeline: {
        action: "warden_approved",
        actorId: wardenId,
        actorRole: "warden",
        remarks: remarks || "Approved by warden",
        timestamp: new Date()
      }
    }
  };

  const updatedPass = await updateWardenPassWorkflowDb(id, hostel._id, updateQuery);

  // Notify student
  await Notification.create({
    recipient: updatedPass.studentId._id,
    title: isCancellation ? "Cancellation Approved" : "Pass Approved",
    message: isCancellation ? "Your pass cancellation request has been approved." : `Your pass has been approved by the warden.`,
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
        status: "cancelled"
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


