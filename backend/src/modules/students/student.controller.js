import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { checkExistingUser, createStudentWithParentDb, updateStudentDb, toggleStudentStatusDb } from "./student.service.js";
import { getAggregateOrganizationDataDb } from "../organizations/organization.service.js";
import User from "../users/user.model.js";

const createStudent = asyncHandler(async (req, res) => {
  const { email, parentemail } = req.body;

  const existingStudent = await checkExistingUser(email);
  if (existingStudent) {
    return sendError(res, 400, "Student email already exists");
  }

  const existingParent = await checkExistingUser(parentemail);
  if (existingParent) {
    return sendError(res, 400, "Parent email already exists");
  }

  const result = await createStudentWithParentDb(req.body);

  return sendSuccess(res, 201, "Student and Parent created successfully", {
    data: {
      studentId: result.studentProfile._id,
      studentUserId: result.studentUser._id,
      parentId: result.parentProfile._id,
      parentUserId: result.parentUser._id,
      name: result.studentUser.name,
      email: result.studentUser.email,
    }
  });
});

const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let result;
  try {
    result = await updateStudentDb(id, req.body);
  } catch (error) {
    if (error.message === "Student email already exists") {
      return sendError(res, 400, error.message);
    }
    throw error;
  }

  if (!result) {
    return sendError(res, 404, "Student not found");
  }

  return sendSuccess(res, 200, "Student updated successfully", {
    data: {
      studentId: result.studentProfile._id,
      name: result.user.name,
      email: result.user.email,
    }
  });
});

const toggleStudentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await toggleStudentStatusDb(id);

  if (!result) {
    return sendError(res, 404, "Student not found");
  }

  const message = result.user.isActive 
    ? "Student activated successfully" 
    : "Student deactivated successfully";

  return sendSuccess(res, 200, message, {
    data: {
      studentId: result.studentProfile._id,
      isActive: result.user.isActive,
    }
  });
});

const getAdminOrganizationData = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization;

  if (!organizationId) {
    return sendError(res, 400, "Admin is not assigned to any organization");
  }

  const data = await getAggregateOrganizationDataDb(organizationId);

  if (!data || data.length === 0) {
    return sendError(res, 404, "Organization data not found");
  }

  return sendSuccess(res, 200, "Organization data fetched successfully", {
    data: data[0]
  });
});

const getAdminStats = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization;

  if (!organizationId) {
    return sendError(res, 400, "Admin is not assigned to any organization");
  }

  const studentCount = await User.countDocuments({ 
    role: "student", 
    organization: organizationId 
  });

  return sendSuccess(res, 200, "Admin stats fetched successfully", {
    data: {
      students: studentCount,
    },
  });
});

export {
  createStudent,
  updateStudent,
  toggleStudentStatus,
  getAdminOrganizationData,
  getAdminStats
};
