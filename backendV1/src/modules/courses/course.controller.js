import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';
import { createCourseService, getCoursesService, toggleCourseStatusService, bulkToggleCourseStatusService, updateCourseService } from './course.service.js';
import { createLogDb } from '../logs/log.service.js';

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
    
    await createLogDb({
      action: "Created Course",
      entityType: "Course",
      entityId: newCourse.id,
      user: req.user.id,
      userRole: req.user.role,
      details: `Created course: ${newCourse.name} (${newCourse.code})`,
      status: "success"
    });

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
    
    await createLogDb({
      action: "Updated Course",
      entityType: "Course",
      entityId: updatedCourse.id,
      user: req.user.id,
      userRole: req.user.role,
      details: `Updated course: ${updatedCourse.name} (${updatedCourse.code})`,
      status: "success"
    });

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

    await createLogDb({
      action: "Toggled Course Status",
      entityType: "Course",
      entityId: updatedCourse.id,
      user: req.user.id,
      userRole: req.user.role,
      details: `Status changed to ${updatedCourse.isActive ? 'Active' : 'Inactive'} for course ${updatedCourse.name}`,
      status: "success"
    });

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

  await createLogDb({
    action: "Bulk Status Update (Courses)",
    entityType: "Course",
    user: req.user.id,
    userRole: req.user.role,
    details: `Updated status to ${isActive ? 'Active' : 'Inactive'} for ${result.count} courses`,
    status: "success"
  });

  return sendSuccess(res, 200, `Successfully updated ${result.count} courses`);
});
