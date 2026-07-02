import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import * as furnitureService from "./furniture.service.js";
import * as furnitureAggregation from "./furniture.aggregation.js";
import mongoose from "mongoose";
import FurnitureType from "./furnitureType.model.js";
import FurnitureAsset from "./furnitureAsset.model.js";

export const createFurnitureType = asyncHandler(async (req, res) => {
  try {
    const data = {
      organizationId: req.user.organizationId || req.body.organizationId,
      hostelId: req.user.hostelId || req.body.hostelId,
      name: req.body.name,
      prefix: req.body.prefix,
      description: req.body.description,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    };

    const openingStock = req.body.openingStock || 0;

    const newType = await furnitureService.createFurnitureTypeService(data, openingStock, req.user);

    return sendSuccess(res, 201, "Furniture Type created successfully.", newType);
  } catch (error) {
    if (error.code === "FT001" || error.code === "FT002") {
      return sendError(res, 409, error.message);
    }
    throw error;
  }
});

export const adjustAssetCount = asyncHandler(async (req, res) => {
  const { typeId } = req.params;
  const { count } = req.body;

  const result = await furnitureService.adjustAssetCountService(typeId, count, req.user);

  return sendSuccess(res, 200, "Asset count adjusted successfully.", result);
});

export const allocateFurniture = asyncHandler(async (req, res) => {
  const { asset, student } = req.validatedData;
  await furnitureService.allocateAssetService(asset, student, req.user);
  return sendSuccess(res, 200, "Furniture allocated successfully.");
});

export const returnFurniture = asyncHandler(async (req, res) => {
  const { asset } = req.validatedData;
  await furnitureService.returnAssetService(asset, req.user);
  return sendSuccess(res, 200, "Furniture returned successfully.");
});

export const startMaintenance = asyncHandler(async (req, res) => {
  const { asset } = req.validatedData;
  await furnitureService.changeLifecycleStatusService(asset, "Maintenance", "Maintenance Started", req.user, req.body.remarks);
  return sendSuccess(res, 200, "Furniture moved to maintenance.");
});

export const completeMaintenance = asyncHandler(async (req, res) => {
  const { asset } = req.validatedData;
  await furnitureService.changeLifecycleStatusService(asset, "Available", "Maintenance Completed", req.user, req.body.remarks);
  return sendSuccess(res, 200, "Maintenance completed.");
});

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const matchQuery = {};

  if (req.user.role === "admin") {
    matchQuery["typeInfo.organizationId"] = req.user.organizationId;
  } else if (req.user.role === "warden") {
    matchQuery["typeInfo.hostelId"] = req.user.hostelId;
  }

  const summary = await furnitureAggregation.getDashboardSummaryAggregation(matchQuery);
  const distribution = await furnitureAggregation.getFurnitureTypeDistributionAggregation(matchQuery);

  return sendSuccess(res, 200, "Dashboard data retrieved.", { summary, distribution });
});

// Added these stubs so they resolve imports properly since earlier the user had placeholder methods
export const getFurnitureTypes = asyncHandler(async (req, res) => {
  const matchQuery = {};

  if (req.user.role === "admin") {
    matchQuery.organizationId = req.user.organizationId;
  } else if (req.user.role === "warden") {
    matchQuery.hostelId = req.user.hostelId;
  }

  const search = req.query.search;
  if (search) {
    matchQuery.$or = [
      { name: { $regex: search, $options: "i" } },
      { prefix: { $regex: search, $options: "i" } },
    ];
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const types = await furnitureAggregation.getFurnitureTypesListAggregation(matchQuery, skip, limit);

  return sendSuccess(res, 200, "Furniture Types retrieved.", types);
});

export const getFurnitureTypeDetails = asyncHandler(async (req, res) => {
  const { typeId } = req.params;
  const type = await FurnitureType.findById(typeId).lean();
  if (!type) return sendError(res, 404, "Furniture Type not found");

  // also fetch assets statistics manually here or from aggregation
  const currentCount = await FurnitureAsset.countDocuments({ furnitureTypeId: typeId });

  return sendSuccess(res, 200, "Furniture Type details retrieved.", { ...type, totalAssets: currentCount });
});

export const updateFurnitureType = asyncHandler(async (req, res) => {
  const { typeId } = req.params;
  const { name, prefix, description, isActive } = req.body;

  const updatedType = await FurnitureType.findByIdAndUpdate(
    typeId,
    { name, prefix, description, isActive, updatedBy: req.user.id },
    { new: true }
  ).lean();

  if (!updatedType) return sendError(res, 404, "Furniture Type not found");
  return sendSuccess(res, 200, "Furniture Type updated successfully.", updatedType);
});

export const deleteFurnitureType = asyncHandler(async (req, res) => {
  const { typeId } = req.params;
  try {
    await furnitureService.deleteFurnitureTypeService(typeId, req.user);
    return sendSuccess(res, 200, "Furniture Type deleted successfully.");
  } catch (error) {
    if (error.code === "FT004") {
      return sendError(res, 409, error.message);
    }
    throw error;
  }
});

export const adjustAssetsCount = adjustAssetCount;

export const changeAssetStatus = asyncHandler(async (req, res) => {
  const { assetId } = req.params;
  const { status, remarks } = req.body;

  const asset = await FurnitureAsset.findById(assetId).lean();
  if (!asset) return sendError(res, 404, "Asset not found");

  const actionName = status === "Maintenance" ? "Maintenance Started" : (status === "Available" ? "Status Updated" : status);
  await furnitureService.changeLifecycleStatusService(asset, status, actionName, req.user, remarks);
  return sendSuccess(res, 200, "Asset status updated successfully.");
});

export const getFurnitureAssetsByType = asyncHandler(async (req, res) => {
  const { typeId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const status = req.query.status;

  const matchQuery = { furnitureTypeId: new mongoose.Types.ObjectId(typeId) };
  if (status) matchQuery.status = status;

  const assets = await FurnitureAsset.find(matchQuery)
    .populate("studentId", "name enrollmentNo")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await FurnitureAsset.countDocuments(matchQuery);

  return sendSuccess(res, 200, "Assets retrieved.", { assets, total, page, limit });
});
