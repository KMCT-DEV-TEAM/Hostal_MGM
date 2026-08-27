import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { createMentorDb } from "./mentor.service.js";

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
