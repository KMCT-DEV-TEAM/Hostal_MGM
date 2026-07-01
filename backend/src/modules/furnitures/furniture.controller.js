import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import {
  createFurnitureTypeDb,
  adjustAssetCountDb,
  changeAssetStatusDb,
  getFurnitureTypesWithCountsDb,
  getFurnitureTypeSummaryDb,
  getFurnitureAssetsDb,
  updateFurnitureTypeDb,
  deleteFurnitureTypeDb
} from "./furniture.service.js";

const createFurnitureType = asyncHandler(async (req, res) => {
  const { name, prefix, description, isActive, openingStock, hostelId, remarks } = req.body;
  if (!name || !prefix) {
    return sendError(res, 400, "Name and prefix are required.");
  }

  const userId = req.user.id || req.user._id;
  try {
    const newType = await createFurnitureTypeDb({
      name,
      prefix,
      description,
      isActive,
      openingStock,
      hostelId,
      remarks
    }, userId);
    return sendSuccess(res, 201, "Furniture type created successfully.", { data: newType });
  } catch (error) {
    if (error.code === 11000) return sendError(res, 400, "Furniture type name or prefix already exists.");
    return sendError(res, 400, error.message);
  }
});

const adjustAssetsCount = asyncHandler(async (req, res) => {
  const { typeId } = req.params;
  const { count } = req.body;

  if (count === undefined || count < 0) {
    return sendError(res, 400, "Valid count (>= 0) is required.");
  }

  try {
    const userId = req.user.id || req.user._id;
    await adjustAssetCountDb(typeId, count, "Asset count adjusted", userId);
    return sendSuccess(res, 200, "Asset count adjusted successfully.");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
});

const changeAssetStatus = asyncHandler(async (req, res) => {
  const { assetId } = req.params;
  const { status } = req.body;

  if (!status) {
    return sendError(res, 400, "Status is required.");
  }

  try {
    const updatedAsset = await changeAssetStatusDb(assetId, status);
    return sendSuccess(res, 200, "Asset status updated successfully.", { data: updatedAsset });
  } catch (error) {
    if (error.message === "Asset not found") {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 400, error.message);
  }
});
const getFurnitureAssetsByType = asyncHandler(async (req, res) => {
  const { typeId } = req.params;
  const { page, limit, status, search } = req.query;

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const query = { furnitureTypeId: typeId };
  if (status && status !== "All") query.status = status;
  if (search) query.furnitureId = { $regex: search, $options: "i" };

  const { docs, totalCount } = await getFurnitureAssetsDb(query, skip, limitNum, { furnitureId: 1 });

  return sendSuccess(res, 200, "Assets retrieved successfully.", {
    assets: docs,
    totalCount,
    totalPages: Math.ceil(totalCount / limitNum),
  });
});

const getFurnitureTypes = asyncHandler(async (req, res) => {
  const { page, limit, search, hostelId, status } = req.query;

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const sort = { name: 1 };

  const { docs, totalCount } = await getFurnitureTypesWithCountsDb(req.query, skip, limitNum, sort);

  return sendSuccess(res, 200, "Furniture types retrieved successfully.", {
    data: docs,
    totalCount,
    totalPages: Math.ceil(totalCount / limitNum),
  });
});

const getFurnitureTypeDetails = asyncHandler(async (req, res) => {
  const { typeId } = req.params;
  const { page, limit, status, hostelId, search } = req.query;

  const summary = await getFurnitureTypeSummaryDb(typeId, hostelId);

  if (!summary) {
    return sendError(res, 404, "Furniture type not found.");
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const query = { furnitureTypeId: typeId };

  if (status && status !== "All") query.status = status;
  if (search) {
    query.furnitureId = { $regex: search, $options: "i" };
  }

  const { docs, totalCount } = await getFurnitureAssetsDb(query, skip, limitNum, { furnitureId: 1 });

  return sendSuccess(res, 200, "Furniture details retrieved successfully.", {
    type: {
      name: summary.name,
      prefix: summary.prefix,
      description: summary.description,
      isActive: summary.isActive
    },
    summary: {
      total: summary.total,
      allocated: summary.allocated,
      available: summary.available,
      maintenance: summary.maintenance,
      lost: summary.lost,
      scrap: summary.scrap,
      retired: summary.retired
    },
    assets: docs,
    totalCount,
    totalPages: Math.ceil(totalCount / limitNum),
  });
});

const updateFurnitureType = asyncHandler(async (req, res) => {
  const { typeId } = req.params;

  try {
    const updatedType = await updateFurnitureTypeDb(typeId, req.body);
    if (!updatedType) return sendError(res, 404, "Furniture type not found");
    return sendSuccess(res, 200, "Furniture type updated successfully.", { data: updatedType });
  } catch (error) {
    if (error.message === "Furniture name and prefix cannot be changed after assets have been created.") {
      return sendError(res, 400, error.message);
    }
    return sendError(res, 400, error.message);
  }
});

const deleteFurnitureType = asyncHandler(async (req, res) => {
  const { typeId } = req.params;

  try {
    await deleteFurnitureTypeDb(typeId);
    return sendSuccess(res, 200, "Furniture type deleted successfully.");
  } catch (error) {
    return sendError(res, 400, error.message);
  }
});

export {
  createFurnitureType,
  adjustAssetsCount,
  changeAssetStatus,
  getFurnitureTypes,
  getFurnitureTypeDetails,
  updateFurnitureType,
  deleteFurnitureType,
  getFurnitureAssetsByType
};
