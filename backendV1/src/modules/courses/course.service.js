import { prisma } from '../../config/prisma.js';

export const createCourseService = async (courseData) => {
  const { name, code, organizationId, isActive } = courseData;

  const existingCourse = await prisma.course.findUnique({
    where: { code }
  });

  if (existingCourse) {
    throw new Error('Course with this code already exists');
  }

  const newCourse = await prisma.course.create({
    data: {
      name,
      code,
      organizationId,
      isActive: isActive !== undefined ? isActive : true,
    }
  });

  return newCourse;
};

export const getCoursesService = async (query, user) => {
  const { page = 1, limit = 10, search = '', status } = query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  if (user?.role !== 'super_admin' && user?.organizationId) {
    where.organizationId = user.organizationId;
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
      organization: {
        select: { id: true, name: true, code: true }
      }
    }
  };

  if (limitNum > 0) {
    queryOptions.skip = skip;
    queryOptions.take = limitNum;
  }

  const [courses, totalCount] = await Promise.all([
    prisma.course.findMany(queryOptions),
    prisma.course.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / limitNum);

  return {
    data: courses,
    totalCount,
    totalPages
  };
};

export const toggleCourseStatusService = async (id, user) => {
  const course = await prisma.course.findUnique({ where: { id } });
  
  if (!course) {
    throw new Error('Course not found');
  }

  // Optional: Check if user has permission for this org's course
  if (user?.role !== 'super_admin' && course.organizationId !== user?.organizationId) {
    throw new Error('Unauthorized');
  }

  return prisma.course.update({
    where: { id },
    data: { isActive: !course.isActive }
  });
};

export const bulkToggleCourseStatusService = async (ids, isActive, user) => {
  const where = { id: { in: ids } };
  
  if (user?.role !== 'super_admin' && user?.organizationId) {
    where.organizationId = user.organizationId;
  }

  const result = await prisma.course.updateMany({
    where,
    data: { isActive }
  });
  
  return result;
};

export const updateCourseService = async (id, courseData, user) => {
  const { name, code, organizationId, isActive } = courseData;

  const existingCourse = await prisma.course.findUnique({ where: { id } });
  
  if (!existingCourse) {
    throw new Error('Course not found');
  }

  // Security check: only allow updating own organization courses unless super_admin
  if (user?.role !== 'super_admin' && existingCourse.organizationId !== user?.organizationId) {
    throw new Error('Unauthorized');
  }

  // Check for duplicate code if code is being updated
  if (code && code !== existingCourse.code) {
    const duplicateCodeCourse = await prisma.course.findUnique({ where: { code } });
    if (duplicateCodeCourse) {
      throw new Error('Course with this code already exists');
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (code !== undefined) updateData.code = code;
  if (isActive !== undefined) updateData.isActive = isActive;
  
  // Organization can only be updated by super_admin
  if (organizationId !== undefined && user?.role === 'super_admin') {
    updateData.organizationId = organizationId;
  }

  return prisma.course.update({
    where: { id },
    data: updateData
  });
};
