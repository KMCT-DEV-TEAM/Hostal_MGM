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
  updateWardenPassWorkflowDb,
  getManagementDashboardStatsDb,
  getManagementHostelsDb,
  getManagementPassesDb,
  getManagementPassDetailsDb,
  managementCancelPassDb
} from "./pass.service.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import Notification from "../notifications/notification.model.js";
import Pass from "./pass.model.js";
import Hostel from "../hostels/hostel.model.js";

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
    outPassCategory
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
    passData.outPassCategory = outPassCategory;
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

export const getStudentPassDetails = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { id } = req.params;

  const pass = await getPassDetailsDb(id, studentId);
  if (!pass) {
    return sendError(res, 404, "Pass not found");
  }

  return sendSuccess(res, 200, "Pass details fetched successfully", pass);
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

  const allowedFields = ["reason", "fromDate", "toDate", "totalDays", "date", "outTime", "expectedReturnTime", "outPassCategory"];
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
  let resetAdmin = false;

  if (userRole === "student") {
    if (pass.status === "pending_admin" || pass.status === "approved") {
      resetParent = true;
      resetAdmin = true;
      newStatus = "pending_parent";
    }
  } else if (userRole === "parent") {
    if (pass.status === "approved" || pass.status === "pending_admin") {
      resetAdmin = true;
      newStatus = "pending_admin";
    }
  }

  updateQuery.$set.status = newStatus;

  if (resetParent) {
    updateQuery.$set["parentApproval.status"] = "pending";
    updateQuery.$set["parentApproval.remarks"] = "";
  }
  if (resetAdmin) {
    updateQuery.$set["adminApproval.status"] = "pending";
    updateQuery.$set["adminApproval.remarks"] = "";
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

  if (resetParent) {
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
    if (hostel) {
      const User = (await import("../users/user.model.js")).default;
      const admins = await User.find({ role: "admin", organization: { $in: hostel.organizations } }).select("_id").lean();
      if (admins && admins.length > 0) {
        await Notification.insertMany(admins.map(admin => ({
          recipient: admin._id,
          title: "Leave Modified",
          message: `A parent modified a pass request for their ward.`,
          type: "info"
        })));
      }
    }
  }

  return sendSuccess(res, 200, "Pass updated successfully", updatedPass);
});

// --- Management Controllers (Admin & Super Admin) ---

// Helpers for scoping
const buildAdminScope = (req) => ({
  role: "admin",
  organizationId: req.user.organization,
  actorId: req.user.id
});

const buildSuperAdminScope = (req) => ({
  role: "superadmin",
  organizationId: null,
  actorId: req.user.id
});

// Admin Wrappers
export const getAdminDashboardStats = asyncHandler(async (req, res) => {

  console.log(req.user)
  const stats = await getManagementDashboardStatsDb(buildAdminScope(req));
  return sendSuccess(res, 200, "Dashboard stats fetched successfully", stats);
});

export const getAdminHostels = asyncHandler(async (req, res) => {
  const hostels = await getManagementHostelsDb(buildAdminScope(req));
  return sendSuccess(res, 200, "Hostels fetched successfully", hostels);
});

export const getAdminPasses = asyncHandler(async (req, res) => {
  const scope = buildAdminScope(req);
  const { hostelId } = req.params;

  const hostel = await Hostel.findOne({ _id: hostelId, organizations: scope.organizationId });
  if (!hostel) {
    return sendError(res, 403, "Hostel not found or you do not have permission to access it.");
  }

  const { passes, pagination } = await getManagementPassesDb(hostelId, req.query, scope);
  return sendSuccess(res, 200, "Passes fetched successfully", { data: passes, pagination });
});

export const getAdminPassDetails = asyncHandler(async (req, res) => {
  const scope = buildAdminScope(req);
  const { id } = req.params;

  const pass = await getManagementPassDetailsDb(id, scope);
  if (!pass) return sendError(res, 404, "Pass not found.");

  const hostel = await Hostel.findOne({ _id: pass.hostelId?._id, organizations: scope.organizationId });
  if (!hostel) {
    return sendError(res, 403, "You do not have permission to view this pass.");
  }

  return sendSuccess(res, 200, "Pass details fetched successfully", pass);
});

export const adminApprovePass = asyncHandler(async (req, res) => {
  const scope = buildAdminScope(req);
  const adminId = scope.actorId;
  const { id } = req.params;
  const { remarks } = req.body;

  const pass = await Pass.findById(id).populate("hostelId");
  if (!pass) return sendError(res, 404, "Pass not found.");

  if (!pass.hostelId || !pass.hostelId.organizations || !pass.hostelId.organizations.some(org => org.toString() === scope.organizationId.toString())) {
    return sendError(res, 403, "You do not have permission to approve passes for this hostel.");
  }

  if (pass.status !== "pending_admin") {
    return sendError(res, 422, `Pass cannot be approved in current status: ${pass.status}`);
  }

  const isCancellation = pass.cancellationRequest && pass.cancellationRequest.requested;

  const updateQuery = {
    $set: {
      status: isCancellation ? "cancelled" : "approved",
      "adminApproval.status": "approved",
      "adminApproval.actionBy": adminId,
      "adminApproval.actionAt": new Date(),
      "adminApproval.remarks": remarks || "Approved by admin"
    },
    $push: {
      timeline: {
        action: "admin_approved",
        actorId: adminId,
        actorRole: "admin",
        remarks: remarks || "Approved by admin",
        timestamp: new Date()
      }
    }
  };

  const updatedPass = await Pass.findByIdAndUpdate(id, updateQuery, { new: true }).populate("studentId");

  // Notify student
  await Notification.create({
    recipient: updatedPass.studentId._id,
    title: isCancellation ? "Cancellation Approved" : "Pass Approved",
    message: isCancellation ? "Your pass cancellation request has been approved." : `Your pass has been approved by the admin.`,
    type: "success"
  });

  // Notify parent
  if (updatedPass.parentId) {
    await Notification.create({
      recipient: updatedPass.parentId,
      title: isCancellation ? "Cancellation Approved" : "Pass Approved",
      message: isCancellation ? "Your ward's pass cancellation request has been approved." : `Your ward's pass has been approved by the admin.`,
      type: "success"
    });
  }

  // Notify assigned warden
  const Hostel = (await import("../hostels/hostel.model.js")).default;
  const hostel = await Hostel.findById(updatedPass.hostelId);
  if (hostel && hostel.wardens && hostel.wardens.length > 0) {
    await Notification.insertMany(hostel.wardens.map(wardenId => ({
      recipient: wardenId,
      title: isCancellation ? "Cancellation Approved" : "Pass Approved",
      message: `A pass request for a student in your hostel was approved by the admin.`,
      type: "info"
    })));
  }

  return sendSuccess(res, 200, "Pass approved successfully", updatedPass);
});

export const adminRejectPass = asyncHandler(async (req, res) => {
  const scope = buildAdminScope(req);
  const adminId = scope.actorId;
  const { id } = req.params;
  const { remarks } = req.body;

  const pass = await Pass.findById(id).populate("hostelId");
  if (!pass) return sendError(res, 404, "Pass not found.");

  if (!pass.hostelId || !pass.hostelId.organizations || !pass.hostelId.organizations.some(org => org.toString() === scope.organizationId.toString())) {
    return sendError(res, 403, "You do not have permission to reject passes for this hostel.");
  }

  if (pass.status !== "pending_admin") {
    return sendError(res, 422, `Pass cannot be rejected in current status: ${pass.status}`);
  }

  const updateQuery = {
    $set: {
      status: "rejected",
      "adminApproval.status": "rejected",
      "adminApproval.actionBy": adminId,
      "adminApproval.actionAt": new Date(),
      "adminApproval.remarks": remarks
    },
    $push: {
      timeline: {
        action: "admin_rejected",
        actorId: adminId,
        actorRole: "admin",
        remarks: remarks,
        timestamp: new Date()
      }
    }
  };

  const updatedPass = await Pass.findByIdAndUpdate(id, updateQuery, { new: true }).populate("studentId");

  await Notification.create({
    recipient: updatedPass.studentId._id,
    title: "Pass Rejected",
    message: `Your pass request was rejected by administration. Reason: ${remarks}`,
    type: "error"
  });

  if (updatedPass.parentId) {
    await Notification.create({
      recipient: updatedPass.parentId,
      title: "Pass Rejected",
      message: `Your ward's pass request was rejected by administration. Reason: ${remarks}`,
      type: "error"
    });
  }

  const Hostel = (await import("../hostels/hostel.model.js")).default;
  const hostel = await Hostel.findById(updatedPass.hostelId);
  if (hostel && hostel.wardens && hostel.wardens.length > 0) {
    await Notification.insertMany(hostel.wardens.map(wId => ({
      recipient: wId,
      title: "Pass Rejected",
      message: `A pass request for a student in your hostel was rejected by the admin.`,
      type: "info"
    })));
  }

  return sendSuccess(res, 200, "Pass rejected successfully", updatedPass);
});

export const adminCancelPass = asyncHandler(async (req, res) => {
  const scope = buildAdminScope(req);
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim() === "") {
    return sendError(res, 400, "Administrative cancellation requires a reason.");
  }

  const pass = await Pass.findById(id).populate("hostelId", "organizations");
  if (!pass) return sendError(res, 404, "Pass not found.");

  if (!pass.hostelId || !pass.hostelId.organizations || !pass.hostelId.organizations.some(org => org.toString() === scope.organizationId.toString())) {
    return sendError(res, 403, "You do not have permission to cancel this pass.");
  }

  const updatedPass = await managementCancelPassDb(id, reason, scope);
  if (!updatedPass) {
    return sendError(res, 409, "Pass state changed. Could not apply administrative cancellation.");
  }

  await Notification.create({
    recipient: updatedPass.studentId,
    title: "Pass Cancelled (Admin)",
    message: `Your pass has been cancelled by administration. Reason: ${reason}`,
    type: "error"
  });

  if (updatedPass.parentId) {
    await Notification.create({
      recipient: updatedPass.parentId,
      title: "Pass Cancelled (Admin)",
      message: `Your ward's pass has been cancelled by administration. Reason: ${reason}`,
      type: "error"
    });
  }

  return sendSuccess(res, 200, "Pass cancelled administratively successfully", updatedPass);
});

// Super Admin Wrappers
export const getSuperAdminDashboardStats = asyncHandler(async (req, res) => {
  const stats = await getManagementDashboardStatsDb(buildSuperAdminScope(req));
  return sendSuccess(res, 200, "Super Admin Dashboard stats fetched successfully", stats);
});

export const getSuperAdminOrganizationsHostels = asyncHandler(async (req, res) => {
  const orgHostels = await getManagementHostelsDb(buildSuperAdminScope(req));
  return sendSuccess(res, 200, "Organizations and Hostels fetched successfully", orgHostels);
});

export const getSuperAdminPasses = asyncHandler(async (req, res) => {
  const scope = buildSuperAdminScope(req);
  const { hostelId } = req.params;

  const hostel = await Hostel.findById(hostelId);
  if (!hostel) {
    return sendError(res, 404, "Hostel not found.");
  }

  const { passes, pagination } = await getManagementPassesDb(hostelId, req.query, scope);
  return sendSuccess(res, 200, "Passes fetched successfully", { data: passes, pagination });
});

export const getSuperAdminPassDetails = asyncHandler(async (req, res) => {
  const scope = buildSuperAdminScope(req);
  const { id } = req.params;

  const pass = await getManagementPassDetailsDb(id, scope);
  if (!pass) return sendError(res, 404, "Pass not found.");

  return sendSuccess(res, 200, "Pass details fetched successfully", pass);
});

export const superAdminCancelPass = asyncHandler(async (req, res) => {
  const scope = buildSuperAdminScope(req);
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim() === "") {
    return sendError(res, 400, "Administrative cancellation requires a reason.");
  }

  const pass = await Pass.findById(id);
  if (!pass) return sendError(res, 404, "Pass not found.");

  const updatedPass = await managementCancelPassDb(id, reason, scope);
  if (!updatedPass) {
    return sendError(res, 409, "Pass state changed. Could not apply administrative cancellation.");
  }

  await Notification.create({
    recipient: updatedPass.studentId,
    title: "Pass Cancelled (Super Admin)",
    message: `Your pass has been cancelled by administration. Reason: ${reason}`,
    type: "error"
  });

  if (updatedPass.parentId) {
    await Notification.create({
      recipient: updatedPass.parentId,
      title: "Pass Cancelled (Super Admin)",
      message: `Your ward's pass has been cancelled by administration. Reason: ${reason}`,
      type: "error"
    });
  }

  return sendSuccess(res, 200, "Pass cancelled administratively successfully", updatedPass);
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
    if (pass.status === "approved" || pass.status === "pending_admin") {
      requiresReapproval = true;
      newStatus = "pending_parent";
    }
  } else if (userRole === "parent") {
    if (pass.status === "approved") {
      requiresReapproval = true;
      newStatus = "pending_admin";
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
      updateQuery.$set["adminApproval.status"] = "pending";
      updateQuery.$set["adminApproval.remarks"] = "";
    } else if (userRole === "parent") {
      updateQuery.$set["adminApproval.status"] = "pending";
      updateQuery.$set["adminApproval.remarks"] = "";
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

  const statusUpdate = "pending_admin";
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
  if (hostel) {
    const User = (await import("../users/user.model.js")).default;
    const admins = await User.find({ role: "admin", organizationId: hostel.organizationId }).select("_id").lean();
    if (admins && admins.length > 0) {
      await Notification.insertMany(admins.map(admin => ({
        recipient: admin._id,
        title: isCancellation ? "Cancellation Approved by Parent" : "Pass Approved by Parent",
        message: `A parent approved a ${isCancellation ? "cancellation " : ""}request. Awaiting admin approval.`,
        type: "info"
      })));
    }
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


