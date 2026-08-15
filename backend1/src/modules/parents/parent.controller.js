import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { deleteOtpDb, verifyOtpDb } from "../otp/otp.service.js";
import User from "../users/user.model.js";
import Parent from "./parent.model.js";
import mongoose from "mongoose";
import Student from "../students/student.model.js";
import StudentParent from "./studentParent.model.js";
import Hostel from "../hostels/hostel.model.js";
import {
  createParentDb,
  updateParentDb,
  toggleParentStatusDb,
  setDefaultGuardianDb,
  getParentsService,
  exportParentsService,
  bulkUpdateParentStatusDb,
  getParentStudentsService
} from "./parent.service.js";
import MentorAssignment from "../mentors/mentorAssignment.model.js";
import { createLogDb } from "../logs/log.service.js";
import { checkParentAccess, checkStudentAccess } from "./parent.scope.js";

const createParent = asyncHandler(async (req, res) => {
  const { email, parentOtp, studentId } = req.body;

  if (studentId) {
    try {
      await checkStudentAccess(req.user, studentId);
    } catch (error) {
      return sendError(res, error.statusCode || 403, error.message);
    }
  }

  const isOtpValid = await verifyOtpDb(email, parentOtp);

  if (!isOtpValid) {
    return sendError(res, 400, "Invalid or expired OTP");
  }

  await deleteOtpDb(email);

  let result;

  try {
    result = await createParentDb({
      ...req.body,
      isVerified: true,
    });
  } catch (error) {
    if (error.code === "PARENT_EXISTS_WITH_DIFFERENT_DATA") {
      return res.status(409).json({
        success: false,
        code: error.code,
        message: error.message,
        data: error.conflictData,
      });
    }

    if (error.code === "PARENT_ALREADY_LINKED") {
      return res.status(409).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (error.message === "Invalid studentId") {
      return sendError(res, 400, "Invalid studentId");
    }

    throw error;
  }

  if (!result) {
    return sendError(res, 404, "Student not found");
  }

  await createLogDb({
    action: "Created Parent",
    entityType: "Parent",
    entityId: result.parent._id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Created parent account for ${result.parent.parentName} (${result.parent.email})`,
    status: "success"
  });

  return sendSuccess(res, 201, "Parent created successfully", {
    data: {
      parentId: result.parent._id,
      studentId: result.parent.studentId,
      parentName: result.parent.parentName,
      email: result.parent.email,
      defaultGuardian: result.parent.defaultGuardian,
    }
  });
});

const updateParent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await checkParentAccess(req.user, id);
  } catch (error) {
    return sendError(res, error.statusCode || 403, error.message);
  }

  let result;
  try {
    result = await updateParentDb(id, req.body);
  } catch (error) {
    if (error.message === "Parent email already exists") {
      return sendError(res, 400, error.message);
    }
    throw error;
  }

  if (!result) {
    return sendError(res, 404, "Parent not found");
  }

  await createLogDb({
    action: "Updated Parent",
    entityType: "Parent",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Updated parent profile details`,
    status: "success"
  });

  return sendSuccess(res, 200, "Parent updated successfully", {
    data: {
      parentId: result.parentProfile._id,
      parentName: result.parentProfile.parentName,
      email: result.parentProfile.email,
      phone: result.parentProfile.phone,
      relationship: result.parentProfile.relationship,
      defaultGuardian: result.parentProfile.defaultGuardian,
    }
  });
});

const changeParentEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { oldEmail, newEmail, otp } = req.body;

  if (!oldEmail || !newEmail || !otp) {
    return sendError(res, 400, "oldEmail, newEmail, and otp are required");
  }

  let parentContext;
  try {
    parentContext = await checkParentAccess(req.user, id);
  } catch (error) {
    return sendError(res, error.statusCode || 403, error.message);
  }

  const normalizedOldEmail = String(oldEmail).trim().toLowerCase();
  const normalizedNewEmail = String(newEmail).trim().toLowerCase();

  if (normalizedOldEmail === normalizedNewEmail) {
    return sendError(res, 400, "New email must be different from current email");
  }

  if (parentContext.email !== normalizedOldEmail) {
    return sendError(res, 400, "Current email does not match");
  }

  const existingParent = await Parent.findOne({
    email: normalizedNewEmail,
    _id: { $ne: id },
  });

  if (existingParent) {
    return sendError(res, 400, "Parent email already exists");
  }

  const isOtpValid = await verifyOtpDb(normalizedNewEmail, otp);

  if (!isOtpValid) {
    return sendError(res, 400, "Invalid or expired OTP");
  }

  const parent = await Parent.findById(id);
  parent.email = normalizedNewEmail;
  parent.isVerified = true;
  await parent.save();
  await deleteOtpDb(normalizedNewEmail);

  await createLogDb({
    action: "Changed Parent Email",
    entityType: "Parent",
    entityId: parent._id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Parent email changed from ${normalizedOldEmail} to ${normalizedNewEmail}`,
    status: "success"
  });

  return sendSuccess(res, 200, "Parent email updated successfully", {
    data: {
      parentId: parent._id,
      studentId: parent.studentId,
      parentName: parent.parentName,
      email: parent.email,
      phone: parent.phone,
      relationship: parent.relationship,
      defaultGuardian: parent.defaultGuardian,
    },
  });
});

const toggleParentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await checkParentAccess(req.user, id);
  } catch (error) {
    return sendError(res, error.statusCode || 403, error.message);
  }

  const result = await toggleParentStatusDb(id);

  if (!result) {
    return sendError(res, 404, "Parent not found");
  }

  const message = result.parentProfile.isActive
    ? "Parent activated successfully"
    : "Parent deactivated successfully";

  await createLogDb({
    action: result.parentProfile.isActive ? "Activated Parent" : "Deactivated Parent",
    entityType: "Parent",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Parent status changed to ${result.parentProfile.isActive ? 'Active' : 'Inactive'}`,
    status: "success"
  });

  return sendSuccess(res, 200, message, {
    data: {
      parentId: result.parentProfile._id,
      isActive: result.parentProfile.isActive,
    }
  });
});

const getParentsByAdmin = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user.id)
    .select("organization")
    .lean();

  if (!admin?.organization) {
    return sendError(res, 400, "Admin is not assigned to any organization");
  }
  const organizationId = admin.organization;

  if (!organizationId) {
    return sendError(res, 400, "Admin is not assigned to any organization");
  }

  const result = await getParentsService({
    organizationId,
    query: req.query,
  });

  return sendSuccess(res, 200, "Parents fetched successfully", result);
});

const getParentsBySuperAdmin = asyncHandler(async (req, res) => {
  const { organizationId } = req.query;

  const result = await getParentsService({
    organizationId,
    query: req.query,
  });

  return sendSuccess(res, 200, "Parents fetched successfully", result);
});

const getParentsByWarden = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const wardenHostels = await Hostel.find({ wardens: wardenId }).select('_id').lean();

  if (!wardenHostels.length) {
    return sendSuccess(res, 200, "Parents fetched successfully", {
      parents: [],
      pagination: { totalRecords: 0, page: 1, totalPages: 0, limit: req.query.limit || 10 }
    });
  }

  const hostelIds = wardenHostels.map(h => h._id);

  const result = await getParentsService({
    hostelIds,
    query: { ...req.query, isActive: 'true' },
  });

  return sendSuccess(res, 200, "Parents fetched successfully", result);
});

const exportParentsByAdmin = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user.id)
    .select("organization")
    .lean();

  if (!admin?.organization) {
    return sendError(res, 400, "Admin is not assigned to any organization");
  }
  const organizationId = admin.organization;

  if (!organizationId) {
    return sendError(res, 400, "Admin is not assigned to any organization");
  }

  const result = await exportParentsService({
    organizationId,
    query: req.query,
  });

  return sendSuccess(res, 200, "Parents exported successfully", result);
});

const exportParentsBySuperAdmin = asyncHandler(async (req, res) => {
  const { organizationId } = req.query;

  const result = await exportParentsService({
    organizationId,
    query: req.query,
  });

  return sendSuccess(res, 200, "Parents exported successfully", result);
});

const setDefaultGuardian = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { defaultGuardian } = req.body;

  if (typeof defaultGuardian !== "boolean") {
    return sendError(res, 400, "defaultGuardian must be a boolean");
  }

  let parentContext;
  try {
    parentContext = await checkParentAccess(req.user, id);
  } catch (error) {
    return sendError(res, error.statusCode || 403, error.message);
  }

  const result = await setDefaultGuardianDb(parentContext._id, defaultGuardian);

  if (!result) {
    return sendError(res, 404, "Parent not found");
  }

  const message = defaultGuardian
    ? "Parent set as default guardian successfully"
    : "Parent removed as default guardian successfully";

  await createLogDb({
    action: defaultGuardian ? "Set Default Guardian" : "Removed Default Guardian",
    entityType: "Parent",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Parent ${defaultGuardian ? 'set as' : 'removed as'} default guardian`,
    status: "success"
  });

  return sendSuccess(res, 200, message, {
    data: {
      parentId: result.parentProfile._id,
      defaultGuardian: result.parentProfile.defaultGuardian,
    }
  });
});

const bulkUpdateParentStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return sendError(res, 400, "Please provide an array of parent IDs");
  }

  if (typeof isActive !== "boolean") {
    return sendError(res, 400, "Please provide a boolean value for isActive");
  }

  let organizationId = null;

  if (req.user.role === "admin") {
    const admin = await User.findById(req.user.id)
      .select("organization")
      .lean();

    if (!admin?.organization) {
      return sendError(res, 400, "Admin is not assigned to any organization");
    }

    organizationId = admin.organization.toString();
  }

  if (organizationId) {
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    const validParents = await StudentParent.aggregate([
      { $match: { parentId: { $in: objectIds } } },
      { $lookup: { from: "students", localField: "studentId", foreignField: "_id", as: "student" } },
      { $unwind: "$student" },
      { $match: { "student.organizationId": new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: "$parentId" } } // Ensure uniqueness of valid parents
    ]);

    if (validParents.length !== ids.length) {
      return sendError(res, 403, "One or more parents are not under your organization");
    }
  }

  const result = await bulkUpdateParentStatusDb(ids, isActive);

  await createLogDb({
    action: "Bulk Updated Parent Status",
    entityType: "Parent",
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Bulk updated ${result.modifiedCount} parents to ${isActive ? 'Active' : 'Inactive'}`,
    status: "success"
  });

  return sendSuccess(
    res,
    200,
    `Successfully updated ${result.modifiedCount} parent(s) to ${isActive ? "Active" : "Inactive"} status`,
    {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    }
  );
});

const getParentsByMentor = asyncHandler(async (req, res) => {
  const mentorId = req.user.id;

  const activeAssignments = await MentorAssignment.find({
    mentorId,
    status: "active",
  }).select("batchId").lean();

  if (!activeAssignments.length) {
    return sendSuccess(res, 200, "Parents fetched successfully", {
      parents: [],
      pagination: {
        page: 1,
        limit: Number(req.query.limit) || 10,
        totalRecords: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  }

  const batchIds = activeAssignments.map(({ batchId }) => batchId);

  const result = await getParentsService({
    organizationId: req.user.organization,
    batchIds,
    query: req.query,
  });

  return sendSuccess(res, 200, "Parents fetched successfully", result);
});

const resolveParentConflict = asyncHandler(async (req, res) => {
  const { resolutionAction, studentId, ...parentData } = req.body;

  if (studentId) {
    try {
      await checkStudentAccess(req.user, studentId);
    } catch (error) {
      return sendError(res, error.statusCode || 403, error.message);
    }
  }

  if (!resolutionAction) {
    return sendError(res, 400, "Resolution action is required");
  }

  if (resolutionAction !== 'use_existing' && resolutionAction !== 'update_existing') {
    return sendError(res, 400, "Invalid resolution action");
  }

  let result;
  try {
    result = await createParentDb({
      ...parentData,
      studentId,
      resolutionAction,
      isVerified: true,
    });
  } catch (error) {
    if (error.code === "PARENT_ALREADY_LINKED") {
      return res.status(409).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (error.message === "Invalid studentId") {
      return sendError(res, 400, "Invalid studentId");
    }
    throw error;
  }

  if (!result) {
    return sendError(res, 404, "Student not found");
  }

  await createLogDb({
    action: "Resolved Parent Conflict",
    entityType: "Parent",
    entityId: result.parent?._id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Parent conflict resolved via action: ${resolutionAction}`,
    status: "success"
  });

  return sendSuccess(
    res,
    201,
    "Parent added successfully after conflict resolution",
    result
  );
});

/**
 * @desc    Get all active students linked to the authenticated parent
 * @route   GET /api/parent/students
 * @access  Private (Parent only)
 */
const getParentStudents = asyncHandler(async (req, res) => {
  const parentId = req.user.id;
  // Enforce parent access
  if (req.user.role !== "parent") {
    return sendError(res, 403, "Access denied. Only parents can access this resource.");
  }

  const students = await getParentStudentsService(parentId, req.query);
  return sendSuccess(
    res,
    200,
    "Students retrieved successfully.",
    students
  );
});

export {
  createParent,
  resolveParentConflict,
  updateParent,
  changeParentEmail,
  toggleParentStatus,
  setDefaultGuardian,
  getParentsByAdmin,
  getParentsBySuperAdmin,
  getParentsByWarden,
  getParentsByMentor,
  exportParentsByAdmin,
  exportParentsBySuperAdmin,
  bulkUpdateParentStatus,
  getParentStudents
};
