import mongoose from "mongoose";
import FurnitureType from "./furnitureType.model.js";
import FurnitureAsset from "./furnitureAsset.model.js";
import FurnitureAssetHistory from "./furnitureAssetHistory.model.js";

// --- DB Layer Functions ---
export const getLatestAssetIdByPrefixDb = async (prefix, session) => {
  return await FurnitureAsset.findOne({ furnitureId: { $regex: `^${prefix}-` } })
    .sort({ furnitureId: -1 })
    .session(session)
    .select("furnitureId")
    .lean();
};

export const checkAnyAssetAllocatedForTypeDb = async (typeId, session) => {
  const asset = await FurnitureAsset.findOne({
    furnitureTypeId: typeId,
    $or: [{ studentId: { $ne: null } }, { status: { $ne: "Available" } }],
  }).session(session).select("_id").lean();
  return !!asset;
};

// --- Service Layer Functions ---
export const createFurnitureTypeService = async (data, openingStock, actor) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existing = await FurnitureType.findOne({
      organizationId: data.organizationId,
      hostelId: data.hostelId,
      $or: [{ name: data.name }, { prefix: data.prefix }],
    }).session(session).lean();

    if (existing) {
      const error = new Error(existing.name === data.name ? "Duplicate Name" : "Duplicate Prefix");
      error.code = existing.name === data.name ? "FT001" : "FT002";
      throw error;
    }

    const newType = new FurnitureType(data);
    await newType.save({ session });

    if (openingStock > 0) {
      const latestAsset = await getLatestAssetIdByPrefixDb(newType.prefix, session);
      let startingNumber = 1;

      if (latestAsset && latestAsset.furnitureId) {
        const parts = latestAsset.furnitureId.split("-");
        const lastNumber = parseInt(parts[1], 10);
        if (!isNaN(lastNumber)) {
          startingNumber = lastNumber + 1;
        }
      }

      const generatedIds = [];
      for (let i = 0; i < openingStock; i++) {
        const currentNumber = startingNumber + i;
        const formattedNumber = String(currentNumber).padStart(6, "0");
        generatedIds.push(`${newType.prefix}-${formattedNumber}`);
      }

      const assetsToInsert = generatedIds.map((id) => ({
        furnitureId: id,
        furnitureTypeId: newType._id,
        status: "Available",
        studentId: null,
        createdBy: actor._id,
        updatedBy: actor._id,
      }));

      const createdAssets = await FurnitureAsset.insertMany(assetsToInsert, { session });

      const timelinesToInsert = createdAssets.map((asset) => ({
        furnitureAssetId: asset._id,
        action: "Created",
        currentStatus: "Available",
        performedBy: actor._id,
        performedByRole: actor.role,
        remarks: "Opening Stock",
      }));

      await FurnitureAssetHistory.insertMany(timelinesToInsert, { session });
    }

    await session.commitTransaction();
    return newType.toObject();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const deleteFurnitureTypeService = async (typeId, actor) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const hasStartedLifecycle = await checkAnyAssetAllocatedForTypeDb(typeId, session);
    if (hasStartedLifecycle) {
      const error = new Error("Furniture Type cannot be deleted because one or more furniture assets have entered their lifecycle.");
      error.code = "FT004";
      throw error;
    }

    const hasInactive = await FurnitureAsset.findOne({ furnitureTypeId: typeId, status: "Inactive" }).session(session).lean();
    if (hasInactive) {
      const error = new Error("Cannot delete furniture type while it contains Inactive assets. Please restore them to active inventory first.");
      error.code = "FT005";
      throw error;
    }

    const eligibleAssets = await FurnitureAsset.find({ furnitureTypeId: typeId, status: "Available", studentId: null })
      .session(session)
      .select("_id")
      .lean();

    const assetIds = eligibleAssets.map((a) => a._id);

    if (assetIds.length > 0) {
      const timelines = assetIds.map(id => ({
        furnitureAssetId: id,
        action: "Deleted",
        previousStatus: "Available",
        currentStatus: "Deleted",
        performedBy: actor._id,
        performedByRole: actor.role,
        remarks: "Deleted Type cascade",
      }));
      await FurnitureAssetHistory.insertMany(timelines, { session });
      await FurnitureAsset.deleteMany({ _id: { $in: assetIds } }, { session });
    }

    await FurnitureType.findByIdAndDelete(typeId, { session });

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const adjustAssetCountService = async (typeId, newCount, actor) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const type = await FurnitureType.findById(typeId).session(session).lean();
    if (!type) throw new Error("Furniture Type Not Found");

    // Total Active inventory (matches the dashboard logic)
    const currentCount = await FurnitureAsset.countDocuments({
      furnitureTypeId: typeId,
      status: { $in: ["Available", "Allocated", "Maintenance"] }
    }).session(session);

    if (newCount === currentCount) {
      await session.abortTransaction();
      session.endSession();
      return { status: "no_change" };
    }

    if (newCount > currentCount) {
      let difference = newCount - currentCount;

      // 1. Find Inactive Assets
      const inactiveAssets = await FurnitureAsset.find({
        furnitureTypeId: typeId,
        status: "Inactive"
      })
        .sort({ createdAt: 1 }) // oldest first to restore
        .limit(difference)
        .session(session)
        .select("_id")
        .lean();

      if (inactiveAssets.length > 0) {
        const inactiveIds = inactiveAssets.map(a => a._id);

        await FurnitureAsset.updateMany(
          { _id: { $in: inactiveIds } },
          { $set: { status: "Available", updatedBy: actor._id } },
          { session }
        );

        const timelines = inactiveIds.map(id => ({
          furnitureAssetId: id,
          action: "Inventory Increased",
          previousStatus: "Inactive",
          currentStatus: "Available",
          performedBy: actor._id,
          performedByRole: actor.role,
          remarks: "Inventory Count Increased",
        }));
        await FurnitureAssetHistory.insertMany(timelines, { session });

        difference -= inactiveIds.length;
      }

      // 2. Generate New Assets if difference still exists
      if (difference > 0) {
        const latestAsset = await getLatestAssetIdByPrefixDb(type.prefix, session);
        let startingNumber = 1;
        if (latestAsset && latestAsset.furnitureId) {
          startingNumber = parseInt(latestAsset.furnitureId.split("-")[1], 10) + 1;
        }

        const generatedIds = Array.from({ length: difference }).map((_, i) => `${type.prefix}-${String(startingNumber + i).padStart(6, "0")}`);

        const assetsToInsert = generatedIds.map((id) => ({
          furnitureId: id,
          furnitureTypeId: type._id,
          status: "Available",
          studentId: null,
          createdBy: actor._id,
          updatedBy: actor._id,
        }));

        const createdAssets = await FurnitureAsset.insertMany(assetsToInsert, { session });

        const timelines = createdAssets.map((asset) => ({
          furnitureAssetId: asset._id,
          action: "Created",
          currentStatus: "Available",
          performedBy: actor._id,
          performedByRole: actor.role,
          remarks: "Count Increased",
        }));
        await FurnitureAssetHistory.insertMany(timelines, { session });
      }

    } else {
      const difference = currentCount - newCount;
      const eligibleAssets = await FurnitureAsset.find({ furnitureTypeId: typeId, status: "Available", studentId: null })
        .sort({ createdAt: -1 })
        .limit(difference)
        .session(session)
        .select("_id")
        .lean();

      if (eligibleAssets.length < difference) {
        throw new Error(`Cannot reduce by ${difference} assets. Only ${eligibleAssets.length} are currently eligible (Available).`);
      }

      const assetIds = eligibleAssets.map((a) => a._id);

      await FurnitureAsset.updateMany(
        { _id: { $in: assetIds } },
        { $set: { status: "Inactive", updatedBy: actor._id } },
        { session }
      );

      const timelines = assetIds.map(id => ({
        furnitureAssetId: id,
        action: "Inventory Reduced",
        previousStatus: "Available",
        currentStatus: "Inactive",
        performedBy: actor._id,
        performedByRole: actor.role,
        remarks: "Inventory Count Reduced",
      }));

      await FurnitureAssetHistory.insertMany(timelines, { session });
    }

    await session.commitTransaction();
    return { status: "success" };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const allocateAssetService = async (asset, student, actor) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await FurnitureAsset.findByIdAndUpdate(
      asset._id,
      { status: "Allocated", studentId: student._id, updatedBy: actor._id },
      { new: true, session }
    );

    const history = new FurnitureAssetHistory({
      furnitureAssetId: asset._id,
      action: "Allocated",
      previousStatus: "Available",
      currentStatus: "Allocated",
      studentId: student._id,
      performedBy: actor._id,
      performedByRole: actor.role,
      metadata: { studentName: student.name, enrollmentNo: student.enrollmentNo }
    });
    await history.save({ session });

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const returnAssetService = async (asset, actor) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const previousStudent = asset.studentId;

    await FurnitureAsset.findByIdAndUpdate(
      asset._id,
      { status: "Available", studentId: null, updatedBy: actor._id },
      { new: true, session }
    );

    const history = new FurnitureAssetHistory({
      furnitureAssetId: asset._id,
      action: "Returned",
      previousStatus: "Allocated",
      currentStatus: "Available",
      studentId: previousStudent,
      performedBy: actor._id,
      performedByRole: actor.role,
    });
    await history.save({ session });

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const changeLifecycleStatusService = async (asset, newStatus, actionName, actor, remarks) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updateData = { status: newStatus, updatedBy: actor._id };
    if (["Available", "Maintenance", "Scrap"].includes(newStatus)) {
      updateData.studentId = null;
    }

    await FurnitureAsset.findByIdAndUpdate(asset._id, updateData, { new: true, session });

    const history = new FurnitureAssetHistory({
      furnitureAssetId: asset._id,
      action: actionName,
      previousStatus: asset.status,
      currentStatus: newStatus,
      studentId: asset.studentId, // log the student that had it (for lost event)
      performedBy: actor._id,
      performedByRole: actor.role,
      remarks,
    });
    await history.save({ session });

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
