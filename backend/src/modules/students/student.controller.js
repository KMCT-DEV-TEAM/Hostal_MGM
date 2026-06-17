import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { checkExistingUser, createStudentWithParentDb, updateStudentDb, getStudentsService } from "./student.service.js";
import { getAggregateOrganizationDataDb } from "../organizations/organization.service.js";
import User from "../users/user.model.js";
import Student from "./student.model.js";
import Hostel from "../hostels/hostel.model.js";
import Organization from "../organizations/organization.model.js";

import mongoose from "mongoose";
import Parent from "../parents/parent.model.js";

const createStudent = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { email, parentEmail } = req.body;

    if (email === parentEmail) {
      await session.abortTransaction();
      return sendError(
        res,
        400,
        "Student and parent email must be different"
      );
    }

  

    const existingStudent = await Student.findOne({
      email,
    }).session(session);
    if (existingStudent) {
      await session.abortTransaction();
      return sendError(
        res,
        400,
        "Student email already exists"
      );
    }

    const existingParent = await Parent.findOne({
      email: parentEmail,
    }).session(session);

    if (existingParent) {
      await session.abortTransaction();
      return sendError(
        res,
        400,
        "Parent email already exists"
      );
    }

    const result = await createStudentWithParentDb(
      req.body,
      session
    );

    await session.commitTransaction();

    return sendSuccess(
      res,
      201,
      "Student and parent created successfully",
      result
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await updateStudentDb(id, req.body);

  if (!result) {
    return sendError(res, 404, "Student not found");
  }

  return sendSuccess(
    res,
    200,
    "Student updated successfully",
    {
      studentId: result.studentId,
      name: result.name,
      email: result.email,
    }
  );
});

const toggleStudentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await Student.findById(id);

  if (!student) {
    return sendError(res, 404, "Student not found");
  }

  student.isActive = !student.isActive;
  await student.save();

  const message = student.isActive
    ? "Student activated successfully"
    : "Student deactivated successfully";

  return sendSuccess(
    res,
    200,
    message,
    {
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      isActive: student.isActive,
    }
  );
});

const updateStudentHostelStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hostelStatus } = req.body;

  if (!["active", "inactive"].includes(hostelStatus)) {
    return sendError(res, 400, "Invalid hostelStatus");
  }

  const student = await Student.findByIdAndUpdate(
    id,
    { hostelStatus },
    { new: true, runValidators: true }
  );

  if (!student) {
    return sendError(res, 404, "Student not found");
  }

  return sendSuccess(
    res,
    200,
    "Student hostel status updated successfully",
    {
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      hostelStatus: student.hostelStatus,
    }
  );
});

const updateStudentHostel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hostelId } = req.body;

  if (!hostelId || !mongoose.Types.ObjectId.isValid(hostelId)) {
    return sendError(res, 400, "Invalid hostelId");
  }

  const hostel = await Hostel.findById(hostelId);
  if (!hostel) {
    return sendError(res, 404, "Hostel not found");
  }

  const student = await Student.findById(id);
  if (!student) {
    return sendError(res, 404, "Student not found");
  }

  student.hostelId = hostelId;
  await student.save();

  return sendSuccess(res, 200, "Student hostel updated successfully", {
    studentId: student.studentId,
    name: student.name,
    hostelId: student.hostelId,
  });
});

const updateStudentOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { organizationId } = req.body;

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    return sendError(res, 404, "Organization not found");
  }

  if (!organization.isActive) {
    return sendError(res, 400, "Cannot move student to inactive organization");
  }

  const student = await Student.findById(id);
  if (!student) {
    return sendError(res, 404, "Student not found");
  }

  if (student.organizationId.toString() === organizationId) {
    return sendError(res, 400, "Student is already assigned to this organization");
  }

 



  student.organizationId = organizationId;

  await student.save();

  return sendSuccess(res, 200, "Student organization updated successfully", {
    data: {
      _id: student._id,
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      organizationId: student.organizationId,
    },
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

const getStudentsByAdmin = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user.id)
    .select("organization")
    .lean();

  if (!admin?.organization) {
    return sendError(
      res,
      400,
      "Admin is not assigned to any organization"
    );
  }

  const result = await getStudentsService({
    organizationId: admin.organization,
    query: req.query,
  });

  return sendSuccess(
    res,
    200,
    "Students fetched successfully",
    result
  );
});

const getStudentsBySuperAdmin = asyncHandler(
  async (req, res) => {
    const { organizationId } = req.query;

    const result = await getStudentsService({
      organizationId,
      query: req.query,
    });

    return sendSuccess(
      res,
      200,
      "Students fetched successfully",
      result
    );
  }
);



export {
  createStudent,
  updateStudent,
  toggleStudentStatus,
  updateStudentHostelStatus,
  updateStudentHostel,
  updateStudentOrganization,
  getAdminOrganizationData,
  getAdminStats,
  getStudentsByAdmin,
  getStudentsBySuperAdmin,
};
