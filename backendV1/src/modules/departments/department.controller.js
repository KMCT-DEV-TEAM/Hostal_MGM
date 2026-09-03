import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';
import { createDepartmentService, getDepartmentsService, updateDepartmentService, toggleDepartmentStatusService, bulkToggleDepartmentStatusService } from './department.service.js';
import { createLogDb } from '../logs/log.service.js';

export const createDepartment = asyncHandler(async (req, res) => {
  try {
    const newDepartment = await createDepartmentService(req.body, req.user);

    await createLogDb({
      action: "Created Department",
      entityType: "Department",
      entityId: newDepartment.id,
      user: req.user.id,
      userRole: req.user.role,
      details: `Created department: ${newDepartment.name} (${newDepartment.code})`,
      status: "success"
    });

    return sendSuccess(res, 201, 'Department created successfully', newDepartment);
  } catch (error) {
    if (error.message === 'Course not found' || error.message === 'Department with this code already exists' || error.message === 'Unauthorized to add department to this course') {
      return sendError(res, error.message.includes('Unauthorized') ? 403 : 400, error.message);
    }
    throw error;
  }
});

export const getDepartments = asyncHandler(async (req, res) => {
  const result = await getDepartmentsService(req.query, req.user);
  return sendSuccess(res, 200, 'Departments retrieved successfully', result);
});

export const getDepartmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement getById
  return sendSuccess(res, 200, 'Department retrieved successfully', {});
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const updatedDepartment = await updateDepartmentService(id, req.body, req.user);

    await createLogDb({
      action: "Updated Department",
      entityType: "Department",
      entityId: updatedDepartment.id,
      user: req.user.id,
      userRole: req.user.role,
      details: `Updated department: ${updatedDepartment.name} (${updatedDepartment.code})`,
      status: "success"
    });

    return sendSuccess(res, 200, 'Department updated successfully', updatedDepartment);
  } catch (error) {
    if (error.message === 'Department not found' || error.message === 'Course not found' || error.message === 'Department with this code already exists') {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('Unauthorized')) {
      return sendError(res, 403, error.message);
    }
    throw error;
  }
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement delete
  return sendSuccess(res, 200, 'Department deleted successfully');
});

export const toggleDepartmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const updatedDepartment = await toggleDepartmentStatusService(id, req.user, req.body);

    await createLogDb({
      action: "Toggled Department Status",
      entityType: "Department",
      entityId: updatedDepartment.id,
      user: req.user.id,
      userRole: req.user.role,
      details: `Status changed to ${updatedDepartment.isActive ? 'Active' : 'Inactive'} for department ${updatedDepartment.name}`,
      status: "success"
    });

    return sendSuccess(res, 200, 'Department status updated successfully', updatedDepartment);
  } catch (error) {
    if (error.message === 'Department not found' || error.message === 'Unauthorized') {
      return sendError(res, error.message === 'Unauthorized' ? 403 : 404, error.message);
    }
    throw error;
  }
});

export const bulkToggleDepartmentStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;
  if (!Array.isArray(ids) || typeof isActive !== 'boolean') {
    return sendError(res, 400, 'Invalid request body');
  }
  
  const result = await bulkToggleDepartmentStatusService(ids, isActive, req.user);

  await createLogDb({
    action: "Bulk Status Update (Departments)",
    entityType: "Department",
    user: req.user.id,
    userRole: req.user.role,
    details: `Updated status to ${isActive ? 'Active' : 'Inactive'} for ${result.count} departments`,
    status: "success"
  });

  return sendSuccess(res, 200, `Successfully updated ${result.count} departments`);
});
