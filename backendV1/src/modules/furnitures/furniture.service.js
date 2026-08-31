import { prisma } from "../../config/prisma.js";
import { orchestratorService } from "../notification/services/orchestrator.service.js";

export const checkAnyAssetAllocatedForTypeDb = async (typeId, tx = prisma) => {
  const asset = await tx.furnitureAsset.findFirst({
    where: {
      furnitureTypeId: typeId,
      OR: [
        { studentId: { not: null } },
        { status: { not: "AVAILABLE" } }
      ]
    },
    select: { id: true }
  });
  return !!asset;
};

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

    return newType;
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

export const bulkAllocateAssetsToStudentService = async (student, assets, actor) => {
  return await prisma.$transaction(async (tx) => {
    const assetIds = assets.map(a => a.id);
    const studentName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim();

    await tx.furnitureAsset.updateMany({
      where: { id: { in: assetIds } },
      data: { status: "ALLOCATED", studentId: student.id, updatedById: actor.id }
    });

    const historyDocs = assets.map(asset => ({
      furnitureAssetId: asset.id,
      action: "allocated",
      previousStatus: "AVAILABLE",
      currentStatus: "ALLOCATED",
      studentId: student.id,
      performedById: actor.id,
      performedByRole: actor.role,
      remarks: "Allocated Furniture to Student",
    }));

    await tx.furnitureAssetHistory.createMany({ data: historyDocs });

    // Trigger Notifications after transaction completes
    try {
      const sender = actor ? { id: actor.id, role: actor.role, name: actor.name } : null;

      orchestratorService.triggerNotification({
        sender,
        eventName: 'FURNITURE_ALLOCATED',
        target: [
          { type: 'STUDENT', filter: { studentIds: [student.id] } },
          { type: 'PARENT', filter: { studentIds: [student.id] } }
        ],
        data: { count: assets.length, studentName }
      }).catch(err => console.error(err));

      if (student.hostelId) {
        const wardenRelations = await tx.hostelWarden.findMany({
          where: { hostelId: student.hostelId },
          select: { wardenId: true }
        });
        const wardenIds = wardenRelations.map(rel => rel.wardenId);

        if (wardenIds.length > 0) {
          orchestratorService.triggerNotification({
            sender,
            eventName: 'FURNITURE_ALLOCATED',
            target: { type: 'USER', filter: { userIds: wardenIds } },
            data: { count: assets.length, studentName }
          }).catch(err => console.error(err));
        }
      }
    } catch (notifErr) {
      console.error("[Notification Error - Furniture Allocated]", notifErr);
    }

    return { status: "success", count: assets.length };
  });
};

export const returnAssetService = async (asset, actor) => {
  return await prisma.$transaction(async (tx) => {
    const previousStudent = asset.studentId;

    await tx.furnitureAsset.update({
      where: { id: asset.id },
      data: { status: "AVAILABLE", studentId: null, updatedById: actor.id }
    });

    await tx.furnitureAssetHistory.create({
      data: {
        furnitureAssetId: asset.id,
        action: "returned",
        previousStatus: "ALLOCATED",
        currentStatus: "AVAILABLE",
        studentId: previousStudent,
        performedById: actor.id,
        performedByRole: actor.role,
        remarks: "Returned Furniture from Student"
      }
    });

    // Trigger Notifications
    try {
      if (previousStudent) {
        const student = await tx.student.findUnique({
          where: { id: previousStudent },
          select: { name: true, firstName: true, lastName: true, hostelId: true }
        });

        if (student) {
          const studentName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim();
          const sender = actor ? { id: actor.id, role: actor.role, name: actor.name } : null;

          orchestratorService.triggerNotification({
            sender,
            eventName: 'FURNITURE_RETURNED',
            target: [
              { type: 'STUDENT', filter: { studentIds: [previousStudent] } },
              { type: 'PARENT', filter: { studentIds: [previousStudent] } }
            ],
            data: { assetId: asset.furnitureId || asset.id, studentName }
          }).catch(err => console.error(err));

          if (student.hostelId) {
            const wardenRelations = await tx.hostelWarden.findMany({
              where: { hostelId: student.hostelId },
              select: { wardenId: true }
            });
            const wardenIds = wardenRelations.map(rel => rel.wardenId);

            if (wardenIds.length > 0) {
              orchestratorService.triggerNotification({
                sender,
                eventName: 'FURNITURE_RETURNED',
                target: { type: 'USER', filter: { userIds: wardenIds } },
                data: { assetId: asset.furnitureId || asset.id, studentName }
              }).catch(err => console.error(err));
            }
          }
        }
      }
    } catch (notifErr) {
      console.error("[Notification Error - Furniture Returned]", notifErr);
    }

    return true;
  });
};

export const deleteFurnitureTypeService = async (typeId, actor) => {
  return await prisma.$transaction(async (tx) => {
    const hasStartedLifecycle = await checkAnyAssetAllocatedForTypeDb(typeId, tx);
    if (hasStartedLifecycle) {
      const error = new Error("Furniture Type cannot be deleted because one or more furniture assets have entered their lifecycle.");
      error.code = "FT004";
      throw error;
    }

    const hasInactive = await tx.furnitureAsset.findFirst({
      where: { furnitureTypeId: typeId, status: "INACTIVE" }
    });
    if (hasInactive) {
      const error = new Error("Cannot delete furniture type while it contains Inactive assets. Please restore them to active inventory first.");
      error.code = "FT005";
      throw error;
    }

    const eligibleAssets = await tx.furnitureAsset.findMany({
      where: { furnitureTypeId: typeId, status: "AVAILABLE", studentId: null },
      select: { id: true }
    });

    const assetIds = eligibleAssets.map((a) => a.id);

    if (assetIds.length > 0) {
      const timelines = assetIds.map(id => ({
        furnitureAssetId: id,
        action: "deleted",
        previousStatus: "AVAILABLE",
        currentStatus: "deleted", // Note: The enum is just for current status on Asset, history status is a string
        performedById: actor.id,
        performedByRole: actor.role,
        remarks: "Deleted Type cascade",
      }));

      await tx.furnitureAssetHistory.createMany({
        data: timelines
      });

      await tx.furnitureAsset.deleteMany({
        where: { id: { in: assetIds } }
      });
    }

    await tx.furnitureType.delete({
      where: { id: typeId }
    });

    return true;
  });
};

export const getDashboardSummaryService = async (matchQuery) => {
  const types = await prisma.furnitureType.findMany({
    where: matchQuery,
    select: { id: true }
  });

  if (types.length === 0) {
    return { totalAssets: 0, available: 0, allocated: 0, maintenance: 0, lost: 0, scrap: 0 };
  }

  const typeIds = types.map(t => t.id);

  const counts = await prisma.furnitureAsset.groupBy({
    by: ['status'],
    where: {
      furnitureTypeId: { in: typeIds },
      status: { not: 'INACTIVE' }
    },
    _count: { _all: true }
  });

  const summary = { totalAssets: 0, available: 0, allocated: 0, maintenance: 0, lost: 0, scrap: 0 };

  counts.forEach(group => {
    const status = group.status.toLowerCase();
    const count = group._count._all;
    if (summary[status] !== undefined) {
      summary[status] = count;
    }
  });

  summary.totalAssets = summary.available + summary.allocated + summary.maintenance;
  return summary;
};

export const getFurnitureTypeDistributionService = async (matchQuery) => {
  const types = await prisma.furnitureType.findMany({
    where: matchQuery,
    select: { id: true, name: true }
  });

  if (types.length === 0) return [];

  const typeMap = new Map(types.map(t => [t.id, t.name]));
  const typeIds = Array.from(typeMap.keys());

  const distributionRaw = await prisma.furnitureAsset.groupBy({
    by: ['furnitureTypeId'],
    where: {
      furnitureTypeId: { in: typeIds },
      status: { in: ['AVAILABLE', 'ALLOCATED', 'MAINTENANCE'] }
    },
    _count: { _all: true },
    orderBy: { _count: { _all: 'desc' } }
  });

  return distributionRaw.map(d => ({
    id: d.furnitureTypeId,
    count: d._count._all
  }));
};

export const getFurnitureAssetsListService = async (matchQuery, skip, limit) => {
  const assets = await prisma.furnitureAsset.findMany({
    where: matchQuery,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      student: { select: { id: true, name: true, admissionNo: true } },
      furnitureType: {
        include: {
          organization: { select: { id: true, name: true } },
          hostel: { select: { id: true, name: true } }
        }
      }
    }
  });

  return assets.map(asset => ({
    id: asset.id,
    furnitureId: asset.furnitureId,
    furnitureTypeId: asset.furnitureTypeId,
    typeInfo: asset.furnitureType ? {
      id: asset.furnitureType.id,
      name: asset.furnitureType.name,
      prefix: asset.furnitureType.prefix
    } : null,
    organization: asset.furnitureType?.organization ? {
      id: asset.furnitureType.organization.id,
      name: asset.furnitureType.organization.name
    } : null,
    hostel: asset.furnitureType?.hostel ? {
      id: asset.furnitureType.hostel.id,
      name: asset.furnitureType.hostel.name
    } : null,
    status: asset.status.toLowerCase(),
    remarks: asset.remarks,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    studentId: asset.student ? {
      id: asset.student.id,
      name: asset.student.name,
      admissionNo: asset.student.admissionNo
    } : null
  }));
};

export const getFurnitureTypesListService = async (matchQuery, skip, limit) => {
  const types = await prisma.furnitureType.findMany({
    where: matchQuery,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      organization: { select: { id: true, name: true } },
      hostel: { select: { id: true, name: true } }
    }
  });

  if (types.length === 0) return [];

  const typeIds = types.map(t => t.id);

  const assetCounts = await prisma.furnitureAsset.groupBy({
    by: ['furnitureTypeId', 'status'],
    where: { furnitureTypeId: { in: typeIds } },
    _count: { _all: true }
  });

  const countMap = {};
  for (const group of assetCounts) {
    if (!countMap[group.furnitureTypeId]) {
      countMap[group.furnitureTypeId] = {
        total: 0,
        available: 0,
        allocated: 0,
        maintenance: 0,
        lost: 0,
        scrap: 0
      };
    }
    const status = group.status.toLowerCase();
    const count = group._count._all;

    if (countMap[group.furnitureTypeId][status] !== undefined) {
      countMap[group.furnitureTypeId][status] = count;
      if (['available', 'allocated', 'maintenance'].includes(status)) {
        countMap[group.furnitureTypeId].total += count;
      }
    }
  }

  return types.map(type => {
    const counts = countMap[type.id] || {
      total: 0, available: 0, allocated: 0, maintenance: 0, lost: 0, scrap: 0
    };

    return {
      id: type.id,
      name: type.name,
      prefix: type.prefix,
      description: type.description,
      isActive: type.isActive,
      createdAt: type.createdAt,
      organization: type.organization ? { id: type.organization.id, name: type.organization.name } : null,
      hostel: type.hostel ? { id: type.hostel.id, name: type.hostel.name } : null,
      ...counts
    };
  });
};

export const changeLifecycleStatusService = async (asset, newStatus, actionName, actor, remarks) => {
  return await prisma.$transaction(async (tx) => {
    const updateData = { status: newStatus, updatedById: actor.id };

    if (["AVAILABLE", "MAINTENANCE", "SCRAP"].includes(newStatus)) {
      updateData.studentId = null;
    }

    await tx.furnitureAsset.update({
      where: { id: asset.id },
      data: updateData
    });

    await tx.furnitureAssetHistory.create({
      data: {
        furnitureAssetId: asset.id,
        action: actionName,
        previousStatus: asset.status,
        currentStatus: newStatus,
        studentId: asset.studentId, // log the student that had it (for lost event)
        performedById: actor.id,
        performedByRole: actor.role,
        remarks: remarks || null
      }
    });

    return true;
  });
};

export const getFurnitureAssetDetailsService = async (assetId) => {
  const asset = await prisma.furnitureAsset.findUnique({
    where: { id: assetId },
    include: {
      furnitureType: { select: { name: true, prefix: true } },
      student: { select: { id: true, name: true } },
      histories: {
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { id: true, name: true } },
          performedBy: { select: { name: true } }
        }
      }
    }
  });

  if (!asset) return null;

  return {
    id: asset.id,
    furnitureId: asset.furnitureId,
    status: asset.status.toLowerCase(),
    createdAt: asset.createdAt,
    furnitureName: asset.furnitureType?.name,
    prefix: asset.furnitureType?.prefix,
    currentAssignment: asset.student ? {
      studentName: asset.student.name,
      studentId: asset.student.id,
      assignedDate: asset.updatedAt
    } : null,
    timeline: asset.histories.map(h => ({
      id: h.id,
      action: h.action,
      previousStatus: h.previousStatus ? h.previousStatus.toLowerCase() : null,
      currentStatus: h.currentStatus ? h.currentStatus.toLowerCase() : null,
      remarks: h.remarks,
      createdAt: h.createdAt,
      student: h.student ? {
        id: h.student.id,
        name: h.student.name
      } : null,
      performedBy: h.performedBy ? {
        name: h.performedBy.name,
        role: h.performedByRole
      } : null
    }))
  };
};
