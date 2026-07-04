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
import { notificationRepository } from "../notifications/notification.repository.js";

const Notification = {
    async create(data) {
        return notificationRepository.createNotification({
            recipient: { id: data.recipient, model: 'User' }, // Approximated
            event: { event: 'PASS_EVENT', category: 'PASS', priority: 'NORMAL', type: data.type || 'info' },
            title: data.title,
            message: data.message,
            link: data.link,
            metadata: data.metadata,
        });
    },
    async insertMany(dataArray) {
        if (!dataArray || !dataArray.length) return;
        const mapped = dataArray.map(data => ({
            recipient: { id: data.recipient, model: 'User' }, // Approximated
            event: { event: 'PASS_EVENT', category: 'PASS', priority: 'NORMAL', type: data.type || 'info' },
            title: data.title,
            message: data.message,
            link: data.link,
            metadata: data.metadata,
        }));
        return notificationRepository.bulkCreate(mapped);
    }
};
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
    return sendError(res, 404, "We couldn't find your student account.");
  }

  if (!student.hostelId) {
    return sendError(res, 400, "It looks like you haven't been assigned to a hostel yet.");
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
      "We couldn't find a default guardian linked to your account."
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

  return sendSuccess(res, 201, "Your pass request has been submitted successfully.", newPass);
});

export const getMyPasses = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { passes, pagination } = await getStudentPassesDb(studentId, req.query);

  return sendSuccess(res, 200, "Passes loaded successfully.", {
    data: passes,
    pagination,
  });
});

export const getStudentPassDetails = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { id } = req.params;

  const pass = await getPassDetailsDb(id, studentId);
  if (!pass) {
    return sendError(res, 404, "We couldn't find the pass you're looking for.");
  }

  return sendSuccess(res, 200, "Pass details loaded successfully.", pass);
});

export const updatePass = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const { id } = req.params;

  const pass = await getPassByIdDb(id);
  if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");

  if (pass.returnTracking && pass.returnTracking.leftHostelAt) {
    return sendError(res, 422, "You cannot edit this pass because the student has already left the hostel.");
  }
  if (["cancelled", "rejected", "completed", "returned"].includes(pass.status)) {
    return sendError(res, 422, "You cannot edit this pass because of its current status.");
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

  if (!isEdited) return sendError(res, 400, "No changes were made to the pass.");

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

  return sendSuccess(res, 200, "Your pass has been updated successfully.", updatedPass);
});

// --- Management Controllers (Admin & Super Admin) ---

// Helpers for scoping
const buildAdminScope = (req) => ({
  role: "admin",
  organizationId: req.user.organization,
  actorId: req.user.id
});

const buildSuperAdminScope = (req) => ({
  role: "super_admin",
  organizationId: null,
  actorId: req.user.id
});

// Admin Wrappers
export const getAdminDashboardStats = asyncHandler(async (req, res) => {

  const stats = await getManagementDashboardStatsDb(buildAdminScope(req));
  return sendSuccess(res, 200, "Dashboard statistics loaded successfully.", stats);
});

export const getAdminHostels = asyncHandler(async (req, res) => {
  const { hostels, pagination } = await getManagementHostelsDb(buildAdminScope(req), req.query);
  return sendSuccess(res, 200, "Hostels loaded successfully.", { data: hostels, pagination });
});

export const getManagementAllPasses = asyncHandler(async (req, res) => {
  const scope = req.user.role === 'admin' ? buildAdminScope(req) : buildSuperAdminScope(req);
  const { passes, pagination } = await getManagementPassesDb(req.query, scope, null);
  return sendSuccess(res, 200, "All passes loaded successfully.", { data: passes, pagination });
});

export const getManagementHostelPasses = asyncHandler(async (req, res) => {
  const scope = req.user.role === 'admin' ? buildAdminScope(req) : buildSuperAdminScope(req);
  const { hostelId } = req.params;

  let hostelQuery = { _id: hostelId };
  if (scope.role === 'admin') hostelQuery.organizations = scope.organizationId;

  const hostel = await Hostel.findOne(hostelQuery);
  if (!hostel) {
    return sendError(res, 403, "We couldn't find this hostel, or you might not have permission to view it.");
  }

  const { passes, pagination } = await getManagementPassesDb(req.query, scope, hostelId);
  return sendSuccess(res, 200, "Passes loaded successfully.", { data: passes, pagination });
});

export const getAdminPassDetails = asyncHandler(async (req, res) => {
  const scope = buildAdminScope(req);
  const { id } = req.params;

  const pass = await getManagementPassDetailsDb(id, scope);
  if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");

  const hostel = await Hostel.findOne({ _id: pass.hostelId?._id, organizations: scope.organizationId });
  if (!hostel) {
    return sendError(res, 403, "You don't have permission to view this pass.");
  }

  return sendSuccess(res, 200, "Pass details loaded successfully.", { data: pass });
});

export const adminApprovePass = asyncHandler(async (req, res) => {
  const scope = buildAdminScope(req);
  const adminId = scope.actorId;
  const { id } = req.params;
  const { remarks } = req.body;

  const pass = await Pass.findById(id).populate("hostelId");
  if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");

  if (!pass.hostelId || !pass.hostelId.organizations || !pass.hostelId.organizations.some(org => org.toString() === scope.organizationId.toString())) {
    return sendError(res, 403, "You don't have permission to approve passes for this hostel.");
  }

  if (pass.status !== "pending_admin") {
    return sendError(res, 422, "This pass can't be approved right now because of its current status.");
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

  return sendSuccess(res, 200, "The pass has been approved.", updatedPass);
});

export const adminRejectPass = asyncHandler(async (req, res) => {
  const scope = buildAdminScope(req);
  const adminId = scope.actorId;
  const { id } = req.params;
  const { remarks } = req.body;

  const pass = await Pass.findById(id).populate("hostelId");
  if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");

  if (!pass.hostelId || !pass.hostelId.organizations || !pass.hostelId.organizations.some(org => org.toString() === scope.organizationId.toString())) {
    return sendError(res, 403, "You don't have permission to reject passes for this hostel.");
  }

  if (pass.status !== "pending_admin") {
    return sendError(res, 422, "This pass can't be rejected right now because of its current status.");
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

  return sendSuccess(res, 200, "The pass has been rejected.", updatedPass);
});

export const adminCancelPass = asyncHandler(async (req, res) => {
  const scope = buildAdminScope(req);
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim() === "") {
    return sendError(res, 400, "Please provide a reason for cancelling this pass.");
  }

  const pass = await Pass.findById(id).populate("hostelId", "organizations");
  if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");

  if (!pass.hostelId || !pass.hostelId.organizations || !pass.hostelId.organizations.some(org => org.toString() === scope.organizationId.toString())) {
    return sendError(res, 403, "You don't have permission to cancel this pass.");
  }

  const updatedPass = await managementCancelPassDb(id, reason, scope);
  if (!updatedPass) {
    return sendError(res, 409, "We couldn't cancel the pass because its status has recently changed. Please try again.");
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

  return sendSuccess(res, 200, "The pass has been successfully cancelled.", updatedPass);
});

// Super Admin Wrappers
export const getSuperAdminDashboardStats = asyncHandler(async (req, res) => {
  const stats = await getManagementDashboardStatsDb(buildSuperAdminScope(req));
  return sendSuccess(res, 200, "Dashboard statistics loaded successfully.", stats);
});

export const getSuperAdminOrganizationsHostels = asyncHandler(async (req, res) => {
  const { hostels, pagination } = await getManagementHostelsDb(buildSuperAdminScope(req), req.query);
  return sendSuccess(res, 200, "Organizations and Hostels loaded successfully.", { data: hostels, pagination });
});



export const getSuperAdminPassDetails = asyncHandler(async (req, res) => {
  const scope = buildSuperAdminScope(req);
  const { id } = req.params;

  const pass = await getManagementPassDetailsDb(id, scope);
  if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");

  return sendSuccess(res, 200, "Pass details loaded successfully.", pass);
});

export const superAdminCancelPass = asyncHandler(async (req, res) => {
  const scope = buildSuperAdminScope(req);
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim() === "") {
    return sendError(res, 400, "Please provide a reason for cancelling this pass.");
  }

  const pass = await Pass.findById(id);
  if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");

  const updatedPass = await managementCancelPassDb(id, reason, scope);
  if (!updatedPass) {
    return sendError(res, 409, "We couldn't cancel the pass because its status has recently changed. Please try again.");
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

  return sendSuccess(res, 200, "The pass has been successfully cancelled.", updatedPass);
});

export const cancelPass = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const { id } = req.params;

  const pass = await getPassByIdDb(id);
  if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");

  if (["cancelled", "rejected", "completed", "returned"].includes(pass.status)) {
    return sendError(res, 422, "This pass can't be cancelled because of its current status.");
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
    return sendSuccess(res, 200, "Your request to cancel the pass has been submitted and is awaiting approval.", updatedPass);
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

  return sendSuccess(res, 200, "Your pass has been cancelled.", updatedPass);
});



export const getPasses = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const parent = await getParentDb(parentId);

  if (!parent || !parent.studentId) {
    return sendError(res, 404, "We couldn't find your account or your linked student.");
  }

  const { passes, pagination } = await getPassesDb(parent.studentId, req.query);
  return sendSuccess(res, 200, "Passes loaded successfully.", { data: passes, pagination });
});

export const getPassDetails = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const { id } = req.params;

  const parent = await getParentDb(parentId);

  if (!parent || !parent.studentId) {
    return sendError(res, 404, "We couldn't find your account or your linked student.");
  }

  const pass = await getPassDetailsDb(id, parent.studentId);
  if (!pass) {
    return sendError(res, 404, "We couldn't find the pass you're looking for.");
  }

  return sendSuccess(res, 200, "Pass details loaded successfully.", pass);
});

export const approvePass = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const { id } = req.params;
  const { remarks } = req.body;

  const parent = await getParentDb(parentId);

  if (!parent || !parent.isActive) {
    return sendError(res, 403, "Your account is either inactive or couldn't be found.");
  }

  if (!parent.defaultGuardian) {
    return sendError(res, 403, "Only the default guardian has permission to approve passes.");
  }

  const pass = await Pass.findOne({ _id: id, studentId: parent.studentId });
  if (!pass) {
    return sendError(res, 404, "We couldn't find the pass you're looking for.");
  }

  if (pass.status !== "pending_parent") {
    return sendError(res, 400, "This pass is not waiting for your approval.");
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

  return sendSuccess(res, 200, "The pass has been successfully approved.", updatedPass);
});

export const rejectPass = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const { id } = req.params;
  const { remarks } = req.body;

  const parent = await getParentDb(parentId);

  if (!parent || !parent.isActive) {
    return sendError(res, 403, "Your account is either inactive or couldn't be found.");
  }

  if (!parent.defaultGuardian) {
    return sendError(res, 403, "Only the default guardian has permission to reject passes.");
  }

  const pass = await Pass.findOne({ _id: id, studentId: parent.studentId });

  if (!pass) {
    return sendError(res, 404, "We couldn't find the pass you're looking for.");
  }

  if (pass.status !== "pending_parent") {
    return sendError(res, 400, "This pass is not waiting for your rejection.");
  }

  const updatedPass = await updatePassApprovalDb(id, parentId, "reject", remarks);
  return sendSuccess(res, 200, "The pass has been successfully rejected.", updatedPass);
});

// --- Warden Controllers ---

export const getWardenDashboardStats = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const hostel = await getWardenHostelDb(wardenId);

  if (!hostel) {
    return sendError(res, 403, "It looks like you aren't assigned to any active hostel right now.");
  }

  const stats = await getWardenDashboardStatsDb(hostel._id);
  return sendSuccess(res, 200, "Dashboard statistics loaded successfully.", { data: stats });
});

export const getWardenPasses = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const hostel = await getWardenHostelDb(wardenId);

  if (!hostel) {
    return sendError(res, 403, "It looks like you aren't assigned to any active hostel right now.");
  }

  const { passes, pagination } = await getWardenPassesDb(hostel._id, req.query);
  return sendSuccess(res, 200, "Passes loaded successfully.", { data: passes, pagination });
});

export const getWardenPassDetails = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const { id } = req.params;
  const hostel = await getWardenHostelDb(wardenId);

  if (!hostel) {
    return sendError(res, 403, "It looks like you aren't assigned to any active hostel right now.");
  }

  const pass = await getWardenPassDetailsDb(id, hostel._id);
  if (!pass) {
    return sendError(res, 404, "We couldn't find the pass, or it might not belong to your hostel.");
  }

  return sendSuccess(res, 200, "Pass details loaded successfully.", { data: pass });
});



export const markStudentLeftHostel = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const { id } = req.params;

  const hostel = await getWardenHostelDb(wardenId);
  if (!hostel) return sendError(res, 403, "It looks like you aren't assigned to any active hostel right now.");

  const pass = await Pass.findOne({ _id: id, hostelId: hostel._id });
  if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");

  if (pass.status !== "approved") {
    return sendError(res, 422, "The student cannot leave right now because of the pass status.");
  }

  if (pass.returnTracking && pass.returnTracking.leftHostelAt) {
    return sendError(res, 409, "The student has already been marked as left.");
  }

  const updateQuery = {
    $set: {
      "returnTracking.leftHostelAt": new Date(),
      "returnTracking.markedBy": wardenId,
      "returnTracking.returnStatus": "pending"
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

  return sendSuccess(res, 200, "The student has been marked as left.", updatedPass);
});

export const markStudentReturned = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const { id } = req.params;

  const hostel = await getWardenHostelDb(wardenId);
  if (!hostel) return sendError(res, 403, "It looks like you aren't assigned to any active hostel right now.");

  const pass = await Pass.findOne({ _id: id, hostelId: hostel._id });
  if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");

  if (pass.status !== "approved") {
    return sendError(res, 422, "The pass is not in approved status.");
  }

  if (!pass.returnTracking || !pass.returnTracking.leftHostelAt) {
    return sendError(res, 422, "The student hasn't left the hostel yet.");
  }

  if (pass.returnTracking.returnedAt) {
    return sendError(res, 409, "The student is already marked as returned.");
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

  return sendSuccess(res, 200, "The student has been marked as returned.", updatedPass);
});



export const wardenAdminCancelPass = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const { id } = req.params;
  const { remarks } = req.body;

  const hostel = await getWardenHostelDb(wardenId);
  if (!hostel) return sendError(res, 403, "It looks like you aren't assigned to any active hostel right now.");

  const pass = await Pass.findOne({ _id: id, hostelId: hostel._id });
  if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");

  if (["completed", "cancelled", "rejected", "returned"].includes(pass.status)) {
    return sendError(res, 422, "This pass can't be cancelled because of its current status.");
  }

  if (pass.returnTracking && pass.returnTracking.leftHostelAt) {
    return sendError(res, 422, "You cannot cancel this pass because the student has already left the hostel.");
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
    return sendError(res, 409, "We couldn't cancel the pass because its status has recently changed. Please try again.");
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

  return sendSuccess(res, 200, "The pass has been successfully cancelled.", updatedPass);
});


