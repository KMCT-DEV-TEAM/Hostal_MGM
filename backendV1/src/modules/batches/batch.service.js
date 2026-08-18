import { prisma } from '../../config/prisma.js';

export const createBatchService = async (batchData, user) => {
  const { name, code, departmentId, startYear, endYear, isActive } = batchData;

  const existingBatch = await prisma.batch.findUnique({
    where: { code }
  });

  if (existingBatch) {
    throw new Error('Batch with this code already exists');
  }

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    include: { course: true }
  });

  if (!department) {
    throw new Error('Department not found');
  }

  if (user?.role !== 'super_admin' && department.course.organizationId !== user?.organizationId) {
    throw new Error('Unauthorized');
  }

  const newBatch = await prisma.batch.create({
    data: {
      name,
      code,
      departmentId,
      startYear: parseInt(startYear),
      endYear: parseInt(endYear),
      isActive: isActive !== undefined ? isActive : true
    }
  });

  await prisma.department.update({
    where: { id: departmentId },
    data: { batchesCount: { increment: 1 } }
  });

  return newBatch;
};

export const getBatchesService = async (queryParams, user) => {
  const { page = 1, limit = 10, search = '', status } = queryParams;
  const skip = (page - 1) * limit;
  const limitNum = parseInt(limit);

  const where = {};

  if (user?.role !== 'super_admin' && user?.organizationId) {
    where.department = {
      course: {
        organizationId: user.organizationId
      }
    };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (status && status !== 'All') {
    where.isActive = status === 'Active';
  }

  const queryOptions = {
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      department: {
        select: { id: true, name: true, code: true, courseId: true, course: { select: { id: true, name: true, code: true, organizationId: true, organization: { select: { id: true, name: true, code: true } } } } }
      }
    }
  };

  if (limitNum > 0) {
    queryOptions.skip = skip;
    queryOptions.take = limitNum;
  }

  const [batches, totalCount] = await Promise.all([
    prisma.batch.findMany(queryOptions),
    prisma.batch.count({ where })
  ]);

  const totalPages = limitNum > 0 ? Math.ceil(totalCount / limitNum) : 1;

  return {
    data: batches,
    totalCount,
    totalPages
  };
};

export const toggleBatchStatusService = async (id, user) => {
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: { department: { include: { course: true } } }
  });
  
  if (!batch) {
    throw new Error('Batch not found');
  }

  if (user?.role !== 'super_admin' && batch.department.course.organizationId !== user?.organizationId) {
    throw new Error('Unauthorized');
  }

  return prisma.batch.update({
    where: { id },
    data: { isActive: !batch.isActive }
  });
};

export const bulkToggleBatchStatusService = async (ids, isActive, user) => {
  const where = { id: { in: ids } };
  
  if (user?.role !== 'super_admin' && user?.organizationId) {
    where.department = {
      course: {
        organizationId: user.organizationId
      }
    };
  }

  const result = await prisma.batch.updateMany({
    where,
    data: { isActive }
  });
  
  return result;
};

export const updateBatchService = async (id, batchData, user) => {
  const { name, code, departmentId, startYear, endYear, isActive } = batchData;

  const existingBatch = await prisma.batch.findUnique({
    where: { id },
    include: { department: { include: { course: true } } }
  });
  
  if (!existingBatch) {
    throw new Error('Batch not found');
  }

  if (user?.role !== 'super_admin' && existingBatch.department.course.organizationId !== user?.organizationId) {
    throw new Error('Unauthorized');
  }

  if (code && code !== existingBatch.code) {
    const duplicateCodeBatch = await prisma.batch.findUnique({ where: { code } });
    if (duplicateCodeBatch) {
      throw new Error('Batch with this code already exists');
    }
  }

  if (departmentId && departmentId !== existingBatch.departmentId) {
    const newDepartment = await prisma.department.findUnique({ 
      where: { id: departmentId },
      include: { course: true }
    });
    if (!newDepartment) {
      throw new Error('Department not found');
    }
    if (user?.role !== 'super_admin' && newDepartment.course.organizationId !== user?.organizationId) {
      throw new Error('Unauthorized to move batch to this department');
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (code !== undefined) updateData.code = code;
  if (departmentId !== undefined) updateData.departmentId = departmentId;
  if (startYear !== undefined) updateData.startYear = parseInt(startYear);
  if (endYear !== undefined) updateData.endYear = parseInt(endYear);
  if (isActive !== undefined) updateData.isActive = isActive;
  
  const updatedBatch = await prisma.batch.update({
    where: { id },
    data: updateData
  });

  if (departmentId && departmentId !== existingBatch.departmentId) {
    // Decrement from old department
    await prisma.department.update({
      where: { id: existingBatch.departmentId },
      data: { batchesCount: { decrement: 1 } }
    });
    // Increment to new department
    await prisma.department.update({
      where: { id: departmentId },
      data: { batchesCount: { increment: 1 } }
    });
  }

  return updatedBatch;
};
