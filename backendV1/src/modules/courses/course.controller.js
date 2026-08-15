import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';

export const createCourse = asyncHandler(async (req, res) => {
  // TODO: Implement create
  return sendSuccess(res, 201, 'Course created successfully');
});

export const getCourses = asyncHandler(async (req, res) => {
  // TODO: Implement getAll
  return sendSuccess(res, 200, 'Courses retrieved successfully', []);
});

export const getCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement getById
  return sendSuccess(res, 200, 'Course retrieved successfully', {});
});

export const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement update
  return sendSuccess(res, 200, 'Course updated successfully', {});
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement delete
  return sendSuccess(res, 200, 'Course deleted successfully');
});
