import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { isUUID } from '../../utils/validators.js';
import {
  checkExistingComplaintCategoryNameDb,
  createComplaintCategoryDb,
  getPaginatedComplaintCategoriesDb,
  getAllComplaintCategoriesDb,
  getComplaintCategoryByIdDb,
  updateComplaintCategoryDb,
  toggleComplaintCategoryStatusDb,
  bulkUpdateComplaintCategoryStatusDb,
} from './complaintCategory.service.js';

export const createComplaintCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const existingCategory = await checkExistingComplaintCategoryNameDb(name);
  if (existingCategory) {
    return sendError(res, 400, 'Complaint Category name already exists');
  }

  const newCategory = await createComplaintCategoryDb({ name, description });

  return sendSuccess(res, 201, 'Complaint Category created successfully', {
    category: newCategory,
    ...newCategory
  });
});

export const getComplaintCategories = asyncHandler(async (req, res) => {
  const { page, limit, search, status } = req.query;

  const where = {};

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  if (status && status !== 'All') {
    where.isActive = status === 'Active';
  }

  if (limit === '0' || limit === 0) {
    const categories = await getAllComplaintCategoriesDb(where, { createdAt: 'desc' });
    return sendSuccess(res, 200, 'Complaint Categories retrieved successfully', {
      data: categories,
      totalCount: categories.length
    });
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const { data, totalCount } = await getPaginatedComplaintCategoriesDb(where, skip, limitNum, { createdAt: 'desc' });

  return sendSuccess(res, 200, 'Complaint Categories retrieved successfully', {
    data,
    totalCount,
    currentPage: pageNum,
    totalPages: Math.ceil(totalCount / limitNum)
  });
});

export const getComplaintCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isUUID(id)) {
    return sendError(res, 400, 'Invalid Complaint Category ID');
  }

  const category = await getComplaintCategoryByIdDb(id);

  if (!category) {
    return sendError(res, 404, 'Complaint Category not found');
  }

  return sendSuccess(res, 200, 'Complaint Category retrieved successfully', category);
});

export const updateComplaintCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isUUID(id)) {
    return sendError(res, 400, 'Invalid Complaint Category ID');
  }

  const { name, description } = req.body;

  const existingCategory = await getComplaintCategoryByIdDb(id);
  if (!existingCategory) {
    return sendError(res, 404, 'Complaint Category not found');
  }

  if (name && name.toLowerCase() !== existingCategory.name.toLowerCase()) {
    const nameTaken = await checkExistingComplaintCategoryNameDb(name, id);
    if (nameTaken) {
      return sendError(res, 400, 'Complaint Category name already exists');
    }
  }

  const updatedCategory = await updateComplaintCategoryDb(id, { name, description });

  return sendSuccess(res, 200, 'Complaint Category updated successfully', {
    category: updatedCategory,
    ...updatedCategory
  });
});

export const toggleComplaintCategoryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isUUID(id)) {
    return sendError(res, 400, 'Invalid Complaint Category ID');
  }

  const category = await toggleComplaintCategoryStatusDb(id, req.body);

  return sendSuccess(res, 200, `Complaint Category ${category.isActive ? 'activated' : 'deactivated'} successfully`, {
    category,
    ...category
  });
});

export const bulkUpdateComplaintCategoryStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return sendError(res, 400, 'Please provide an array of category IDs');
  }

  const invalidIds = ids.filter(id => !isUUID(id));
  if (invalidIds.length > 0) {
    return sendError(res, 400, 'One or more category IDs are invalid');
  }

  if (typeof isActive !== 'boolean') {
    return sendError(res, 400, 'Please provide a valid boolean value for isActive');
  }

  const result = await bulkUpdateComplaintCategoryStatusDb(ids, isActive);

  return sendSuccess(res, 200, `Successfully ${isActive ? 'activated' : 'deactivated'} ${result.count} complaint categories`, {
    modifiedCount: result.count
  });
});
