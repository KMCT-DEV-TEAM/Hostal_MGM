import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import * as furnitureService from "./furniture.service.js";
import * as furnitureAggregation from "./furniture.aggregation.js";
import mongoose from "mongoose";
import FurnitureType from "./furnitureType.model.js";
import FurnitureAsset from "./furnitureAsset.model.js";
import Organization from "../organizations/organization.model.js";
import Hostel from "../hostels/hostel.model.js";

const resolveUserScope = async (user) => {
  let organizationId = null;
  let hostelId = null;

  if (user.role === "admin" && user.organization) {
    organizationId = new mongoose.Types.ObjectId(user.organization);
  } else if (user.role === "warden") {
    const hostel = await Hostel.findOne({ wardens: user.id }).lean();
    if (hostel) hostelId = hostel._id;
  }

  return { organizationId, hostelId };
};

export const createFurnitureType = asyncHandler(async (req, res) => {
  try {
    const scope = await resolveUserScope(req.user);
    const data = {
      organizationId: scope.organizationId || req.body.organizationId,
      hostelId: scope.hostelId || req.body.hostelId,
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
  const scope = await resolveUserScope(req.user);

  if (req.user.role === "admin") {
    matchQuery["typeInfo.organizationId"] = scope.organizationId;
  } else if (req.user.role === "warden") {
    matchQuery["typeInfo.hostelId"] = scope.hostelId;
  }

  const summary = await furnitureAggregation.getDashboardSummaryAggregation(matchQuery);
  const distribution = await furnitureAggregation.getFurnitureTypeDistributionAggregation(matchQuery);

  return sendSuccess(res, 200, "Dashboard data retrieved.", { summary, distribution });
});

// Added these stubs so they resolve imports properly since earlier the user had placeholder methods
export const getFurnitureTypes = asyncHandler(async (req, res) => {
  const matchQuery = {};
  const scope = await resolveUserScope(req.user);
  if (req.user.role === "admin") {
    matchQuery.organizationId = scope.organizationId;
  } else if (req.user.role === "warden") {
    matchQuery.hostelId = scope.hostelId;
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
  const total = await FurnitureType.countDocuments(matchQuery);

  return sendSuccess(res, 200, "Furniture Types retrieved.", { data: types, total, page, limit });
});

export const getFurnitureTypeDetails = asyncHandler(async (req, res) => {
  const { typeId } = req.params;
  const type = await FurnitureType.findById(typeId)
    .populate("organizationId", "name")
    .populate("hostelId", "name")
    .lean();

  if (!type) return sendError(res, 404, "Furniture Type not found");

  const scope = await resolveUserScope(req.user);

  if (req.user.role === "admin" && type.organizationId._id.toString() !== scope.organizationId?.toString()) {
    return sendError(res, 403, "Access denied. Furniture Type does not belong to your organization.");
  }

  if (req.user.role === "warden" && type.hostelId._id.toString() !== scope.hostelId?.toString()) {
    return sendError(res, 403, "Access denied. Furniture Type does not belong to your hostel.");
  }

  type.organizationId = type.organizationId;
  type.hostelId = type.hostelId;

  // Total Active inventory (matches the dashboard logic)
  const currentCount = await FurnitureAsset.countDocuments({
    furnitureTypeId: typeId,
    status: { $in: ["Available", "Allocated", "Maintenance"] }
  });

  return sendSuccess(res, 200, "Furniture Type details retrieved.", { ...type, totalAssets: currentCount });
});

export const updateFurnitureType = asyncHandler(async (req, res) => {
  const { typeId } = req.params;
  const { name, prefix, description, isActive } = req.body;

  const typeToUpdate = await FurnitureType.findById(typeId).lean();
  if (!typeToUpdate) return sendError(res, 404, "Furniture Type not found");

  const scope = await resolveUserScope(req.user);

  if (req.user.role === "admin" && typeToUpdate.organizationId.toString() !== scope.organizationId?.toString()) {
    return sendError(res, 403, "Access denied. Furniture Type does not belong to your organization.");
  }

  const updatedType = await FurnitureType.findByIdAndUpdate(
    typeId,
    { name, prefix, description, isActive, updatedBy: req.user.id },
    { new: true }
  ).lean();

  return sendSuccess(res, 200, "Furniture Type updated successfully.", { data: updatedType });
});

export const deleteFurnitureType = asyncHandler(async (req, res) => {
  const { typeId } = req.params;

  const typeToDelete = await FurnitureType.findById(typeId).lean();
  if (!typeToDelete) return sendError(res, 404, "Furniture Type not found");

  const scope = await resolveUserScope(req.user);

  if (req.user.role === "admin" && typeToDelete.organizationId.toString() !== scope.organizationId?.toString()) {
    return sendError(res, 403, "Access denied. Furniture Type does not belong to your organization.");
  }

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

  const assets = await furnitureAggregation.getFurnitureAssetsListAggregation(matchQuery, skip, limit);

  const total = await FurnitureAsset.countDocuments(matchQuery);

  return sendSuccess(res, 200, "Assets retrieved.", { assets, total, page, limit });
});

export const getAllHostelFurnitureAssets = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const status = req.query.status;

  const scope = await resolveUserScope(req.user);

  // Find all FurnitureType IDs that belong to the user's scope
  const typeQuery = {};
  if (req.user.role === "admin") {
    typeQuery.organizationId = scope.organizationId;
  } else if (req.user.role === "warden") {
    typeQuery.hostelId = scope.hostelId;
  }

  const types = await FurnitureType.find(typeQuery).select("_id").lean();
  const typeIds = types.map(t => t._id);

  const matchQuery = { furnitureTypeId: { $in: typeIds } };
  if (status) matchQuery.status = status;

  const assets = await furnitureAggregation.getFurnitureAssetsListAggregation(matchQuery, skip, limit);
  const total = await FurnitureAsset.countDocuments(matchQuery);

  return sendSuccess(res, 200, "All Hostel Assets retrieved.", { assets, total, page, limit });
});

export const getFurnitureAssetDetails = asyncHandler(async (req, res) => {
  const { assetId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(assetId)) {
    return sendError(res, 400, "Invalid Asset ID");
  }

  const assetDetails = await furnitureAggregation.getFurnitureAssetDetailsAggregation(
    new mongoose.Types.ObjectId(assetId)
  );

  if (!assetDetails) {
    return sendError(res, 404, "Asset not found");
  }

  return sendSuccess(res, 200, "Asset details retrieved.", assetDetails);
});

export const getActiveFurnitureTypesList = asyncHandler(async (req, res) => {
  const scope = await resolveUserScope(req.user);

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search;

  const query = { isActive: true };
  if (req.user.role === "admin") {
    query.organizationId = scope.organizationId;
  } else if (req.user.role === "warden") {
    query.hostelId = scope.hostelId;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { prefix: { $regex: search, $options: "i" } },
    ];
  }

  const types = await FurnitureType.find(query)
    .select("_id name prefix")
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await FurnitureType.countDocuments(query);

  return sendSuccess(res, 200, "Active furniture types retrieved.", { types, total, page, limit });
});

export const getAvailableFurnitureAssetsList = asyncHandler(async (req, res) => {
  const { typeId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(typeId)) {
    return sendError(res, 400, "Invalid Furniture Type ID");
  }

  const scope = await resolveUserScope(req.user);

  const typeQuery = { _id: typeId, isActive: true };
  if (req.user.role === "admin") {
    typeQuery.organizationId = scope.organizationId;
  } else if (req.user.role === "warden") {
    typeQuery.hostelId = scope.hostelId;
  }

  const typeExists = await FurnitureType.exists(typeQuery);
  if (!typeExists) {
    return sendError(res, 403, "Access denied or Furniture Type not found.");
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search;

  const assetQuery = {
    furnitureTypeId: typeId,
    status: "Available"
  };

  if (search) {
    assetQuery.furnitureId = { $regex: search, $options: "i" };
  }

  const assets = await FurnitureAsset.find(assetQuery)
    .select("_id furnitureId")
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await FurnitureAsset.countDocuments(assetQuery);

  return sendSuccess(res, 200, "Available furniture assets retrieved.", { assets, total, page, limit });
});
