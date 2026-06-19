import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import User from "../users/user.model.js";
import Parent from "./parent.model.js";
import mongoose from "mongoose";
import { createParentDb, updateParentDb, toggleParentStatusDb, setDefaultGuardianDb, getParentsService, exportParentsService, bulkUpdateParentStatusDb } from "./parent.service.js";

const createParent = asyncHandler(async (req, res) => {
  let result;

  try {
    result = await createParentDb(req.body);
  } catch (error) {
    if (error.message === "Parent email already exists") {
      return sendError(res, 400, error.message);
    }
    if (error.message === "Invalid studentId") {
      return sendError(res, 400, "Invalid studentId");
    }
    throw error;
  }

  if (!result) {
    return sendError(res, 404, "Student not found");
  }

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

const toggleParentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await toggleParentStatusDb(id);

  if (!result) {
    return sendError(res, 404, "Parent not found");
  }

  const message = result.parentProfile.isActive
    ? "Parent activated successfully"
    : "Parent deactivated successfully";

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
    return sendError(
      res,
      400,
      "Admin is not assigned to any organization"
    );
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

const exportParentsByAdmin = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user.id)
    .select("organization")
    .lean();

  if (!admin?.organization) {
    return sendError(
      res,
      400,
      "Admin is not assigned to any organization"
    );
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

  const result = await setDefaultGuardianDb(id, defaultGuardian);

  if (!result) {
    return sendError(res, 404, "Parent not found");
  }

  const message = defaultGuardian
    ? "Parent set as default guardian successfully"
    : "Parent removed as default guardian successfully";

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

  const organizationId = req.user.role === "admin" ? req.user.organization : null;
  if (req.user.role === "admin" && !organizationId) {
    return sendError(res, 400, "Admin is not assigned to any organization");
  }

  if (organizationId) {
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    const validParents = await Parent.aggregate([
      { $match: { _id: { $in: objectIds } } },
      { $lookup: { from: "students", localField: "studentId", foreignField: "_id", as: "student" } },
      { $unwind: "$student" },
      { $match: { "student.organizationId": new mongoose.Types.ObjectId(organizationId) } }
    ]);

    if (validParents.length !== ids.length) {
      return sendError(res, 403, "One or more parents are not under your organization");
    }
  }

  const result = await bulkUpdateParentStatusDb(ids, isActive);

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

export {
  createParent,
  updateParent,
  toggleParentStatus,
  setDefaultGuardian,
  getParentsByAdmin,
  getParentsBySuperAdmin,
  exportParentsByAdmin,
  exportParentsBySuperAdmin,
  bulkUpdateParentStatus,
};
