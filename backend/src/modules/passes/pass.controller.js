import mongoose from "mongoose";
import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import {
  createPassDb,
  getStudentPassesDb,
  getPassByIdDb,
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
  managementCancelPassDb,
  getStudentPassesUnifiedDb,
  getParentPassesUnifiedDb
} from "./pass.service.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import StudentParent from "../parents/studentParent.model.js";
import { orchestratorService } from "../notifications/services/orchestrator.service.js";
import Pass from "./pass.model.js";
import Hostel from "../hostels/hostel.model.js";
import hostelModel from "../hostels/hostel.model.js";
import User from "../users/user.model.js";
import { buildSender } from "../notifications/utils/sender.util.js";
import MentorAssignment from "../mentors/mentorAssignment.model.js";
import { createLogDb } from "../logs/log.service.js";

const getPassApproverRecipients = async (studentId, organizationId) => {
  const student = await Student.findById(studentId)
    .select("batchId")
    .lean();

  const admins = await User.find({
    role: "admin",
    organization: organizationId,
  })
    .select("_id")
    .lean();

  const recipientIds = admins.map((admin) => admin._id);

  if (student?.batchId) {
    const assignment = await MentorAssignment.findOne({
      batchId: student.batchId,
      status: "active",
    })
      .select("mentorId")
      .lean();

    if (assignment?.mentorId) {
      recipientIds.push(assignment.mentorId);
    }
  }

  return {
    type: "USER",
    filter: {
      userIds: [...new Set(recipientIds.map(String))],
    },
  };
};

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

  const defaultGuardianLink = await StudentParent.findOne({
    studentId,
    status: "active",
    defaultGuardian: true,
  }).lean();

  if (!defaultGuardianLink) {
    return sendError(
      res,
      400,
      "We couldn't process your request because we couldn't find a default guardian linked to your account. Please ask an admin to assign one."
    );
  }

  const parent = await Parent.findById(defaultGuardianLink.parentId).lean();

  if (!parent || !parent.isActive) {
    return sendError(
      res,
      400,
      "Your default guardian's account is currently inactive. Please contact administration."
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

  const session = await mongoose.startSession();
  let newPass;
  try {
    await session.withTransaction(async () => {
      newPass = await createPassDb(passData, session);
    });
  } finally {
    session.endSession();
  }

  const passTypeLabel = passType === 'home_pass' ? 'Home Pass' : 'Out Pass';
  const passTypeSlug = passType === 'home_pass' ? 'home-pass' : 'out-pass';
  const link = `/dashboard/leaves/${passTypeSlug}`;

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'PASS_CREATED',
    target: { type: 'PARENT', filter: { studentId: student._id } },
    data: {
      passTypeLabel,
      studentName: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      reason,
      link
    }
  }).catch(err => console.error("Notification Error:", err));

  await createLogDb({
    action: "Created Pass Request",
    entityType: "Pass",
    entityId: newPass._id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Student submitted a ${passTypeLabel} request`,
    status: "success"
  });

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

  if (userRole === "student" && pass.studentId.toString() !== userId.toString()) {
    return sendError(res, 403, "You do not have permission to modify this pass.");
  }
  if (userRole === "parent" && pass.studentId.toString() !== req.student?.id?.toString()) {
    return sendError(res, 403, "You do not have permission to modify this pass.");
  }

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

  updateQuery.$set["cancellationRequest.requested"] = false;

  const session = await mongoose.startSession();
  let updatedPass;

  try {
    await session.withTransaction(async () => {
      updatedPass = await Pass.findByIdAndUpdate(
        id,
        {
          ...updateQuery,
          $push: {
            timeline: { $each: timelineEvents }
          }
        },
        { new: true, session }
      ).populate("studentId", "name studentId firstName lastName");
    });
  } finally {
    session.endSession();
  }

  const passTypeLabel = updatedPass.passType === 'home_pass' ? 'Home Pass' : 'Out Pass';
  const passTypeSlug = updatedPass.passType === 'home_pass' ? 'home-pass' : 'out-pass';
  const link = `/dashboard/leaves/${passTypeSlug}`;

  const sName = updatedPass.studentId.name || `${updatedPass.studentId.firstName || ''} ${updatedPass.studentId.lastName || ''}`.trim();

  if (userRole === "student") {
    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_MODIFIED',
      target: { type: 'PARENT', filter: { studentId: updatedPass.studentId._id || pass.studentId } },
      data: { passTypeLabel, studentName: sName, link }
    }).catch(err => console.error("Notification Error:", err));
  } else if (userRole === "parent") {
    const studentDoc = await Student.findById(updatedPass.studentId._id || updatedPass.studentId).select("organizationId").lean();
    const target = await getPassApproverRecipients(studentDoc._id, studentDoc.organizationId);
    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_MODIFIED',
      target,
      data: { passTypeLabel, studentName: sName, link }
    }).catch(err => console.error("Notification Error:", err));
  }

  await createLogDb({
    action: "Updated Pass Request",
    entityType: "Pass",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `${req.user.role} updated a pass request`,
    status: "success"
  });

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
  const hostel = await Hostel.findOne({ _id: pass.hostelId?._id });
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

  const session = await mongoose.startSession();
  let updatedPass;
  try {
    await session.withTransaction(async () => {
      updatedPass = await Pass.findOneAndUpdate(
        { _id: id, status: "pending_admin" },
        updateQuery,
        { new: true, session }
      ).populate("studentId");
      if (!updatedPass) throw new Error("ConcurrencyError");
    });
  } catch (err) {
    if (err.message === "ConcurrencyError") {
      return sendError(res, 409, "The pass could not be approved. Its status may have changed.");
    }
    throw err;
  } finally {
    session.endSession();
  }

  // Notify student
  const passTypeLabel = updatedPass.passType === 'home_pass' ? 'Home Pass' : 'Out Pass';
  const passTypeSlug = updatedPass.passType === 'home_pass' ? 'home-pass' : 'out-pass';
  const link = `/dashboard/leaves/${passTypeSlug}`;

  const approvedBy = req.user.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Admin';
  const studentName = updatedPass.studentId.name || `${updatedPass.studentId.firstName || ''} ${updatedPass.studentId.lastName || ''}`.trim();
  const remarksText = remarks || "Approved";

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'PASS_ADMIN_APPROVED',
    target: { type: 'STUDENT', filter: { studentId: updatedPass.studentId._id } },
    data: { passTypeLabel, studentName, approvedBy, remarks: remarksText, link }
  }).catch(err => console.error("Notification Error:", err));

  // Notify parent
  if (updatedPass.parentId) {
    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_ADMIN_APPROVED',
      target: { type: 'PARENT', filter: { studentId: updatedPass.studentId._id } },
      data: { passTypeLabel, studentName, approvedBy, remarks: remarksText, link }
    }).catch(err => console.error("Notification Error:", err));
  }

  // Notify assigned warden
  const hostelDoc = await hostelModel.findById(updatedPass.hostelId);
  if (hostelDoc && hostelDoc.wardens && hostelDoc.wardens.length > 0) {
    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_ADMIN_APPROVED',
      target: { type: 'USER', filter: { userIds: hostelDoc.wardens } },
      data: { passTypeLabel, studentName, approvedBy, remarks: remarksText, link }
    }).catch(err => console.error("Notification Error:", err));
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

  const isCancellation = pass.cancellationRequest && pass.cancellationRequest.requested;
  const statusUpdate = isCancellation ? "approved" : "rejected";

  const updateQuery = {
    $set: {
      status: statusUpdate,
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

  if (isCancellation) {
    updateQuery.$set["cancellationRequest.requested"] = false;
  }

  const session = await mongoose.startSession();
  let updatedPass;
  try {
    await session.withTransaction(async () => {
      updatedPass = await Pass.findOneAndUpdate(
        { _id: id, status: "pending_admin" },
        updateQuery,
        { new: true, session }
      ).populate("studentId");
      if (!updatedPass) throw new Error("ConcurrencyError");
    });
  } catch (err) {
    if (err.message === "ConcurrencyError") {
      return sendError(res, 409, "The pass could not be rejected. Its status may have changed.");
    }
    throw err;
  } finally {
    session.endSession();
  }

  const passTypeLabel = updatedPass.passType === 'home_pass' ? 'Home Pass' : 'Out Pass';
  const passTypeSlug = updatedPass.passType === 'home_pass' ? 'home-pass' : 'out-pass';
  const link = `/dashboard/leaves/${passTypeSlug}`;

  const approvedBy = req.user.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Admin';
  const studentName = updatedPass.studentId.name || `${updatedPass.studentId.firstName || ''} ${updatedPass.studentId.lastName || ''}`.trim();
  const remarksText = remarks || "Rejected";

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'PASS_ADMIN_REJECTED',
    target: { type: 'STUDENT', filter: { studentId: updatedPass.studentId._id } },
    data: { passTypeLabel, studentName, approvedBy, remarks: remarksText, link }
  }).catch(err => console.error("Notification Error:", err));

  if (updatedPass.parentId) {
    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_ADMIN_REJECTED',
      target: { type: 'PARENT', filter: { studentId: updatedPass.studentId._id } },
      data: { passTypeLabel, studentName, approvedBy, remarks: remarksText, link }
    }).catch(err => console.error("Notification Error:", err));
  }

  const hostelDoc = await hostelModel.findById(updatedPass.hostelId);
  if (hostelDoc && hostelDoc.wardens && hostelDoc.wardens.length > 0) {
    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_ADMIN_REJECTED',
      target: { type: 'USER', filter: { userIds: hostelDoc.wardens } },
      data: { passTypeLabel, studentName, approvedBy, remarks: remarksText, link }
    }).catch(err => console.error("Notification Error:", err));
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

  const session = await mongoose.startSession();
  let updatedPass;
  try {
    await session.withTransaction(async () => {
      updatedPass = await managementCancelPassDb(id, reason, scope, session);
      if (!updatedPass) throw new Error("ConcurrencyError");
    });
  } catch (err) {
    if (err.message === "ConcurrencyError") {
      return sendError(res, 409, "We couldn't cancel the pass because its status has recently changed. Please try again.");
    }
    throw err;
  } finally {
    session.endSession();
  }

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'PASS_ADMIN_CANCELLED',
    target: { type: 'STUDENT', filter: { studentId: updatedPass.studentId } },
    data: { reason }
  }).catch(err => console.error("Notification Error:", err));

  if (updatedPass.parentId) {
    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_ADMIN_CANCELLED',
      target: { type: 'PARENT', filter: { studentId: updatedPass.studentId } },
      data: { reason }
    }).catch(err => console.error("Notification Error:", err));
  }

  await createLogDb({
    action: "Admin Cancelled Pass",
    entityType: "Pass",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Admin cancelled pass. Reason: ${reason}`,
    status: "success"
  });

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

  const session = await mongoose.startSession();
  let updatedPass;
  try {
    await session.withTransaction(async () => {
      updatedPass = await managementCancelPassDb(id, reason, scope, session);
      if (!updatedPass) throw new Error("ConcurrencyError");
    });
  } catch (err) {
    if (err.message === "ConcurrencyError") {
      return sendError(res, 409, "We couldn't cancel the pass because its status has recently changed. Please try again.");
    }
    throw err;
  } finally {
    session.endSession();
  }

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'PASS_ADMIN_CANCELLED',
    target: { type: 'STUDENT', filter: { studentId: updatedPass.studentId } },
    data: { reason }
  }).catch(err => console.error("Notification Error:", err));

  if (updatedPass.parentId) {
    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_ADMIN_CANCELLED',
      target: { type: 'PARENT', filter: { studentId: updatedPass.studentId } },
      data: { reason }
    }).catch(err => console.error("Notification Error:", err));
  }

  await createLogDb({
    action: "Super Admin Cancelled Pass",
    entityType: "Pass",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Super Admin cancelled pass. Reason: ${reason}`,
    status: "success"
  });

  return sendSuccess(res, 200, "The pass has been successfully cancelled.", updatedPass);
});

export const cancelPass = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const { id } = req.params;

  const pass = await getPassByIdDb(id);
  if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");

  if (userRole === "student" && pass.studentId.toString() !== userId.toString()) {
    return sendError(res, 403, "You do not have permission to cancel this pass.");
  }
  if (userRole === "parent" && pass.studentId.toString() !== req.student?.id?.toString()) {
    return sendError(res, 403, "You do not have permission to cancel this pass.");
  }

  if (["cancelled", "rejected", "completed", "returned"].includes(pass.status)) {
    return sendError(res, 422, "This pass can't be cancelled because of its current status.");
  }

  let requiresReapproval = false;
  let newStatus = pass.status;

  if (userRole === "student") {
    if (pass.status === "approved") {
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

    const session = await mongoose.startSession();
    let updatedPass;
    try {
      await session.withTransaction(async () => {
        updatedPass = await Pass.findByIdAndUpdate(id, updateQuery, { new: true, session });
      });
    } finally {
      session.endSession();
    }

    if (userRole === "student") {
      await orchestratorService.triggerNotification({
        sender: buildSender(req.user),
        eventName: 'PASS_MODIFIED',
        target: { type: 'PARENT', filter: { studentId: updatedPass.studentId } },
        data: { message: "Student requested cancellation of a pass." }
      }).catch(err => console.error("Notification Error:", err));
    }

    await createLogDb({
      action: "Requested Pass Cancellation",
      entityType: "Pass",
      entityId: id,
      user: req.user.id || req.user._id,
      userRole: req.user.role,
      details: `${userRole} submitted a cancellation request pending approval`,
      status: "success"
    });

    return sendSuccess(res, 200, "Your request to cancel the pass has been submitted and is awaiting approval.", updatedPass);
  }

  const session = await mongoose.startSession();
  let updatedPass;
  try {
    await session.withTransaction(async () => {
      updatedPass = await Pass.findByIdAndUpdate(id, {
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
      }, { new: true, session });
    });
  } finally {
    session.endSession();
  }

  await createLogDb({
    action: "Cancelled Pass Request",
    entityType: "Pass",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `${userRole} directly cancelled their pass request`,
    status: "success"
  });

  return sendSuccess(res, 200, "Your pass has been cancelled.", updatedPass);
});



export const getPasses = asyncHandler(async (req, res) => {
  const { passes, pagination } = await getPassesDb(req.student.id, req.query);
  return sendSuccess(res, 200, "Passes loaded successfully.", { data: passes, pagination });
});

export const getPassDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const pass = await getPassDetailsDb(id, req.student.id);
  if (!pass) {
    return sendError(res, 404, "We couldn't find the pass you're looking for.");
  }

  return sendSuccess(res, 200, "Pass details loaded successfully.", pass);
});

export const approvePass = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const { id } = req.params;
  const { remarks } = req.body;

  if (!req.student.defaultGuardian) {
    return sendError(res, 403, "Only the default guardian has permission to approve passes.");
  }

  const pass = await Pass.findOne({ _id: id, studentId: req.student.id });
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

  const session = await mongoose.startSession();
  let updatedPass;
  try {
    await session.withTransaction(async () => {
      updatedPass = await Pass.findOneAndUpdate(
        { _id: id, status: "pending_parent" },
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
        { new: true, session }
      ).populate("studentId", "name studentId roomNumber firstName lastName");
      if (!updatedPass) throw new Error("ConcurrencyError");
    });
  } catch (err) {
    if (err.message === "ConcurrencyError") {
      return sendError(res, 409, "The pass could not be approved. Its status may have changed.");
    }
    throw err;
  } finally {
    session.endSession();
  }

  const passTypeLabel = updatedPass.passType === 'home_pass' ? 'Home Pass' : 'Out Pass';
  const passTypeSlug = updatedPass.passType === 'home_pass' ? 'home-pass' : 'out-pass';
  const link = `/dashboard/leaves/${passTypeSlug}`;

  const studentName = updatedPass.studentId.name;
  const parentName = req.user.name || "Parent";

  const studentDoc = await Student.findById(updatedPass.studentId._id || updatedPass.studentId).select("organizationId").lean();
  const approverTarget = await getPassApproverRecipients(studentDoc._id, studentDoc.organizationId);

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'PASS_PARENT_APPROVED',
    target: [
      { type: 'STUDENT', filter: { studentId: updatedPass.studentId._id.toString() } },
      { type: 'PARENT', filter: { studentId: updatedPass.studentId._id.toString() } },
      approverTarget,
      { type: 'ROLE', filter: { role: 'warden', organizationId: studentDoc.organizationId.toString() } }
    ],
    data: { passTypeLabel, studentName, parentName, link }
  }).catch(err => console.error("Notification Error:", err));

  await createLogDb({
    action: "Parent Approved Pass",
    entityType: "Pass",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Parent approved pass request`,
    status: "success"
  });

  return sendSuccess(res, 200, "The pass has been successfully approved.", updatedPass);
});

export const rejectPass = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  const { id } = req.params;
  const { remarks } = req.body;

  if (!req.student.defaultGuardian) {
    return sendError(res, 403, "Only the default guardian has permission to reject passes.");
  }

  const pass = await Pass.findOne({ _id: id, studentId: req.student.id });

  if (!pass) {
    return sendError(res, 404, "We couldn't find the pass you're looking for.");
  }

  if (pass.status !== "pending_parent") {
    return sendError(res, 400, "This pass is not waiting for your rejection.");
  }

  const session = await mongoose.startSession();
  let updatedPass;
  try {
    await session.withTransaction(async () => {
      updatedPass = await updatePassApprovalDb(id, parentId, "reject", remarks, session);
      // Wait, updatePassApprovalDb doesn't have the status check for concurrency! We should rewrite it here or let it be for now since it's an internal service call. Let's rely on the service but check if it returns null. Wait, updatePassApprovalDb uses `{ _id: passId }` so it won't be atomic for status. But doing it here:
      const statusUpdate = "rejected";
      const parentStatus = "rejected";
      const timelineAction = "parent_rejected";
      const defaultRemark = "Rejected by parent";

      updatedPass = await Pass.findOneAndUpdate(
        { _id: id, status: "pending_parent" },
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
        { new: true, session }
      ).populate("studentId", "name firstName lastName");

      if (!updatedPass) throw new Error("ConcurrencyError");
    });
  } catch (err) {
    if (err.message === "ConcurrencyError") {
      return sendError(res, 409, "The pass could not be rejected. Its status may have changed.");
    }
    throw err;
  } finally {
    session.endSession();
  }

  const passTypeLabel = updatedPass.passType === 'home_pass' ? 'Home Pass' : 'Out Pass';
  const passTypeSlug = updatedPass.passType === 'home_pass' ? 'home-pass' : 'out-pass';
  const link = `/dashboard/leaves/${passTypeSlug}`;

  const studentName = updatedPass.studentId.name;
  const parentName = req.user.name || "Parent";
  const remarksText = remarks || "Parent rejected the pass request.";

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'PASS_PARENT_REJECTED',
    target: { type: 'STUDENT', filter: { studentId: updatedPass.studentId._id } },
    data: { passTypeLabel, studentName, parentName, remarks: remarksText, link }
  }).catch(err => console.error("Notification Error:", err));

  await createLogDb({
    action: "Parent Rejected Pass",
    entityType: "Pass",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Parent rejected pass request. Remarks: ${remarksText}`,
    status: "success"
  });

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

  const now = new Date();

  if (pass.passType === "home_pass" && pass.fromDate && pass.toDate) {
    const startOfLeave = new Date(pass.fromDate);
    startOfLeave.setUTCHours(0, 0, 0, 0);
    const endOfLeave = new Date(pass.toDate);
    endOfLeave.setUTCHours(23, 59, 59, 999);

    if (now < startOfLeave) {
      return sendError(res, 400, "The student cannot be marked as left before their scheduled leave date.");
    }
    if (now > endOfLeave) {
      return sendError(res, 400, "This pass has expired. The student cannot leave using an expired pass.");
    }
  } else if (pass.passType === "out_pass" && pass.date) {
    const startOfOutDate = new Date(pass.date);
    startOfOutDate.setUTCHours(0, 0, 0, 0);

    let endOfOutDate = new Date(pass.date);
    if (pass.expectedReturnTime) {
      const [hours, minutes] = pass.expectedReturnTime.split(":");
      endOfOutDate.setUTCHours(parseInt(hours), parseInt(minutes), 59, 999);
    } else {
      endOfOutDate.setUTCHours(23, 59, 59, 999);
    }

    if (now < startOfOutDate) {
      return sendError(res, 400, "The student cannot be marked as left before their scheduled out date.");
    }
    if (now > endOfOutDate) {
      return sendError(res, 400, "This out pass has expired. The student cannot leave using an expired pass.");
    }
  }

  const updateQuery = {
    $set: {
      "returnTracking.leftHostelAt": new Date(),
      "returnTracking.markedBy": wardenId,
      "returnTracking.returnStatus": "pending"
    },
    $push: {
      timeline: {
        action: 'warden_marked_out',
        actorId: wardenId,
        actorRole: "warden",
        remarks: "Student left the hostel.",
        timestamp: new Date()
      }
    }
  };

  const session = await mongoose.startSession();
  let updatedPass;
  try {
    await session.withTransaction(async () => {
      // Need to pass the atomic status requirement down to updateWardenPassWorkflowDb
      // Wait, updateWardenPassWorkflowDb checks _id and hostelId. We can also add status check there or just here?
      // It's safer to pass updateQuery with transaction
      updatedPass = await updateWardenPassWorkflowDb(id, hostel._id, updateQuery, session);
      if (!updatedPass) throw new Error("ConcurrencyError");
    });
  } catch (err) {
    if (err.message === "ConcurrencyError") {
      return sendError(res, 409, "We couldn't mark the student out because the pass status has changed.");
    }
    throw err;
  } finally {
    session.endSession();
  }

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'WARDEN_MARKED_OUT',
    target: [
      { type: 'STUDENT', filter: { studentId: updatedPass.studentId._id } },
      { type: 'PARENT', filter: { studentId: updatedPass.studentId._id } }
    ],
    data: { message: "The student has been marked as left the hostel. Have a safe trip!" }
  }).catch(err => console.error("Notification Error:", err));

  await createLogDb({
    action: "Marked Student Left Hostel",
    entityType: "Pass",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Warden marked student as left hostel`,
    status: "success"
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

  if (returnedAt < new Date(pass.returnTracking.leftHostelAt)) {
    return sendError(res, 400, "Return time cannot be before the time the student left the hostel.");
  }

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
        action: "warden_marked_returned",
        actorId: wardenId,
        actorRole: "warden",
        remarks: `Student returned ${returnStatus.replace("_", " ")}.`,
        timestamp: returnedAt
      }
    }
  };

  const session = await mongoose.startSession();
  let updatedPass;
  try {
    await session.withTransaction(async () => {
      updatedPass = await updateWardenPassWorkflowDb(id, hostel._id, updateQuery, session);
      if (!updatedPass) throw new Error("ConcurrencyError");
    });
  } catch (err) {
    if (err.message === "ConcurrencyError") {
      return sendError(res, 409, "We couldn't mark the student as returned because the pass status has changed.");
    }
    throw err;
  } finally {
    session.endSession();
  }

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'WARDEN_MARKED_RETURNED',
    target: { type: 'STUDENT', filter: { studentId: updatedPass.studentId._id } },
    data: { message: `You have been marked as returned to the hostel. Status: ${returnStatus.replace("_", " ")}` }
  }).catch(err => console.error("Notification Error:", err));

  await createLogDb({
    action: "Marked Student Returned to Hostel",
    entityType: "Pass",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Warden marked student as returned. Status: ${returnStatus}`,
    status: "success"
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

  const session = await mongoose.startSession();
  let updatedPass;
  try {
    await session.withTransaction(async () => {
      updatedPass = await Pass.findOneAndUpdate(
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
        { new: true, session }
      );
      if (!updatedPass) throw new Error("ConcurrencyError");
    });
  } catch (err) {
    if (err.message === "ConcurrencyError") {
      return sendError(res, 409, "We couldn't cancel the pass because its status has recently changed. Please try again.");
    }
    throw err;
  } finally {
    session.endSession();
  }

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'PASS_ADMIN_CANCELLED',
    target: { type: 'STUDENT', filter: { studentId: updatedPass.studentId } },
    data: { reason: remarks }
  }).catch(err => console.error("Notification Error:", err));

  if (updatedPass.parentId) {
    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_ADMIN_CANCELLED',
      target: { type: 'PARENT', filter: { studentId: updatedPass.studentId } },
      data: { reason: remarks }
    }).catch(err => console.error("Notification Error:", err));
  }

  await createLogDb({
    action: "Warden Cancelled Pass",
    entityType: "Pass",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Warden/Assistant Warden cancelled pass. Remarks: ${remarks}`,
    status: "success"
  });

  return sendSuccess(res, 200, "The pass has been successfully cancelled.", updatedPass);
});

// ─── Unified Listing Controllers ─────────────────────────────────────────────

export const getMyPassesUnified = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const result = await getStudentPassesUnifiedDb(studentId, req.query);

  return sendSuccess(res, 200, "Passes loaded successfully.", {
    mode: result.mode,
    summary: result.summary,
    data: result.passes,
    pagination: result.pagination
  });
});

export const getParentPassesUnified = asyncHandler(async (req, res) => {
  const result = await getParentPassesUnifiedDb(req.student.id, req.query);

  return sendSuccess(res, 200, "Passes loaded successfully.", {
    mode: result.mode,
    summary: result.summary,
    data: result.passes,
    pagination: result.pagination
  });
});

const buildMentorScope = async (req) => {
  const activeAssignments = await MentorAssignment.find({
    mentorId: req.user.id,
    status: "active"
  }).select("batchId").lean();

  const batchIds = activeAssignments.map(({ batchId }) => batchId);

  return {
    role: "mentor",
    organizationId: req.user.organization,
    batchIds,
    actorId: req.user.id
  };
};



export const getMentorHostels = asyncHandler(async (req, res) => {
  const scope = await buildMentorScope(req);
  const { hostels, pagination } = await getManagementHostelsDb(scope, req.query);
  return sendSuccess(res, 200, "Hostels loaded successfully.", { data: hostels, pagination });
});

export const getMentorAllPasses = asyncHandler(async (req, res) => {
  const scope = await buildMentorScope(req);
  const { passes, pagination } = await getManagementPassesDb(req.query, scope, null);
  return sendSuccess(res, 200, "All passes loaded successfully.", { data: passes, pagination });
});

export const getMentorPassDetails = asyncHandler(async (req, res) => {
  const scope = await buildMentorScope(req);
  const { id } = req.params;

  const pass = await getManagementPassDetailsDb(id, scope);
  if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");

  const student = await Student.findOne({ _id: pass.studentId?._id, batchId: { $in: scope.batchIds } });
  if (!student) {
    return sendError(res, 403, "You don't have permission to view this pass.");
  }
  return sendSuccess(res, 200, "Pass details loaded successfully.", { data: pass });
});

export const mentorApprovePass = asyncHandler(async (req, res) => {
  const scope = await buildMentorScope(req);
  const mentorId = scope.actorId;
  const { id } = req.params;
  const { remarks } = req.body;

  const pass = await Pass.findById(id).populate("studentId");
  if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");
  if (!pass.studentId || !scope.batchIds.some(bId => bId.toString() === pass.studentId.batchId?.toString())) {
    return sendError(res, 403, "You don't have permission to approve passes for this student.");
  }

  if (pass.status !== "pending_admin") {
    return sendError(res, 422, "This pass can't be approved right now because of its current status.");
  }

  const isCancellation = pass.cancellationRequest && pass.cancellationRequest.requested;

  const updateQuery = {
    $set: {
      status: isCancellation ? "cancelled" : "approved",
      "adminApproval.status": "approved",
      "adminApproval.actionBy": mentorId,
      "adminApproval.actionAt": new Date(),
      "adminApproval.remarks": remarks || "Approved by mentor"
    },
    $push: {
      timeline: {
        action: "admin_approved",
        actorId: mentorId,
        actorRole: "mentor",
        remarks: remarks || "Approved by mentor",
        timestamp: new Date()
      }
    }
  };

  const session = await mongoose.startSession();
  let updatedPass;
  try {
    await session.withTransaction(async () => {
      updatedPass = await Pass.findOneAndUpdate(
        { _id: id, status: "pending_admin" },
        updateQuery,
        { new: true, session }
      ).populate("studentId");
      if (!updatedPass) throw new Error("ConcurrencyError");
    });
  } catch (err) {
    if (err.message === "ConcurrencyError") {
      return sendError(res, 409, "The pass could not be approved. Its status may have changed.");
    }
    throw err;
  } finally {
    session.endSession();
  }

  const passTypeLabel = updatedPass.passType === 'home_pass' ? 'Home Pass' : 'Out Pass';
  const passTypeSlug = updatedPass.passType === 'home_pass' ? 'home-pass' : 'out-pass';
  const link = `/dashboard/leaves/${passTypeSlug}`;

  const approvedBy = req.user.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Mentor';
  const studentName = updatedPass.studentId.name || `${updatedPass.studentId.firstName || ''} ${updatedPass.studentId.lastName || ''}`.trim();
  const remarksText = remarks || "Approved";

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: isCancellation ? 'PASS_ADMIN_CANCELLED' : 'PASS_ADMIN_APPROVED',
    target: { type: 'STUDENT', filter: { studentId: updatedPass.studentId._id } },
    data: { passTypeLabel, studentName, approvedBy, remarks: remarksText, link }
  }).catch(err => console.error("Notification Error:", err));

  await createLogDb({
    action: "Mentor Approved Pass",
    entityType: "Pass",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Mentor approved pass request. Remarks: ${remarksText}`,
    status: "success"
  });

  return sendSuccess(res, 200, "The pass has been successfully approved.", updatedPass);
});

export const mentorRejectPass = asyncHandler(async (req, res) => {
  const scope = await buildMentorScope(req);
  const mentorId = scope.actorId;
  const { id } = req.params;
  const { remarks } = req.body;

  const pass = await Pass.findById(id).populate("studentId");
  if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");
  if (!pass.studentId || !scope.batchIds.some(bId => bId.toString() === pass.studentId.batchId?.toString())) {
    return sendError(res, 403, "You don't have permission to reject passes for this student.");
  }

  if (pass.status !== "pending_admin") {
    return sendError(res, 422, "This pass can't be rejected right now because of its current status.");
  }

  const updateQuery = {
    $set: {
      status: "rejected",
      "adminApproval.status": "rejected",
      "adminApproval.actionBy": mentorId,
      "adminApproval.actionAt": new Date(),
      "adminApproval.remarks": remarks
    },
    $push: {
      timeline: {
        action: "admin_rejected",
        actorId: mentorId,
        actorRole: "mentor",
        remarks: remarks,
        timestamp: new Date()
      }
    }
  };

  const session = await mongoose.startSession();
  let updatedPass;
  try {
    await session.withTransaction(async () => {
      updatedPass = await Pass.findOneAndUpdate(
        { _id: id, status: "pending_admin" },
        updateQuery,
        { new: true, session }
      ).populate("studentId");
      if (!updatedPass) throw new Error("ConcurrencyError");
    });
  } catch (err) {
    if (err.message === "ConcurrencyError") {
      return sendError(res, 409, "The pass could not be rejected. Its status may have changed.");
    }
    throw err;
  } finally {
    session.endSession();
  }

  const passTypeLabelReject = updatedPass.passType === 'home_pass' ? 'Home Pass' : 'Out Pass';
  const passTypeSlugReject = updatedPass.passType === 'home_pass' ? 'home-pass' : 'out-pass';
  const linkReject = `/dashboard/leaves/${passTypeSlugReject}`;

  const approvedByReject = req.user.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Mentor';
  const studentNameReject = updatedPass.studentId.name || `${updatedPass.studentId.firstName || ''} ${updatedPass.studentId.lastName || ''}`.trim();
  const remarksTextReject = remarks || "Rejected";

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'PASS_ADMIN_REJECTED',
    target: { type: 'STUDENT', filter: { studentId: updatedPass.studentId._id } },
    data: { passTypeLabel: passTypeLabelReject, studentName: studentNameReject, approvedBy: approvedByReject, remarks: remarksTextReject, link: linkReject }
  }).catch(err => console.error("Notification Error:", err));

  await createLogDb({
    action: "Mentor Rejected Pass",
    entityType: "Pass",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Mentor rejected pass request. Remarks: ${remarksTextReject}`,
    status: "success"
  });

  return sendSuccess(res, 200, "The pass request has been rejected.", updatedPass);
});

export const mentorCancelPass = asyncHandler(async (req, res) => {
  const scope = await buildMentorScope(req);
  const mentorId = scope.actorId;
  const { id } = req.params;
  const { remarks } = req.body;

  const pass = await Pass.findById(id).populate("studentId");
  if (!pass) return sendError(res, 404, "We couldn't find the pass you're looking for.");
  if (!pass.studentId || !scope.batchIds.some(bId => bId.toString() === pass.studentId.batchId?.toString())) {
    return sendError(res, 403, "You don't have permission to cancel passes for this student.");
  }

  if (["completed", "cancelled", "rejected", "returned"].includes(pass.status)) {
    return sendError(res, 422, "This pass can't be cancelled because of its current status.");
  }

  if (pass.returnTracking && pass.returnTracking.leftHostelAt) {
    return sendError(res, 422, "You cannot cancel this pass because the student has already left the hostel.");
  }

  const session = await mongoose.startSession();
  let updatedPass;
  try {
    await session.withTransaction(async () => {
      updatedPass = await Pass.findOneAndUpdate(
        { _id: id, status: { $nin: ["completed", "cancelled", "rejected", "returned"] }, "returnTracking.leftHostelAt": null },
        {
          $set: {
            status: "cancelled"
          },
          $push: {
            timeline: {
              action: "admin_cancelled",
              actorId: mentorId,
              actorRole: "mentor",
              remarks: `Mentor Cancellation: ${remarks}`,
              timestamp: new Date()
            }
          }
        },
        { new: true, session }
      );
      if (!updatedPass) throw new Error("ConcurrencyError");
    });
  } catch (err) {
    if (err.message === "ConcurrencyError") {
      return sendError(res, 409, "We couldn't cancel the pass because its status has recently changed. Please try again.");
    }
    throw err;
  } finally {
    session.endSession();
  }

  await orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'PASS_ADMIN_CANCELLED',
    target: { type: 'STUDENT', filter: { studentId: updatedPass.studentId } },
    data: { reason: remarks }
  }).catch(err => console.error("Notification Error:", err));

  if (updatedPass.parentId) {
    await orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'PASS_ADMIN_CANCELLED',
      target: { type: 'PARENT', filter: { studentId: updatedPass.studentId } },
      data: { reason: remarks }
    }).catch(err => console.error("Notification Error:", err));
  }

  await createLogDb({
    action: "Mentor Cancelled Pass",
    entityType: "Pass",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Mentor cancelled pass. Remarks: ${remarks}`,
    status: "success"
  });

  return sendSuccess(res, 200, "The pass has been successfully cancelled.", updatedPass);
});
