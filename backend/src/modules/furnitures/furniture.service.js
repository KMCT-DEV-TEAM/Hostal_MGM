import mongoose from "mongoose";
import FurnitureAsset from "./furnitureAsset.model.js";
import FurnitureType from "./furnitureType.model.js";

const validTransitions = {
  Available: ["Allocated", "Maintenance", "Lost", "Scrap", "Retired"],
  Allocated: ["Available", "Maintenance", "Lost", "Scrap"],
  Maintenance: ["Available", "Lost", "Scrap"],
  Lost: [],
  Scrap: [],
  Retired: []
};

const addAssetsDb = async (typeId, quantity, remarks, userId, existingSession = null) => {
  const session = existingSession || await mongoose.startSession();
  let resultLength = 0;

  try {
    if (!existingSession) session.startTransaction();

    const type = await FurnitureType.findById(typeId).session(session);
    if (!type) throw new Error("FurnitureType not found");

    const prefix = type.prefix;

    const lastAsset = await FurnitureAsset.findOne({ furnitureTypeId: typeId })
      .sort({ furnitureId: -1 })
      .session(session);
    const lastSeq = lastAsset ? parseInt(lastAsset.furnitureId.split('-')[1], 10) : 0;
    const startNumber = lastSeq + 1;


    const newAssets = [];
    for (let i = 0; i < quantity; i++) {
      const currentNumber = startNumber + i;
      const paddedNumber = currentNumber.toString().padStart(6, '0');
      const furnitureId = `${prefix}-${paddedNumber}`;

      newAssets.push({
        furnitureId,
        furnitureTypeId: typeId,

        status: "Available",
        remarks,
        createdBy: userId,
        updatedBy: userId,
      });
    }

    const result = await FurnitureAsset.insertMany(newAssets, { session });
    resultLength = result.length;

    if (!existingSession) await session.commitTransaction();
  } catch (error) {
    if (!existingSession) await session.abortTransaction();
    throw error;
  } finally {
    if (!existingSession) session.endSession();
  }

  return resultLength;
};

const createFurnitureTypeDb = async (data, userId) => {
  const { openingStock, remarks, ...typeData } = data;

  const session = await mongoose.startSession();
  let createdType = null;

  try {
    session.startTransaction();

    const types = await FurnitureType.create([{
      ...typeData,
      createdBy: userId,
      updatedBy: userId
    }], { session });

    createdType = types[0];

    const quantity = Number(openingStock) || 0;
    if (quantity > 0) {
      await addAssetsDb(createdType._id, quantity, remarks, userId, session);
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return createdType;
};

const reduceAssetsDb = async (typeId, quantity, existingSession = null) => {
  const session = existingSession || await mongoose.startSession();
  let reducedCount = 0;

  try {
    if (!existingSession) session.startTransaction();

    const match = {
      furnitureTypeId: typeId,
      status: "Available",
      studentId: null
    };

    const eligibleAssets = await FurnitureAsset.find(match)
      .session(session)
      .sort({ createdAt: -1 })
      .limit(quantity)
      .select("_id");

    if (eligibleAssets.length < quantity) {
      throw new Error(`Cannot reduce ${quantity} assets. Only ${eligibleAssets.length} eligible assets available.`);
    }

    const assetIds = eligibleAssets.map(a => a._id);

    await FurnitureAsset.deleteMany(
      { _id: { $in: assetIds } },
      { session }
    );

    reducedCount = assetIds.length;

    if (!existingSession) await session.commitTransaction();
  } catch (error) {
    if (!existingSession) await session.abortTransaction();
    throw error;
  } finally {
    if (!existingSession) session.endSession();
  }

  return reducedCount;
};

const adjustAssetCountDb = async (typeId, newCount, remarks, userId) => {
  const session = await mongoose.startSession();
  let result = 0;

  try {
    session.startTransaction();

    const match = {
      furnitureTypeId: typeId,
      status: { $ne: "Available" }
    };

    const activeCount = await FurnitureAsset.countDocuments(match).session(session);

    if (newCount > activeCount) {
      const quantity = newCount - activeCount;
      result = await addAssetsDb(typeId, quantity, remarks, userId, session);
    } else if (newCount < activeCount) {
      const quantity = activeCount - newCount;
      result = await reduceAssetsDb(typeId, quantity, session);
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return result;
};

const changeAssetStatusDb = async (assetId, newStatus) => {
  const session = await mongoose.startSession();
  let asset = null;

  try {
    session.startTransaction();

    asset = await FurnitureAsset.findById(assetId).session(session);
    if (!asset) throw new Error("Asset not found");

    const currentStatus = asset.status;
    if (currentStatus !== newStatus) {
      const allowedNext = validTransitions[currentStatus] || [];
      if (!allowedNext.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      }

      asset.status = newStatus;
      await asset.save({ session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return asset;
};

const getFurnitureTypesWithCountsDb = async (query, skip, limit, sort) => {
  const { search, status } = query;

  const matchType = {};
  if (search) {
    matchType.name = { $regex: search, $options: "i" };
  }

  const assetMatch = {};

  const pipeline = [
    { $match: matchType },
    {
      $lookup: {
        from: "furnitureassets",
        let: { typeId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$furnitureTypeId", "$$typeId"] },
              ...assetMatch
            }
          }
        ],
        as: "assets"
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        prefix: 1,
        description: 1,
        isActive: 1,
        total: { $size: "$assets" },
        allocated: { $size: { $filter: { input: "$assets", as: "a", cond: { $eq: ["$$a.status", "Allocated"] } } } },
        available: { $size: { $filter: { input: "$assets", as: "a", cond: { $eq: ["$$a.status", "Available"] } } } },
        maintenance: { $size: { $filter: { input: "$assets", as: "a", cond: { $eq: ["$$a.status", "Maintenance"] } } } },
        lost: { $size: { $filter: { input: "$assets", as: "a", cond: { $eq: ["$$a.status", "Lost"] } } } },
        scrap: { $size: { $filter: { input: "$assets", as: "a", cond: { $eq: ["$$a.status", "Scrap"] } } } },
        retired: { $size: { $filter: { input: "$assets", as: "a", cond: { $eq: ["$$a.status", "Retired"] } } } }
      }
    }
  ];

  if (status && status !== "All") {
    const statusField = status.toLowerCase();
    pipeline.push({
      $match: {
        [statusField]: { $gt: 0 }
      }
    });
  }

  const countPipeline = [...pipeline, { $count: "total" }];
  pipeline.push({ $sort: sort || { name: 1 } });

  if (limit > 0) {
    pipeline.push({ $skip: skip }, { $limit: limit });
  }

  const [docs, countResult] = await Promise.all([
    FurnitureType.aggregate(pipeline),
    FurnitureType.aggregate(countPipeline)
  ]);

  return { docs, totalCount: countResult.length > 0 ? countResult[0].total : 0 };
};

const getFurnitureTypeSummaryDb = async (typeId, hostelId) => {
  const assetMatch = {};
  if (hostelId) {
    assetMatch.hostelId = new mongoose.Types.ObjectId(hostelId);
  }
  const pipeline = [
    { $match: { _id: new mongoose.Types.ObjectId(typeId) } },
    {
      $lookup: {
        from: "furnitureassets",
        let: { tId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$furnitureTypeId", "$$tId"] },
              ...assetMatch
            }
          }
        ],
        as: "assets"
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        prefix: 1,
        description: 1,
        isActive: 1,
        total: { $size: "$assets" },
        allocated: { $size: { $filter: { input: "$assets", as: "a", cond: { $eq: ["$$a.status", "Allocated"] } } } },
        available: { $size: { $filter: { input: "$assets", as: "a", cond: { $eq: ["$$a.status", "Available"] } } } },
        maintenance: { $size: { $filter: { input: "$assets", as: "a", cond: { $eq: ["$$a.status", "Maintenance"] } } } },
        lost: { $size: { $filter: { input: "$assets", as: "a", cond: { $eq: ["$$a.status", "Lost"] } } } },
        scrap: { $size: { $filter: { input: "$assets", as: "a", cond: { $eq: ["$$a.status", "Scrap"] } } } },
        retired: { $size: { $filter: { input: "$assets", as: "a", cond: { $eq: ["$$a.status", "Retired"] } } } }
      }
    }
  ];
  const result = await FurnitureType.aggregate(pipeline);
  return result[0] || null;
};

const getFurnitureAssetsDb = async (query, skip, limit, sort) => {
  const docs = await FurnitureAsset.find(query)
    .populate("hostelId", "name")
    .populate("studentId", "name admissionNo")
    .sort(sort || { furnitureId: 1 })
    .collation({ locale: "en_US", numericOrdering: true })
    .skip(skip)
    .limit(limit)
    .lean();
  const totalCount = await FurnitureAsset.countDocuments(query);
  return { docs, totalCount };
};

const updateFurnitureTypeDb = async (typeId, data) => {
  const session = await mongoose.startSession();
  let updatedType = null;

  try {
    session.startTransaction();

    const assetCount = await FurnitureAsset.countDocuments({ furnitureTypeId: typeId }).session(session);

    if (assetCount > 0) {
      if (data.name !== undefined || data.prefix !== undefined) {
        const type = await FurnitureType.findById(typeId).session(session);
        if ((data.name && data.name !== type.name) || (data.prefix && data.prefix !== type.prefix)) {
          throw new Error("Furniture name and prefix cannot be changed after assets have been created.");
        }
      }
    }

    updatedType = await FurnitureType.findByIdAndUpdate(typeId, data, { new: true, runValidators: true, session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return updatedType;
};

const deleteFurnitureTypeDb = async (typeId) => {
  const session = await mongoose.startSession();
  let result = null;

  try {
    session.startTransaction();

    // Fetch the type to get its prefix
    const type = await FurnitureType.findById(typeId).session(session);
    if (!type) {
      throw new Error("Furniture type not found.");
    }

    // Count assets for this type
    const assetCount = await FurnitureAsset.countDocuments({ furnitureTypeId: typeId }).session(session);

    if (assetCount === 0) {
      // No assets – safe to delete type directly
      result = await FurnitureType.findByIdAndDelete(typeId).session(session);
    } else {
      // Assets exist – verify they are all still in initial state
      const assets = await FurnitureAsset.find({ furnitureTypeId: typeId }).session(session);
      const allClear = assets.every(a => a.status === "Available" && (a.studentId === null || a.studentId === undefined));
      if (!allClear) {
        // Lifecycle already started – reject deletion
        throw new Error("Furniture Type cannot be deleted because one or more assets have already entered their lifecycle.");
      }
      // All assets are still available and unassigned – delete them then delete type
      await FurnitureAsset.deleteMany({ furnitureTypeId: typeId }).session(session);
      result = await FurnitureType.findByIdAndDelete(typeId).session(session);
    }

    // Delete the counter document for this prefix

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return result;
};

export {
  createFurnitureTypeDb,
  adjustAssetCountDb,
  changeAssetStatusDb,
  getFurnitureTypesWithCountsDb,
  getFurnitureTypeSummaryDb,
  getFurnitureAssetsDb,
  updateFurnitureTypeDb,
  deleteFurnitureTypeDb
};
