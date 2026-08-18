import { prisma } from "../../config/prisma.js";

export const getLatestAssetIdByPrefixDb = async (prefix, tx) => {
  return await tx.furnitureAsset.findFirst({
    where: {
      furnitureId: {
        startsWith: `${prefix}-`
      }
    },
    orderBy: {
      furnitureId: 'desc'
    },
    select: {
      furnitureId: true
    }
  });
};

export const createFurnitureTypeService = async (data, openingStock, actor) => {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.furnitureType.findFirst({
      where: {
        organizationId: data.organizationId,
        hostelId: data.hostelId,
        OR: [
          { name: data.name },
          { prefix: data.prefix }
        ]
      }
    });

    if (existing) {
      const error = new Error(existing.name === data.name ? "Duplicate Name" : "Duplicate Prefix");
      error.code = existing.name === data.name ? "FT001" : "FT002";
      throw error;
    }

    const newType = await tx.furnitureType.create({
      data: {
        organizationId: data.organizationId,
        hostelId: data.hostelId,
        name: data.name,
        prefix: data.prefix,
        description: data.description,
        isActive: data.isActive,
        createdById: data.createdBy,
        updatedById: data.updatedBy,
      }
    });

    if (openingStock > 0) {
      const latestAsset = await getLatestAssetIdByPrefixDb(newType.prefix, tx);
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
        furnitureTypeId: newType.id,
        status: "AVAILABLE",
        studentId: null,
        createdById: actor.id,
        updatedById: actor.id,
      }));

      await tx.furnitureAsset.createMany({
        data: assetsToInsert
      });

      const createdAssets = await tx.furnitureAsset.findMany({
        where: {
          furnitureId: { in: generatedIds }
        }
      });

      const timelinesToInsert = createdAssets.map((asset) => ({
        furnitureAssetId: asset.id,
        action: "created",
        currentStatus: "AVAILABLE",
        performedById: actor.id,
        performedByRole: actor.role,
        remarks: "Opening Stock",
      }));

      await tx.furnitureAssetHistory.createMany({
        data: timelinesToInsert
      });
    }

    // Map `id` to `_id` to maintain Mongoose `.lean()` structure equivalent
    return { ...newType, _id: newType.id };
  });
};

export const adjustAssetCountService = async (typeId, newCount, actor) => {
  return await prisma.$transaction(async (tx) => {
    const type = await tx.furnitureType.findUnique({
      where: { id: typeId }
    });
    if (!type) throw new Error("Furniture Type Not Found");

    const currentCount = await tx.furnitureAsset.count({
      where: {
        furnitureTypeId: typeId,
        status: { in: ["AVAILABLE", "ALLOCATED", "MAINTENANCE"] }
      }
    });

    if (newCount === currentCount) {
      return { status: "no_change" };
    }

    if (newCount > currentCount) {
      let difference = newCount - currentCount;

      const inactiveAssets = await tx.furnitureAsset.findMany({
        where: {
          furnitureTypeId: typeId,
          status: "INACTIVE"
        },
        orderBy: { createdAt: 'asc' },
        take: difference,
        select: { id: true }
      });

      if (inactiveAssets.length > 0) {
        const inactiveIds = inactiveAssets.map(a => a.id);

        await tx.furnitureAsset.updateMany({
          where: { id: { in: inactiveIds } },
          data: { status: "AVAILABLE", updatedById: actor.id }
        });

        const timelines = inactiveIds.map(id => ({
          furnitureAssetId: id,
          action: "inventory increased",
          previousStatus: "INACTIVE",
          currentStatus: "AVAILABLE",
          performedById: actor.id,
          performedByRole: actor.role,
          remarks: "Inventory Count Increased",
        }));
        await tx.furnitureAssetHistory.createMany({ data: timelines });

        difference -= inactiveIds.length;
      }

      if (difference > 0) {
        const latestAsset = await getLatestAssetIdByPrefixDb(type.prefix, tx);
        let startingNumber = 1;
        if (latestAsset && latestAsset.furnitureId) {
          startingNumber = parseInt(latestAsset.furnitureId.split("-")[1], 10) + 1;
        }

        const generatedIds = Array.from({ length: difference }).map((_, i) => `${type.prefix}-${String(startingNumber + i).padStart(6, "0")}`);

        const assetsToInsert = generatedIds.map((id) => ({
          furnitureId: id,
          furnitureTypeId: type.id,
          status: "AVAILABLE",
          studentId: null,
          createdById: actor.id,
          updatedById: actor.id,
        }));

        await tx.furnitureAsset.createMany({ data: assetsToInsert });

        const createdAssets = await tx.furnitureAsset.findMany({
          where: { furnitureId: { in: generatedIds } }
        });

        const timelines = createdAssets.map((asset) => ({
          furnitureAssetId: asset.id,
          action: "created",
          currentStatus: "AVAILABLE",
          performedById: actor.id,
          performedByRole: actor.role,
          remarks: "Count Increased",
        }));
        await tx.furnitureAssetHistory.createMany({ data: timelines });
      }
    } else {
      const difference = currentCount - newCount;
      const eligibleAssets = await tx.furnitureAsset.findMany({
        where: {
          furnitureTypeId: typeId,
          status: "AVAILABLE",
          studentId: null
        },
        orderBy: { createdAt: 'desc' },
        take: difference,
        select: { id: true }
      });

      if (eligibleAssets.length < difference) {
        throw new Error(`Cannot reduce by ${difference} assets. Only ${eligibleAssets.length} are currently eligible (Available).`);
      }

      const assetIds = eligibleAssets.map((a) => a.id);

      await tx.furnitureAsset.updateMany({
        where: { id: { in: assetIds } },
        data: { status: "INACTIVE", updatedById: actor.id }
      });

      const timelines = assetIds.map(id => ({
        furnitureAssetId: id,
        action: "inventory reduced",
        previousStatus: "AVAILABLE",
        currentStatus: "INACTIVE",
        performedById: actor.id,
        performedByRole: actor.role,
        remarks: "Inventory Count Reduced",
      }));

      await tx.furnitureAssetHistory.createMany({ data: timelines });
    }

    return { status: "updated", previousCount: currentCount, newCount };
  });
};
