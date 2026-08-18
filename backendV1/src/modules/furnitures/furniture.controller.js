import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import * as furnitureService from "./furniture.service.js";
import { prisma } from "../../config/prisma.js";
import { createLogDb } from "../logs/log.service.js";

const resolveUserScope = async (user) => {
  let organizationId = null;
  let hostelId = null;

  if (user.role === "admin" && user.organization) {
    organizationId = user.organization;
  } else if (user.role === "warden") {
    const wardenHostel = await prisma.hostelWarden.findFirst({
      where: { userId: user.id }
    });
    if (wardenHostel) hostelId = wardenHostel.hostelId;
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

    const openingStock = req.body.openingStock ?? 0;

    const newType = await furnitureService.createFurnitureTypeService(data, openingStock, req.user);

    await createLogDb({
      action: "Created Furniture Type",
      entityType: "Furniture",
      entityId: newType.id,
      user: req.user.id,
      userRole: req.user.role,
      details: `Created furniture type: ${data.name}`,
      status: "success"
    });

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

  await createLogDb({
    action: "Adjusted Furniture Asset Count",
    entityType: "Furniture",
    entityId: typeId,
    user: req.user.id,
    userRole: req.user.role,
    details: `Adjusted asset count by ${count} for furniture type ${typeId}`,
    status: "success"
  });

  return sendSuccess(res, 200, "Asset count adjusted successfully.", result);
});

export const allocateFurniture = asyncHandler(async (req, res) => {
  const { student, assets } = req.validatedData;

  // Call the bulk service
  await furnitureService.bulkAllocateAssetsToStudentService(student, assets, req.user);

  await createLogDb({
    action: "Allocated Furniture to Student",
    entityType: "Furniture",
    entityId: student.id,
    user: req.user.id,
    userRole: req.user.role,
    details: `Allocated ${assets.length} furniture asset(s) to student`,
    status: "success"
  });

  return sendSuccess(res, 200, `Successfully allocated ${assets.length} furniture asset(s).`);
});

export const returnFurniture = asyncHandler(async (req, res) => {
  const { asset } = req.validatedData;
  await furnitureService.returnAssetService(asset, req.user);

  await createLogDb({
    action: "Returned Furniture from Student",
    entityType: "Furniture",
    entityId: asset.id,
    user: req.user.id,
    userRole: req.user.role,
    details: `Furniture asset returned from student`,
    status: "success"
  });

  return sendSuccess(res, 200, "Furniture returned successfully.");
});

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const matchQuery = {};
  const scope = await resolveUserScope(req.user);

  if (req.user.role === "admin") {
    matchQuery.organizationId = scope.organizationId;
  } else if (req.user.role === "warden") {
    matchQuery.hostelId = scope.hostelId;
  }

  const summary = await furnitureService.getDashboardSummaryService(matchQuery);
  const distribution = await furnitureService.getFurnitureTypeDistributionService(matchQuery);

  return sendSuccess(res, 200, "Dashboard data retrieved.", { summary, distribution });
});

export const getAssetsDashboardSummary = asyncHandler(async (req, res) => {
  const matchQuery = {};
  const scope = await resolveUserScope(req.user);

  if (req.user.role === "admin") {
    matchQuery.organizationId = scope.organizationId;
  } else if (req.user.role === "warden") {
    matchQuery.hostelId = scope.hostelId;
  }

  const summary = await furnitureService.getDashboardSummaryService(matchQuery);

  return sendSuccess(res, 200, "Assets Dashboard data retrieved.", { summary });
});

export const getFurnitureTypes = asyncHandler(async (req, res) => {
  const matchQuery = {};
  const scope = await resolveUserScope(req.user);

  if (req.user.role === "admin") {
    matchQuery.organizationId = scope.organizationId;
  } else if (req.user.role === "warden") {
    matchQuery.hostelId = scope.hostelId;
  }

  const search = req.query.search;
  const isActive = req.query.isActive;

  if (isActive !== undefined) {
    matchQuery.isActive = isActive === "true";
  }

  if (search) {
    matchQuery.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { prefix: { contains: search, mode: "insensitive" } },
    ];
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const types = await furnitureService.getFurnitureTypesListService(matchQuery, skip, limit);
  const total = await prisma.furnitureType.count({ where: matchQuery });

  return sendSuccess(res, 200, "Furniture Types retrieved.", { data: types, total, page, limit });
});

export const getFurnitureTypeDetails = asyncHandler(async (req, res) => {
  const { typeId } = req.params;

  const type = await prisma.furnitureType.findUnique({
    where: { id: typeId },
    include: {
      organization: { select: { id: true, name: true } },
      hostel: { select: { id: true, name: true } }
    }
  });

  if (!type) return sendError(res, 404, "Furniture Type not found");

  const scope = await resolveUserScope(req.user);

  if (req.user.role === "admin" && type.organizationId !== scope.organizationId) {
    return sendError(res, 403, "Access denied. Furniture Type does not belong to your organization.");
  }

  if (req.user.role === "warden" && type.hostelId !== scope.hostelId) {
    return sendError(res, 403, "Access denied. Furniture Type does not belong to your hostel.");
  }

  const currentCount = await prisma.furnitureAsset.count({
    where: {
      furnitureTypeId: typeId,
      status: { in: ["AVAILABLE", "ALLOCATED", "MAINTENANCE"] }
    }
  });

  // Remap ID for frontend compatibility
  const mappedType = {
    ...type,
    _id: type.id,
    organizationId: type.organization ? { _id: type.organization.id, name: type.organization.name } : null,
    hostelId: type.hostel ? { _id: type.hostel.id, name: type.hostel.name } : null,
    totalAssets: currentCount
  };
  delete mappedType.organization;
  delete mappedType.hostel;

  return sendSuccess(res, 200, "Furniture Type details retrieved.", mappedType);
});

export const updateFurnitureType = asyncHandler(async (req, res) => {
  const { typeId } = req.params;
  const { name, prefix, description, isActive } = req.body;

  const typeToUpdate = await prisma.furnitureType.findUnique({
    where: { id: typeId }
  });

  if (!typeToUpdate) return sendError(res, 404, "Furniture Type not found");

  const scope = await resolveUserScope(req.user);

  if (req.user.role === "admin" && typeToUpdate.organizationId !== scope.organizationId) {
    return sendError(res, 403, "Access denied. Furniture Type does not belong to your organization.");
  }

  const updatedType = await prisma.furnitureType.update({
    where: { id: typeId },
    data: { name, prefix, description, isActive, updatedById: req.user.id }
  });

  await createLogDb({
    action: "Updated Furniture Type",
    entityType: "Furniture",
    entityId: typeId,
    user: req.user.id,
    userRole: req.user.role,
    details: `Updated furniture type: ${name || typeToUpdate.name}`,
    status: "success"
  });

  const mappedUpdatedType = {
    ...updatedType,
    _id: updatedType.id
  };

  return sendSuccess(res, 200, "Furniture Type updated successfully.", { data: mappedUpdatedType });
});

export const deleteFurnitureType = asyncHandler(async (req, res) => {
  const { typeId } = req.params;

  const typeToDelete = await prisma.furnitureType.findUnique({
    where: { id: typeId }
  });

  if (!typeToDelete) return sendError(res, 404, "Furniture Type not found");

  const scope = await resolveUserScope(req.user);

  if (req.user.role === "admin" && typeToDelete.organizationId !== scope.organizationId) {
    return sendError(res, 403, "Access denied. Furniture Type does not belong to your organization.");
  }

  try {
    await furnitureService.deleteFurnitureTypeService(typeId, req.user);

    await createLogDb({
      action: "Deleted Furniture Type",
      entityType: "Furniture",
      entityId: typeId,
      user: req.user.id,
      userRole: req.user.role,
      details: `Deleted furniture type: ${typeToDelete.name}`,
      status: "success"
    });

    return sendSuccess(res, 200, "Furniture Type and associated unallocated assets deleted successfully.");
  } catch (error) {
    if (error.code === "FT004") {
      return sendError(res, 409, error.message);
    }
    if (error.code === "FT005") {
      return sendError(res, 400, error.message);
    }
    throw error;
  }
});

export const adjustAssetsCount = adjustAssetCount;

export const changeAssetStatus = asyncHandler(async (req, res) => {
  const { assetId } = req.params;
  const { status, remarks } = req.body;
  const { asset } = req.validatedData;

  const actionMap = {
    maintenance: "maintenance started",
    available: "updated",
    allocated: "allocated",
    lost: "lost",
    scrap: "scrapped",
    inactive: "updated"
  };
  const actionName = actionMap[status.toLowerCase()] || "updated";

  await furnitureService.changeLifecycleStatusService(asset, status.toUpperCase(), actionName, req.user, remarks);

  await createLogDb({
    action: "Changed Furniture Asset Status",
    entityType: "Furniture",
    entityId: assetId,
    user: req.user.id,
    userRole: req.user.role,
    details: `Asset status changed to ${status}. Remarks: ${remarks || 'N/A'}`,
    status: "success"
  });

  return sendSuccess(res, 200, "Asset status updated successfully.");
});

export const getFurnitureAssetsByType = asyncHandler(async (req, res) => {
  const { typeId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const status = req.query.status ? req.query.status.toUpperCase() : undefined;
  const search = req.query.search;

  const matchQuery = { furnitureTypeId: typeId };
  if (status && status !== "ALL") {
    matchQuery.status = status;
  } else {
    matchQuery.status = { not: "INACTIVE" };
  }
  if (search) matchQuery.furnitureId = { contains: search, mode: "insensitive" };

  const assets = await furnitureService.getFurnitureAssetsListService(matchQuery, skip, limit);
  const total = await prisma.furnitureAsset.count({ where: matchQuery });

  return sendSuccess(res, 200, "Assets retrieved.", { assets, total, page, limit });
});

export const getAllHostelFurnitureAssets = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const status = req.query.status ? req.query.status.toUpperCase() : undefined;
  const search = req.query.search;

  const scope = await resolveUserScope(req.user);

  const typeQuery = {};
  if (req.user.role === "admin") {
    typeQuery.organizationId = scope.organizationId;
  } else if (req.user.role === "warden") {
    typeQuery.hostelId = scope.hostelId;
  }

  const types = await prisma.furnitureType.findMany({
    where: typeQuery,
    select: { id: true }
  });
  const typeIds = types.map(t => t.id);

  const matchQuery = { furnitureTypeId: { in: typeIds } };
  if (status && status !== "ALL") {
    matchQuery.status = status;
  } else {
    matchQuery.status = { not: "INACTIVE" };
  }
  if (search) matchQuery.furnitureId = { contains: search, mode: "insensitive" };

  const assets = await furnitureService.getFurnitureAssetsListService(matchQuery, skip, limit);
  const total = await prisma.furnitureAsset.count({ where: matchQuery });

  return sendSuccess(res, 200, "All Hostel Assets retrieved.", { assets, total, page, limit });
});

export const getFurnitureAssetDetails = asyncHandler(async (req, res) => {
  const { assetId } = req.params;

  if (!uuidRegex.test(assetId)) {
    return sendError(res, 400, "Invalid Asset ID");
  }

  const assetDetails = await furnitureService.getFurnitureAssetDetailsService(assetId);

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
  if (req.query.hostelId) {
    query.hostelId = req.query.hostelId;
  }

  if (search) {
    query.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { prefix: { contains: search, mode: "insensitive" } },
    ];
  }

  const types = await prisma.furnitureType.findMany({
    where: query,
    select: { id: true, name: true, prefix: true },
    skip,
    take: limit
  });

  const total = await prisma.furnitureType.count({ where: query });

  const mappedTypes = types.map(t => ({
    _id: t.id,
    name: t.name,
    prefix: t.prefix
  }));

  return sendSuccess(res, 200, "Active furniture types retrieved.", { types: mappedTypes, total, page, limit });
});

export const getAvailableFurnitureAssetsList = asyncHandler(async (req, res) => {
  const { typeId } = req.params;

  if (!uuidRegex.test(typeId)) {
    return sendError(res, 400, "Invalid Furniture Type ID");
  }

  const scope = await resolveUserScope(req.user);

  const typeQuery = { id: typeId, isActive: true };
  if (req.user.role === "admin") {
    typeQuery.organizationId = scope.organizationId;
  } else if (req.user.role === "warden") {
    typeQuery.hostelId = scope.hostelId;
  }

  const typeExists = await prisma.furnitureType.findFirst({
    where: typeQuery,
    select: { id: true }
  });

  if (!typeExists) {
    return sendError(res, 403, "Access denied or Furniture Type not found.");
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search;

  const assetQuery = {
    furnitureTypeId: typeId,
    status: "AVAILABLE"
  };

  if (search) {
    assetQuery.furnitureId = { contains: search, mode: "insensitive" };
  }

  const assets = await prisma.furnitureAsset.findMany({
    where: assetQuery,
    select: { id: true, furnitureId: true },
    skip,
    take: limit
  });

  const total = await prisma.furnitureAsset.count({ where: assetQuery });

  const mappedAssets = assets.map(a => ({
    _id: a.id,
    furnitureId: a.furnitureId
  }));

  return sendSuccess(res, 200, "Available furniture assets retrieved.", { assets: mappedAssets, total, page, limit });
});
