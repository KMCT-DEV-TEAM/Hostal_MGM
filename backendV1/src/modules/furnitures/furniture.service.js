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
