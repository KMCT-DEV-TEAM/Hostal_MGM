import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';

export const createComplaintCategory = asyncHandler(async (req, res) => {
  // TODO: Implement create
  return sendSuccess(res, 201, 'ComplaintCategory created successfully');
});

export const getComplaintCategorys = asyncHandler(async (req, res) => {
  // TODO: Implement getAll
  return sendSuccess(res, 200, 'ComplaintCategorys retrieved successfully', []);
});

export const getComplaintCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement getById
  return sendSuccess(res, 200, 'ComplaintCategory retrieved successfully', {});
});

export const updateComplaintCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement update
  return sendSuccess(res, 200, 'ComplaintCategory updated successfully', {});
});

export const deleteComplaintCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement delete
  return sendSuccess(res, 200, 'ComplaintCategory deleted successfully');
});
