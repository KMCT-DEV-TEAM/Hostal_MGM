import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import {
  assignMentorDb,
  getPaginatedAssignmentsDb,
  getAssignmentByIdDb,
  updateAssignmentDb,
  transferMentorDb
} from "./mentorAssignment.service.js";

/**
 * POST /mentor-assignments
 */
export const assignMentor = asyncHandler(async (req, res) => {
  try {
    const result = await assignMentorDb(req.body, req.user);
    return sendSuccess(res, 201, "Mentor assigned to batch successfully", {
      data: result
    });
  } catch (error) {
    return sendError(res, error.statusCode || 400, error.message);
  }
});

/**
 * GET /mentor-assignments
 */
export const getAssignments = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { status, search, mentorId, batchId, organizationId, startDate, endDate, sortBy, sortOrder } = req.query;

    let targetMentorId = mentorId;
    if (req.user.role === "mentor") {
      targetMentorId = req.user.id || req.user._id;
    }

    const result = await getPaginatedAssignmentsDb(
      { page, limit, status, search, mentorId: targetMentorId, batchId, organizationId, startDate, endDate },
      { sortBy, sortOrder }
    );

    return sendSuccess(res, 200, "Assignments retrieved successfully", {
      data: result.assignments,
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      totalPages: result.totalPages
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
});

/**
 * GET /mentor-assignments/:id
 */
export const getAssignmentById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getAssignmentByIdDb(id);

    if (req.user.role === "mentor" && result.mentorId?._id?.toString() !== (req.user.id || req.user._id).toString()) {
      return sendError(res, 403, "You are not authorized to view this assignment");
    }

    return sendSuccess(res, 200, "Assignment details retrieved successfully", {
      data: result
    });
  } catch (error) {
    return sendError(res, error.statusCode || 404, error.message);
  }
});

/**
 * PATCH /mentor-assignments/:id
 */
export const updateAssignment = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateAssignmentDb(id, req.body, req.user);
    return sendSuccess(res, 200, "Assignment updated successfully", {
      data: result
    });
  } catch (error) {
    return sendError(res, error.statusCode || 400, error.message);
  }
});

/**
 * POST /mentor-assignments/:id/transfer
 */
export const transferMentor = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { newMentorId, remarks } = req.body;
    const result = await transferMentorDb(id, newMentorId, remarks, req.user);
    return sendSuccess(res, 200, "Mentor transferred successfully", {
      data: result
    });
  } catch (error) {
    return sendError(res, error.statusCode || 400, error.message);
  }
});

/**
 * PATCH /mentor-assignments/:id/end
 */
export const endAssignment = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateAssignmentDb(id, { status: "COMPLETED" }, req.user);
    return sendSuccess(res, 200, "Assignment ended/completed successfully", {
      data: result
    });
  } catch (error) {
    return sendError(res, error.statusCode || 400, error.message);
  }
});
