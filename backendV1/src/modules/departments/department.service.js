import { prisma } from '../../config/prisma.js';

export const createDepartmentService = async (departmentData, user) => {
  const { name, code, courseId, isActive } = departmentData;

  // Check if course exists and user is authorized (if not super_admin)
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new Error('Course not found');
  }

  if (user?.role !== 'super_admin' && course.organizationId !== user?.organizationId) {
    throw new Error('Unauthorized to add department to this course');
  }

  const existingDepartment = await prisma.department.findUnique({
    where: { code }
  });

  if (existingDepartment) {
    throw new Error('Department with this code already exists');
  }

  const newDepartment = await prisma.department.create({
    data: {
      name,
      code,
      courseId,
      isActive: isActive !== undefined ? isActive : true,
    }
  });
  
  // Increment departments count in course
  await prisma.course.update({
    where: { id: courseId },
    data: { departmentsCount: { increment: 1 } }
  });

  return newDepartment;
};

export const getDepartmentsService = async (query, user) => {
  const { page = 1, limit = 10, search = '', status } = query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  if (user?.role !== 'super_admin' && user?.organizationId) {
    where.course = {
      organizationId: user.organizationId
    };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status && status !== 'All') {
    where.isActive = status === 'Active';
  }

  const queryOptions = {
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      course: {
        select: { id: true, name: true, code: true, organizationId: true, organization: { select: { id: true, name: true, code: true } } }
      }
    }
  };

  if (limitNum > 0) {
    queryOptions.skip = skip;
    queryOptions.take = limitNum;
  }

  const [departments, totalCount] = await Promise.all([
    prisma.department.findMany(queryOptions),
    prisma.department.count({ where })
  ]);

  const totalPages = limitNum > 0 ? Math.ceil(totalCount / limitNum) : 1;

  return {
    data: departments,
    totalCount,
    totalPages
  };
};

export const toggleDepartmentStatusService = async (id, user, statusData = {}) => {
  const department = await prisma.department.findUnique({
    where: { id },
    include: { course: true }
  });
  
  if (!department) {
    throw new Error('Department not found');
  }

  if (user?.role !== 'super_admin' && department.course.organizationId !== user?.organizationId) {
    throw new Error('Unauthorized');
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
    newIsActive = !department.isActive;
  }

  return prisma.department.update({
    where: { id },
    data: { isActive: newIsActive }
  });
};

export const bulkToggleDepartmentStatusService = async (ids, isActive, user) => {
  const where = { id: { in: ids } };
  
  if (user?.role !== 'super_admin' && user?.organizationId) {
    where.course = {
      organizationId: user.organizationId
    };
  }

  const result = await prisma.department.updateMany({
    where,
    data: { isActive }
  });
  
  return result;
};

export const updateDepartmentService = async (id, departmentData, user) => {
  const { name, code, courseId, isActive } = departmentData;

  const existingDepartment = await prisma.department.findUnique({
    where: { id },
    include: { course: true }
  });
  
  if (!existingDepartment) {
    throw new Error('Department not found');
  }

  if (user?.role !== 'super_admin' && existingDepartment.course.organizationId !== user?.organizationId) {
    throw new Error('Unauthorized');
  }

  if (code && code !== existingDepartment.code) {
    const duplicateCodeDepartment = await prisma.department.findUnique({ where: { code } });
    if (duplicateCodeDepartment) {
      throw new Error('Department with this code already exists');
    }
  }

  if (courseId && courseId !== existingDepartment.courseId) {
    const newCourse = await prisma.course.findUnique({ where: { id: courseId } });
    if (!newCourse) {
      throw new Error('Course not found');
    }
    if (user?.role !== 'super_admin' && newCourse.organizationId !== user?.organizationId) {
      throw new Error('Unauthorized to move department to this course');
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (code !== undefined) updateData.code = code;
  if (courseId !== undefined) updateData.courseId = courseId;
  if (isActive !== undefined) updateData.isActive = isActive;
  
  const updatedDepartment = await prisma.department.update({
    where: { id },
    data: updateData
  });

  if (courseId && courseId !== existingDepartment.courseId) {
    // Decrement from old course
    await prisma.course.update({
      where: { id: existingDepartment.courseId },
      data: { departmentsCount: { decrement: 1 } }
    });
    // Increment to new course
    await prisma.course.update({
      where: { id: courseId },
      data: { departmentsCount: { increment: 1 } }
    });
  }

  return updatedDepartment;
};
