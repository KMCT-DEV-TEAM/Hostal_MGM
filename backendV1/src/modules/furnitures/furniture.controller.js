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

    const openingStock = req.body.openingStock || 0;

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
