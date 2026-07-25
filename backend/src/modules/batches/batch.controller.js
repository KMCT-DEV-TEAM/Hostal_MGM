import asyncHandler from "../../utils/asyncHandler.js";
import MentorAssignment from "../mentors/mentorAssignment.model.js";
import { createLogDb } from "../logs/log.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { getIo } from "../../config/socket.js";
import {
  checkExistingBatchCodeDb,
  createBatchDb,
  getPaginatedBatchesDb,
  getAllBatchesDb,
  getBatchByIdDb,
  updateBatchDb,
  toggleBatchStatusDb,
  bulkUpdateBatchStatusDb,
} from "./batch.service.js";

const createBatch = asyncHandler(async (req, res) => {
  const { name, code, departmentId, startYear, endYear } = req.body;

  const existingBatch = await checkExistingBatchCodeDb(code);
  if (existingBatch) {
    return sendError(res, 400, "Batch code already exists");
  }

  const newBatch = await createBatchDb({ name, code, departmentId, startYear, endYear });

  if (req.user) {
    await createLogDb({
      action: "Created Batch",
      entityType: "Batch",
      entityId: newBatch._id,
      user: req.user.id || req.user._id,
      userRole: req.user.role || 'System',
      details: `Created new batch: ${name} (${code})`,
      status: "success"
    });
  }

  getIo()?.emit('batchCreated', newBatch);

  return sendSuccess(res, 201, "Batch created successfully", {
    data: newBatch,
  });
});

const getBatches = asyncHandler(async (req, res) => {
  const { page, limit, search, status, departmentId } = req.query;

  const query = {};
  if (departmentId) {
    query.departmentId = departmentId;
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
  }
  if (status && status !== "All") {
    query.isActive = status === "Active";
  }
  if (departmentId) {
    query.departmentId = departmentId;
  }

  const sort = { createdAt: -1 };

  if (limit && Number(limit) === 0) {
    const batches = await getAllBatchesDb(query, sort);
    return sendSuccess(res, 200, "All Batches retrieved successfully", {
      data: batches,
      totalCount: batches.length,
      totalPages: 1,
    });
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const batches = await getPaginatedBatchesDb(query, skip, limitNum, sort);
  const totalCount = await import("./batch.model.js").then((m) => m.default.countDocuments(query));

  return sendSuccess(res, 200, "Batches retrieved successfully", {
    data: batches,
    totalCount,
    totalPages: Math.ceil(totalCount / limitNum),
  });
});

// Mentor-specific batch listing with optional mentor filter

const getMentorAssignments = asyncHandler(async (req, res) => {
  const { page, limit, search, status, mentorId, organizationId } = req.query;

  const query = {};
  if (mentorId) query.mentorId = mentorId;
  if (organizationId) query.organizationId = organizationId;

  if (status && status !== "All") {
    query.status = status === "history" ? { $ne: "active" } : status;
  }

  if (search) {
    const regex = { $regex: search, $options: "i" };
    query.$or = [
      { remarks: regex },
      { name: regex },
      { code: regex },
    ];
  }

  const sort = { createdAt: -1 };

  if (limit && Number(limit) === 0) {
    const assignments = await MentorAssignment.find(query)
      .sort(sort)
      .populate("batchId", "name code")
      .populate("organizationId", "name");
    return sendSuccess(res, 200, "All Mentor Assignments retrieved successfully", {
      data: assignments,
      totalCount: assignments.length,
      totalPages: 1,
    });
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [assignments, totalCount] = await Promise.all([
    MentorAssignment.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("batchId", "name code")
      .populate("organizationId", "name")
      .populate("assignedBy", "name"),
    MentorAssignment.countDocuments(query),
  ]);

  return sendSuccess(res, 200, "Mentor Assignments retrieved successfully", {
    data: assignments,
    totalCount,
    totalPages: Math.ceil(totalCount / limitNum),
  });
});

// Get a single mentor assignment by ID with role protection
const getMentorAssignmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(req.user)
  const assignment = await MentorAssignment.findById(id)
    .populate('batchId', 'name code')
    .populate('organizationId', 'name')
    .populate('mentorId', 'name')
    .populate('assignedBy', 'name');
  if (!assignment) {
    return sendError(res, 404, "Mentor Assignment not found");
  }
  if (req.user && req.user.role === "mentor") {
    const mentorId = req.user.id || req.user._id;
    console.log(assignment.mentorId)
    console.log(mentorId)
    if (!assignment.mentorId._id || assignment.mentorId._id.toString() !== mentorId.toString()) {
      return sendError(res, 403, "You are not authorized to view this assignment");
    }
  }
  return sendSuccess(res, 200, "Mentor Assignment retrieved successfully", { data: assignment });
});

const getBatchById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const batch = await getBatchByIdDb(id);

  if (!batch) {
    return sendError(res, 404, "Batch not found");
  }

  return sendSuccess(res, 200, "Batch retrieved successfully", { data: batch });
});

const updateBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, departmentId, startYear, endYear } = req.body;

  if (code) {
    const existingCode = await checkExistingBatchCodeDb(code);
    if (existingCode && existingCode._id.toString() !== id) {
      return sendError(res, 400, "Batch code already exists");
    }
  }

  const batch = await updateBatchDb(id, { name, code, departmentId, startYear, endYear });

  if (!batch) {
    return sendError(res, 404, "Batch not found");
  }

  if (req.user) {
    await createLogDb({
      action: "Updated Batch",
      entityType: "Batch",
      entityId: batch._id,
      user: req.user.id || req.user._id,
      userRole: req.user.role || 'System',
      details: `Updated details for batch: ${name || batch.name}`,
      status: "success"
    });
  }

  getIo()?.emit('batchUpdated', { id: batch._id });

  return sendSuccess(res, 200, "Batch updated successfully", { data: batch });
});

const toggleBatchStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const batch = await toggleBatchStatusDb(id);

  if (!batch) {
    return sendError(res, 404, "Batch not found");
  }

  if (req.user) {
    await createLogDb({
      action: "Updated Batch Status",
      entityType: "Batch",
      entityId: batch._id,
      user: req.user.id || req.user._id,
      userRole: req.user.role || 'System',
      details: `Changed batch status to ${batch.isActive ? 'Active' : 'Inactive'} for batch: ${batch.name}`,
      status: "success"
    });
  }

  getIo()?.emit('batchUpdated', { id: batch._id });

  return sendSuccess(res, 200, "Batch status toggled successfully", {
    data: batch,
  });
});

const bulkUpdateBatchStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return sendError(res, 400, "Please provide an array of batch IDs");
  }

  if (typeof isActive !== "boolean") {
    return sendError(res, 400, "Please provide a valid isActive status");
  }

  await bulkUpdateBatchStatusDb(ids, isActive);

  if (req.user) {
    await createLogDb({
      action: "Bulk Updated Batch Status",
      entityType: "Batch",
      entityId: null,
      user: req.user.id || req.user._id,
      userRole: req.user.role || 'System',
      details: `Bulk updated status to ${isActive ? 'Active' : 'Inactive'} for ${ids.length} batches`,
      status: "success"
    });
  }

  getIo()?.emit('batchUpdated', { bulk: true });

  return sendSuccess(res, 200, "Bulk status updated successfully");
});

export {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  toggleBatchStatus,
  bulkUpdateBatchStatus,
  getMentorAssignments,
  getMentorAssignmentById,
};
