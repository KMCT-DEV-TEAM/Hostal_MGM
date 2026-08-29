import { prisma } from '../../config/prisma.js';

export const checkExistingComplaintCategoryNameDb = async (name, excludeId = null) => {
  const where = {
    name: { equals: name, mode: 'insensitive' },
    deletedAt: null
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  return await prisma.complaintCategory.findFirst({ where });
};

export const createComplaintCategoryDb = async (data) => {
  return await prisma.complaintCategory.create({
    data: {
      name: data.name,
      description: data.description || null,
      isActive: data.isActive !== undefined ? data.isActive : true
    }
  });
};

export const getAllComplaintCategoriesDb = async (where = {}, orderBy = { createdAt: 'desc' }) => {
  return await prisma.complaintCategory.findMany({
    where: {
      ...where,
      deletedAt: null
    },
    orderBy
  });
};

export const getPaginatedComplaintCategoriesDb = async (where = {}, skip = 0, take = 10, orderBy = { createdAt: 'desc' }) => {
  const baseWhere = {
    ...where,
    deletedAt: null
  };

  const [data, totalCount] = await Promise.all([
    prisma.complaintCategory.findMany({
      where: baseWhere,
      skip,
      take,
      orderBy
    }),
    prisma.complaintCategory.count({ where: baseWhere })
  ]);

  return { data, totalCount };
};

export const getComplaintCategoryByIdDb = async (id) => {
  return await prisma.complaintCategory.findFirst({
    where: {
      id,
      deletedAt: null
    }
  });
};

export const updateComplaintCategoryDb = async (id, data) => {
  return await prisma.complaintCategory.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { isActive: data.isActive })
    }
  });
};

export const toggleComplaintCategoryStatusDb = async (id, statusData = {}) => {
  const category = await prisma.complaintCategory.findUnique({
    where: { id }
  });

  if (!category) {
    throw new Error('Complaint Category not found');
  }

  const { isActive, status } = statusData;
  let newIsActive;
  if (typeof isActive === "boolean") {
    newIsActive = isActive;
  } else if (typeof status === "string") {
    newIsActive = status.toLowerCase() === "active";
  } else if (typeof isActive === "string") {
    newIsActive = isActive.toLowerCase() === "active" || isActive === "true";
  } else {
    newIsActive = !category.isActive;
  }

  return await prisma.complaintCategory.update({
    where: { id },
    data: { isActive: newIsActive }
  });
};

export const bulkUpdateComplaintCategoryStatusDb = async (ids, isActive) => {
  return await prisma.complaintCategory.updateMany({
    where: {
      id: { in: ids },
      deletedAt: null
    },
    data: { isActive }
  });
};
