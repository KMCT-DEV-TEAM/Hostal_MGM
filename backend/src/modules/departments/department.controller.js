import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import {
  checkExistingDepartmentCodeDb,
  createDepartmentDb,
  getPaginatedDepartmentsDb,
  getAllDepartmentsDb,
  getDepartmentByIdDb,
  updateDepartmentDb,
  toggleDepartmentStatusDb,
  bulkUpdateDepartmentStatusDb,
} from "./department.service.js";

const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, courseId } = req.body;

  const existingDepartment = await checkExistingDepartmentCodeDb(code);
  if (existingDepartment) {
    return sendError(res, 400, "Department code already exists");
  }

  const newDepartment = await createDepartmentDb({ name, code, courseId });

  return sendSuccess(res, 201, "Department created successfully", {
    data: newDepartment,
  });
});

const getDepartments = asyncHandler(async (req, res) => {
  const { page, limit, search, status, courseId } = req.query;

  const query = {};
  if (courseId) {
    query.courseId = courseId;
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
  }
  if (status && status !== "All") {
    query.isActive = status === "Active";
  }

  const sort = { createdAt: -1 };

  if (limit && Number(limit) === 0) {
    const Departments = await getAllDepartmentsDb(query, sort);
    return sendSuccess(res, 200, "All Departments retrieved successfully", {
      data: Departments,
      totalCount: Departments.length,
      totalPages: 1,
    });
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const Departments = await getPaginatedDepartmentsDb(query, skip, limitNum, sort);
  const totalCount = await import("./department.model.js").then((m) => m.default.countDocuments(query));

  return sendSuccess(res, 200, "Departments retrieved successfully", {
    data: Departments,
    totalCount,
    totalPages: Math.ceil(totalCount / limitNum),
  });
});

const getDepartmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const Department = await getDepartmentByIdDb(id);

  if (!Department) {
    return sendError(res, 404, "Department not found");
  }

  return sendSuccess(res, 200, "Department retrieved successfully", { data: Department });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, courseId } = req.body;

  if (code) {
    const existingCode = await checkExistingDepartmentCodeDb(code);
    if (existingCode && existingCode._id.toString() !== id) {
      return sendError(res, 400, "Department code already exists");
    }
  }

  const Department = await updateDepartmentDb(id, { name, code, courseId });

  if (!Department) {
    return sendError(res, 404, "Department not found");
  }

  return sendSuccess(res, 200, "Department updated successfully", { data: Department });
});

const toggleDepartmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const Department = await toggleDepartmentStatusDb(id);

  if (!Department) {
    return sendError(res, 404, "Department not found");
  }

  return sendSuccess(res, 200, "Department status toggled successfully", {
    data: Department,
  });
});

const bulkUpdateDepartmentStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return sendError(res, 400, "Please provide an array of Department IDs");
  }

  if (typeof isActive !== "boolean") {
    return sendError(res, 400, "Please provide a valid isActive status");
  }

  await bulkUpdateDepartmentStatusDb(ids, isActive);

  return sendSuccess(res, 200, "Bulk status updated successfully");
});

export {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  toggleDepartmentStatus,
  bulkUpdateDepartmentStatus,
};

