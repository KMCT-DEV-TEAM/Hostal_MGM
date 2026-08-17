import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';

export const createOtp = asyncHandler(async (req, res) => {
  // TODO: Implement create
  return sendSuccess(res, 201, 'Otp created successfully');
});

export const getOtps = asyncHandler(async (req, res) => {
  // TODO: Implement getAll
  return sendSuccess(res, 200, 'Otps retrieved successfully', []);
});

export const getOtpById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement getById
  return sendSuccess(res, 200, 'Otp retrieved successfully', {});
});

export const updateOtp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement update
  return sendSuccess(res, 200, 'Otp updated successfully', {});
});

export const deleteOtp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement delete
  return sendSuccess(res, 200, 'Otp deleted successfully');
});
