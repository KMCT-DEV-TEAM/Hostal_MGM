import asyncHandler from "../../utils/asyncHandler.js";
import { createLogDb } from "../logs/log.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import {
  checkExistingCourseCodeDb,
  createCourseDb,
  getPaginatedCoursesDb,
  getAllCoursesDb,
  getCourseByIdDb,
  updateCourseDb,
  toggleCourseStatusDb,
  bulkUpdateCourseStatusDb,
} from "./course.service.js";

const createCourse = asyncHandler(async (req, res) => {
  let { name, code, organizationId } = req.body;

  if (req.user.role === 'admin' && req.user.organization) {
    organizationId = req.user.organization;
  }

  const existingCourse = await checkExistingCourseCodeDb(code);
  if (existingCourse) {
    return sendError(res, 400, "Course code already exists");
  }

  const newCourse = await createCourseDb({ name, code, organizationId });

  if (req.user) {
      await createLogDb({
          action: "Created Course",
          entityType: "Course",
          entityId: newCourse._id,
          user: req.user.id || req.user._id,
          userRole: req.user.role || 'System',
          details: `Created new course: ${name} (${code})`,
          status: "success"
      });
  }

  return sendSuccess(res, 201, "Course created successfully", {
    data: newCourse,
  });
});

const getCourses = asyncHandler(async (req, res) => {
  const { page, limit, search, status, organizationId } = req.query;

  const query = {};
  const andConditions = [];

  if (req.user.role === "admin") {
    andConditions.push({
      $or: [
        { organizationId: req.user.organization },
        { organizationId: { $exists: false } },
        { organizationId: null }
      ]
    });
  } else if (organizationId) {
    query.organizationId = organizationId;
  }
  
  if (search) {
    andConditions.push({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ]
    });
  }

  if (andConditions.length > 0) {
    query.$and = andConditions;
  }

  if (status && status !== "All") {
    query.isActive = status === "Active";
  }

  const sort = { createdAt: -1 };

  if (limit && Number(limit) === 0) {
    const courses = await getAllCoursesDb(query, sort);
    return sendSuccess(res, 200, "All Courses retrieved successfully", {
      data: courses,
      totalCount: courses.length,
      totalPages: 1,
    });
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const courses = await getPaginatedCoursesDb(query, skip, limitNum, sort);
  const totalCount = await import("./course.model.js").then((m) => m.default.countDocuments(query));

  return sendSuccess(res, 200, "Courses retrieved successfully", {
    data: courses,
    totalCount,
    totalPages: Math.ceil(totalCount / limitNum),
  });
});

const getCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const course = await getCourseByIdDb(id);

  if (!course) {
    return sendError(res, 404, "Course not found");
  }

  return sendSuccess(res, 200, "Course retrieved successfully", { data: course });
});

const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, organizationId } = req.body;

  if (code) {
    const existingCode = await checkExistingCourseCodeDb(code);
    if (existingCode && existingCode._id.toString() !== id) {
      return sendError(res, 400, "Course code already exists");
    }
  }

  const course = await updateCourseDb(id, { name, code, organizationId });

  if (!course) {
    return sendError(res, 404, "Course not found");
  }

  if (req.user) {
      await createLogDb({
          action: "Updated Course",
          entityType: "Course",
          entityId: course._id,
          user: req.user.id || req.user._id,
          userRole: req.user.role || 'System',
          details: `Updated details for course: ${name || course.name}`,
          status: "success"
      });
  }

  return sendSuccess(res, 200, "Course updated successfully", { data: course });
});

const toggleCourseStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const course = await toggleCourseStatusDb(id);

  if (!course) {
    return sendError(res, 404, "Course not found");
  }

  if (req.user) {
      await createLogDb({
          action: "Updated Course Status",
          entityType: "Course",
          entityId: course._id,
          user: req.user.id || req.user._id,
          userRole: req.user.role || 'System',
          details: `Changed course status to ${course.isActive ? 'Active' : 'Inactive'} for course: ${course.name}`,
          status: "success"
      });
  }

  return sendSuccess(res, 200, "Course status toggled successfully", {
    data: course,
  });
});

const bulkUpdateCourseStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return sendError(res, 400, "Please provide an array of course IDs");
  }

  if (typeof isActive !== "boolean") {
    return sendError(res, 400, "Please provide a valid isActive status");
  }

  await bulkUpdateCourseStatusDb(ids, isActive);

  if (req.user) {
      await createLogDb({
          action: "Bulk Updated Course Status",
          entityType: "Course",
          entityId: null,
          user: req.user.id || req.user._id,
          userRole: req.user.role || 'System',
          details: `Bulk updated status to ${isActive ? 'Active' : 'Inactive'} for ${ids.length} courses`,
          status: "success"
      });
  }

  return sendSuccess(res, 200, "Bulk status updated successfully");
});

export {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  toggleCourseStatus,
  bulkUpdateCourseStatus,
};
