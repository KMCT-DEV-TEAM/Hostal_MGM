import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';
import { 
  createBatchService, 
  getBatchesService, 
  updateBatchService, 
  toggleBatchStatusService, 
  bulkToggleBatchStatusService 
} from './batch.service.js';

export const createBatch = asyncHandler(async (req, res) => {
  try {
    const newBatch = await createBatchService(req.body, req.user);
    return sendSuccess(res, 201, 'Batch created successfully', newBatch);
  } catch (error) {
    if (error.message === 'Batch with this code already exists' || error.message === 'Department not found') {
      return sendError(res, 400, error.message);
    }
    if (error.message === 'Unauthorized') {
      return sendError(res, 403, error.message);
    }
    throw error;
  }
});

export const getBatchs = asyncHandler(async (req, res) => {
  const result = await getBatchesService(req.query, req.user);
  return sendSuccess(res, 200, 'Batches retrieved successfully', result);
});

export const getBatchById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      department: {
        select: { id: true, name: true, code: true, courseId: true, course: { select: { id: true, name: true, code: true, organizationId: true, organization: { select: { id: true, name: true, code: true } } } } }
      }
    }
  });

  if (!batch) {
    return sendError(res, 404, 'Batch not found');
  }

  if (req.user?.role !== 'super_admin' && req.user?.organizationId) {
    if (batch.department.course.organizationId !== req.user.organizationId) {
      return sendError(res, 403, 'Unauthorized');
    }
  }

  return sendSuccess(res, 200, 'Batch retrieved successfully', batch);
});

export const updateBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const updatedBatch = await updateBatchService(id, req.body, req.user);
    return sendSuccess(res, 200, 'Batch updated successfully', updatedBatch);
  } catch (error) {
    if (error.message === 'Batch not found' || error.message === 'Department not found' || error.message === 'Batch with this code already exists') {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('Unauthorized')) {
      return sendError(res, 403, error.message);
    }
    throw error;
  }
});

export const deleteBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement delete
  return sendSuccess(res, 200, 'Batch deleted successfully');
});

export const toggleBatchStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const updatedBatch = await toggleBatchStatusService(id, req.user);
    return sendSuccess(res, 200, 'Batch status updated successfully', updatedBatch);
  } catch (error) {
    if (error.message === 'Batch not found' || error.message === 'Unauthorized') {
      return sendError(res, error.message === 'Unauthorized' ? 403 : 404, error.message);
    }
    throw error;
  }
});

export const bulkToggleBatchStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;
  if (!Array.isArray(ids) || typeof isActive !== 'boolean') {
    return sendError(res, 400, 'Invalid request body');
  }
  
  const result = await bulkToggleBatchStatusService(ids, isActive, req.user);
  return sendSuccess(res, 200, `Successfully updated ${result.count} batches`);
});
