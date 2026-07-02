import FurnitureAsset from "./furnitureAsset.model.js";
import FurnitureType from "./furnitureType.model.js";

export const getDashboardSummaryAggregation = async (matchQuery) => {
  const result = await FurnitureAsset.aggregate([
    {
      $lookup: {
        from: "furnituretypes",
        localField: "furnitureTypeId",
        foreignField: "_id",
        as: "typeInfo",
      },
    },
    { $unwind: "$typeInfo" },
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalAssets: { $sum: { $cond: [{ $in: ["$status", ["Available", "Allocated", "Maintenance"]] }, 1, 0] } },
        available: { $sum: { $cond: [{ $eq: ["$status", "Available"] }, 1, 0] } },
        allocated: { $sum: { $cond: [{ $eq: ["$status", "Allocated"] }, 1, 0] } },
        maintenance: { $sum: { $cond: [{ $eq: ["$status", "Maintenance"] }, 1, 0] } },
        inactive: { $sum: { $cond: [{ $eq: ["$status", "Inactive"] }, 1, 0] } },
        lost: { $sum: { $cond: [{ $eq: ["$status", "Lost"] }, 1, 0] } },
        scrap: { $sum: { $cond: [{ $eq: ["$status", "Scrap"] }, 1, 0] } },
      },
    },
  ]);

  return result.length > 0 ? result[0] : { totalAssets: 0, available: 0, allocated: 0, maintenance: 0, inactive: 0, lost: 0, scrap: 0 };
};

export const getFurnitureTypeDistributionAggregation = async (matchQuery) => {
  return await FurnitureAsset.aggregate([
    {
      $lookup: {
        from: "furnituretypes",
        localField: "furnitureTypeId",
        foreignField: "_id",
        as: "typeInfo",
      },
    },
    { $unwind: "$typeInfo" },
    { $match: matchQuery },
    { $match: { status: { $in: ["Available", "Allocated", "Maintenance"] } } },
    {
      $group: {
        _id: "$typeInfo.name",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

export const getFurnitureTypesListAggregation = async (matchQuery, skip, limit) => {
  return await FurnitureType.aggregate([
    { $match: matchQuery },
    {
      $lookup: {
        from: "furnitureassets",
        localField: "_id",
        foreignField: "furnitureTypeId",
        as: "assets",
      },
    },
    {
      $project: {
        name: 1,
        prefix: 1,
        description: 1,
        isActive: 1,
        organizationId: 1,
        hostelId: 1,
        createdAt: 1,
        total: { $size: { $filter: { input: "$assets", as: "asset", cond: { $in: ["$$asset.status", ["Available", "Allocated", "Maintenance"]] } } } },
        available: { $size: { $filter: { input: "$assets", as: "asset", cond: { $eq: ["$$asset.status", "Available"] } } } },
        allocated: { $size: { $filter: { input: "$assets", as: "asset", cond: { $eq: ["$$asset.status", "Allocated"] } } } },
        maintenance: { $size: { $filter: { input: "$assets", as: "asset", cond: { $eq: ["$$asset.status", "Maintenance"] } } } },
        inactive: { $size: { $filter: { input: "$assets", as: "asset", cond: { $eq: ["$$asset.status", "Inactive"] } } } },
        lost: { $size: { $filter: { input: "$assets", as: "asset", cond: { $eq: ["$$asset.status", "Lost"] } } } },
        scrap: { $size: { $filter: { input: "$assets", as: "asset", cond: { $eq: ["$$asset.status", "Scrap"] } } } },
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);
};
