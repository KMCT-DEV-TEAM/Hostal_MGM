import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';
import { createCourseService, getCoursesService, toggleCourseStatusService, bulkToggleCourseStatusService, updateCourseService } from './course.service.js';
import { createLog } from '../../utils/log.util.js';

export const createCourse = asyncHandler(async (req, res) => {
  try {
    const organizationId = req.user?.role === "super_admin" ? req.body.organizationId : req.user?.organizationId;
    
    if (!organizationId) {
      return sendError(res, 400, 'Organization ID is missing');
    }

    const courseData = {
      ...req.body,
      organizationId,
    };

    const newCourse = await createCourseService(courseData);
    
    await createLog(
      req,
      "Created Course",
      "Course",
      newCourse.id,
      `Created course: ${newCourse.name} (${newCourse.code})`,
      "success"
    );

    return sendSuccess(res, 201, 'Course created successfully', newCourse);
  } catch (error) {
    if (error.message === 'Course with this code already exists') {
      return sendError(res, 400, error.message);
    }
    throw error;
  }
});

export const getCourses = asyncHandler(async (req, res) => {
  const result = await getCoursesService(req.query, req.user);
  return sendSuccess(res, 200, 'Courses retrieved successfully', result);
});

export const getCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement getById
  return sendSuccess(res, 200, 'Course retrieved successfully', {});
});

export const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const updatedCourse = await updateCourseService(id, req.body, req.user);
    
    await createLog(
      req,
      "Updated Course",
      "Course",
      updatedCourse.id,
      `Updated course: ${updatedCourse.name} (${updatedCourse.code})`,
      "success"
    );

    return sendSuccess(res, 200, 'Course updated successfully', updatedCourse);
  } catch (error) {
    if (error.message === 'Course not found' || error.message === 'Unauthorized') {
      return sendError(res, error.message === 'Unauthorized' ? 403 : 404, error.message);
    }
    if (error.message === 'Course with this code already exists') {
      return sendError(res, 400, error.message);
    }
    throw error;
  }
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Implement delete
  return sendSuccess(res, 200, 'Course deleted successfully');
});

export const toggleCourseStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const updatedCourse = await toggleCourseStatusService(id, req.user, req.body);

    await createLog(
      req,
      "Toggled Course Status",
      "Course",
      updatedCourse.id,
      `Status changed to ${updatedCourse.isActive ? 'Active' : 'Inactive'} for course ${updatedCourse.name}`,
      "success"
    );

    return sendSuccess(res, 200, 'Course status updated successfully', updatedCourse);
  } catch (error) {
    if (error.message === 'Course not found' || error.message === 'Unauthorized') {
      return sendError(res, error.message === 'Unauthorized' ? 403 : 404, error.message);
    }
    throw error;
  }
});

export const bulkToggleCourseStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;
  if (!Array.isArray(ids) || typeof isActive !== 'boolean') {
    return sendError(res, 400, 'Invalid request body');
  }
  
  const result = await bulkToggleCourseStatusService(ids, isActive, req.user);

  await createLog(
    req,
    "Bulk Status Update (Courses)",
    "Course",
    null,
    `Updated status to ${isActive ? 'Active' : 'Inactive'} for ${result.count} courses`,
    "success"
  );

  return sendSuccess(res, 200, `Successfully updated ${result.count} courses`);
});
