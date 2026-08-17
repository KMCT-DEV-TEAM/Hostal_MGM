import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';

export const createDepartment = asyncHandler(async (req, res) => {
  // TODO: Implement create
  return sendSuccess(res, 201, 'Department created successfully');
});

export const getDepartments = asyncHandler(async (req, res) => {
  // TODO: Implement getAll
  return sendSuccess(res, 200, 'Departments retrieved successfully', []);
});

export const getDepartmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement getById
  return sendSuccess(res, 200, 'Department retrieved successfully', {});
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement update
  return sendSuccess(res, 200, 'Department updated successfully', {});
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement delete
  return sendSuccess(res, 200, 'Department deleted successfully');
});
