import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { createMentorDb, getPaginatedMentorsDb, getMentorByIdDb } from "./mentor.service.js";
import { ROLES } from "../../constants/roles.js";

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
    const { isActive: status, search, startDate, endDate, organizationId: queryOrgId } = req.query;

    let organizationId = req.user.organizationId || req.user.organization;
    if (req.user.role === ROLES.SUPER_ADMIN) {
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
    console.log(error);
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
