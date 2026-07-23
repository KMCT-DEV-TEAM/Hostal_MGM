import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import {
  createMentorDb,
  getPaginatedMentorsDb,
  getMentorByIdDb,
  updateMentorDb,
  updateMentorStatusDb,
  deleteMentorDb,
  getOrganizationsWithMentorsDb,
} from "./mentor.service.js";

/**
 * POST /mentors
 * Creates a new mentor user
 */
export const createMentor = asyncHandler(async (req, res) => {
  try {
    const result = await createMentorDb(req.body, req.user);
    return sendSuccess(res, 201, "Mentor created successfully", result);
  } catch (error) {
    return sendError(res, error.statusCode || 400, error.message);
  }
});

/**
 * GET /mentors
 * Returns a paginated list of mentors with optional filters
 */
export const getMentors = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { status, search, startDate, endDate, organizationId: queryOrgId } = req.query;

    let organizationId = req.user.organization;
    if (req.user.role === "super_admin") {
      organizationId = queryOrgId;
    }

    const result = await getPaginatedMentorsDb({
      page,
      limit,
      status,
      search,
      organizationId,
      startDate,
      endDate,
      requesterUser: req.user,
    });

    return sendSuccess(res, 200, "Mentors fetched successfully", {
      count: result.mentors.length,
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      data: result.mentors,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
});

/**
 * GET /mentors/:id
 * Fetches single mentor profile details
 */
export const getMentorById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const mentor = await getMentorByIdDb(id, req.user);
    return sendSuccess(res, 200, "Mentor details fetched successfully", {
      data: mentor,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 404, error.message);
  }
});

/**
 * PATCH /mentors/:id
 * Updates mentor profile details
 */
export const updateMentor = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateMentorDb(id, req.body, req.user);
    return sendSuccess(res, 200, result.message, { data: result.mentor });
  } catch (error) {
    return sendError(res, error.statusCode || 400, error.message);
  }
});

/**
 * PATCH /mentors/:id/status
 * Activates or deactivates mentor profile
 */
export const updateMentorStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return sendError(res, 400, "isActive boolean field is required");
    }

    const updatedMentor = await updateMentorStatusDb(id, isActive, req.user);
    const message = isActive
      ? "Mentor activated successfully"
      : "Mentor deactivated successfully";

    return sendSuccess(res, 200, message, { data: updatedMentor });
  } catch (error) {
    return sendError(res, error.statusCode || 400, error.message);
  }
});

/**
 * DELETE /mentors/:id
 * Soft deletes mentor profile
 */
export const deleteMentor = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteMentorDb(id, req.user);
    return sendSuccess(res, 200, result.message);
  } catch (error) {
    return sendError(res, error.statusCode || 400, error.message);
  }
});

/**
 * GET /mentors/organizations
 * Returns list of organizations that have mentors
 */
export const getOrganizationsWithMentors = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { search } = req.query;

    const result = await getOrganizationsWithMentorsDb({ page, limit, search });

    return sendSuccess(res, 200, "Organizations with mentors fetched successfully", {
      count: result.data.length,
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      data: result.data
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
});
