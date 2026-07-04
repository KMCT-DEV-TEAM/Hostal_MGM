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
        totalAssets: { $sum: { $cond: [{ $in: ["$status", ["available", "allocated", "maintenance"]] }, 1, 0] } },
        available: { $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] } },
        allocated: { $sum: { $cond: [{ $eq: ["$status", "allocated"] }, 1, 0] } },
        maintenance: { $sum: { $cond: [{ $eq: ["$status", "maintenance"] }, 1, 0] } },
        inactive: { $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } },
        lost: { $sum: { $cond: [{ $eq: ["$status", "lost"] }, 1, 0] } },
        scrap: { $sum: { $cond: [{ $eq: ["$status", "scrap"] }, 1, 0] } },
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
    { $match: { status: { $in: ["available", "allocated", "maintenance"] } } },
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
      $lookup: {
        from: "organizations",
        localField: "organizationId",
        foreignField: "_id",
        as: "organization",
      },
    },
    { $unwind: { path: "$organization", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "hostels",
        localField: "hostelId",
        foreignField: "_id",
        as: "hostel",
      },
    },
    { $unwind: { path: "$hostel", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: 1,
        prefix: 1,
        description: 1,
        isActive: 1,
        organization: {
          $cond: {
            if: "$organization",
            then: { _id: "$organization._id", name: "$organization.name" },
            else: null
          }
        },
        hostel: {
          $cond: {
            if: "$hostel",
            then: { _id: "$hostel._id", name: "$hostel.name" },
            else: null
          }
        },
        createdAt: 1,
        total: { $size: { $filter: { input: "$assets", as: "asset", cond: { $in: ["$$asset.status", ["available", "allocated", "maintenance"]] } } } },
        available: { $size: { $filter: { input: "$assets", as: "asset", cond: { $eq: ["$$asset.status", "available"] } } } },
        allocated: { $size: { $filter: { input: "$assets", as: "asset", cond: { $eq: ["$$asset.status", "allocated"] } } } },
        maintenance: { $size: { $filter: { input: "$assets", as: "asset", cond: { $eq: ["$$asset.status", "maintenance"] } } } },
        inactive: { $size: { $filter: { input: "$assets", as: "asset", cond: { $eq: ["$$asset.status", "inactive"] } } } },
        lost: { $size: { $filter: { input: "$assets", as: "asset", cond: { $eq: ["$$asset.status", "lost"] } } } },
        scrap: { $size: { $filter: { input: "$assets", as: "asset", cond: { $eq: ["$$asset.status", "scrap"] } } } },
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);
};

export const getFurnitureAssetsListAggregation = async (matchQuery, skip, limit) => {
  return await FurnitureAsset.aggregate([
    { $match: matchQuery },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    {
      $unwind: {
        path: "$student",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        furnitureId: 1,
        furnitureTypeId: 1,
        status: 1,
        remarks: 1,
        createdAt: 1,
        updatedAt: 1,
        studentId: {
          $cond: {
            if: "$student",
            then: {
              _id: "$student._id",
              name: "$student.name",
              studentId: "$student.studentId"
            },
            else: null
          }
        },
      }
    }
  ]);
};

export const getFurnitureAssetDetailsAggregation = async (assetId) => {
  const result = await FurnitureAsset.aggregate([
    { $match: { _id: assetId } },
    {
      $lookup: {
        from: "furnituretypes",
        localField: "furnitureTypeId",
        foreignField: "_id",
        as: "typeInfo",
      },
    },
    { $unwind: { path: "$typeInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "furnitureassethistories",
        let: { assetId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$furnitureAssetId", "$$assetId"] } } },
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "historyStudent",
            }
          },
          { $unwind: { path: "$historyStudent", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "users",
              localField: "performedBy",
              foreignField: "_id",
              as: "user",
            }
          },
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              action: 1,
              previousStatus: 1,
              currentStatus: 1,
              remarks: 1,
              createdAt: 1,
              "student.name": "$historyStudent.name",
              "student._id": "$historyStudent._id",
              "performedBy.name": "$user.name",
              "performedBy.role": "$performedByRole"
            }
          }
        ],
        as: "timeline",
      },
    },
    {
      $project: {
        _id: 1,
        furnitureId: 1,
        status: 1,
        createdAt: 1,
        furnitureName: "$typeInfo.name",
        prefix: "$typeInfo.prefix",
        currentAssignment: {
          $cond: {
            if: "$student",
            then: {
              studentName: "$student.name",
              studentId: "$student._id",
              assignedDate: "$updatedAt" // Approximating assigned date from last asset update
            },
            else: null
          }
        },
        timeline: 1
      }
    }
  ]);
  return result[0] || null;
};
