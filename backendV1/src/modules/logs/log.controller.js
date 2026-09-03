import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';
import { getLogsService } from './log.service.js';

export const createLog = asyncHandler(async (req, res) => {
  // TODO: Implement create
  return sendSuccess(res, 201, 'Log created successfully');
});

export const getLogs = asyncHandler(async (req, res) => {
  const result = await getLogsService(req.query);
  return sendSuccess(res, 200, 'Logs retrieved successfully', result);
});

export const getLogById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement getById
  return sendSuccess(res, 200, 'Log retrieved successfully', {});
});

export const updateLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement update
  return sendSuccess(res, 200, 'Log updated successfully', {});
});

export const deleteLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement delete
  return sendSuccess(res, 200, 'Log deleted successfully');
});
