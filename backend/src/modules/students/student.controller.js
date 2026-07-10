import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { checkExistingUser, createStudentWithParentDb, updateStudentDb, bulkUpdateStudentStatusDb, getStudentsService, getStudentFilterOptionsService } from "./student.service.js";
import { verifyOtpDb, deleteOtpDb } from "../otp/otp.service.js";
import { getAggregateOrganizationDataDb } from "../organizations/organization.service.js";
import { syncHostelOrganizations } from "../hostels/hostel.service.js";
import User from "../users/user.model.js";
import FurnitureAsset from "../furnitures/furnitureAsset.model.js";
import Student from "./student.model.js";
import Organization from "../organizations/organization.model.js";

import mongoose from "mongoose";
import Parent from "../parents/parent.model.js";
import hostelModel from "../hostels/hostel.model.js";
import studentHostelModel from "../student-hostels/studentHostel.model.js";

const createStudent = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { email, parentEmail } = req.body;
    let { organizationId } = req.body;

    if (email === parentEmail) {
      await session.abortTransaction();
      return sendError(
        res,
        400,
        "Student and parent email must be different"
      );
    }
    if (req.user.role === "admin") {
      const admin = await User.findById(req.user.id)
        .select("organization")
        .session(session);

      if (!admin?.organization) {
        await session.abortTransaction();
        return sendError(res, 400, "Admin is not assigned to any organization");
      }

      const adminOrganizationId = admin.organization.toString();

      if (organizationId && organizationId !== adminOrganizationId) {
        await session.abortTransaction();
        return sendError(
          res,
          403,
          "Admin can create students only for their own organization"
        );
      }

      organizationId = adminOrganizationId;
      req.body.organizationId = adminOrganizationId;
    }

    const organization = await Organization.findById(organizationId).session(session);
    if (!organization) {
      await session.abortTransaction();
      return sendError(res, 404, "Organization not found");
    }

    if (!organization.isActive) {
      await session.abortTransaction();
      return sendError(res, 400, "Cannot create student in inactive organization");
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

    const { studentOtp, parentOtp } = req.body;

    const isStudentOtpValid = await verifyOtpDb(email, studentOtp);
    const isParentOtpValid = await verifyOtpDb(parentEmail, parentOtp);

    if (!isStudentOtpValid) {
      await session.abortTransaction();
      return sendError(
        res,
        400,
        "Invalid or expired OTP for student"
      );
    }
    if (!isParentOtpValid) {
      await session.abortTransaction();
      return sendError(
        res,
        400,
        "Invalid or expired OTP for  parent email"
      );
    }

    await deleteOtpDb(email);
    await deleteOtpDb(parentEmail);

    const result = await createStudentWithParentDb(
      { ...req.body, isVerified: true },
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

const changeStudentEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { oldEmail, newEmail, otp } = req.body;

  if (!oldEmail || !newEmail || !otp) {
    return sendError(res, 400, "oldEmail, newEmail, and otp are required");
  }

  const normalizedOldEmail = String(oldEmail).trim().toLowerCase();
  const normalizedNewEmail = String(newEmail).trim().toLowerCase();

  if (normalizedOldEmail === normalizedNewEmail) {
    return sendError(res, 400, "New email must be different from current email");
  }

  const student = await Student.findById(id);

  if (!student) {
    return sendError(res, 404, "Student not found");
  }

  if (req.user.role === "admin") {
    const admin = await User.findById(req.user.id).select("organization").lean();

    if (!admin?.organization) {
      return sendError(res, 400, "Admin is not assigned to any organization");
    }

    if (String(student.organizationId) !== String(admin.organization)) {
      return sendError(res, 403, "You can update only students in your organization");
    }
  }

  if (student.email !== normalizedOldEmail) {
    return sendError(res, 400, "Current email does not match");
  }

  const existingStudent = await Student.findOne({
    email: normalizedNewEmail,
    _id: { $ne: id },
  });

  if (existingStudent) {
    return sendError(res, 400, "Student email already exists");
  }

  const isOtpValid = await verifyOtpDb(normalizedNewEmail, otp);

  if (!isOtpValid) {
    return sendError(res, 400, "Invalid or expired OTP");
  }

  student.email = normalizedNewEmail;
  student.isVerified = true;
  await student.save();
  await deleteOtpDb(normalizedNewEmail);

  return sendSuccess(res, 200, "Student email updated successfully", {
    data: {
      _id: student._id,
      studentId: student.studentId,
      name: student.name,
      email: student.email,
    },
  });
});

const toggleStudentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await Student.findById(id);

  if (!student) {
    return sendError(res, 404, "Student not found");
  }

  student.isActive = !student.isActive;
  await student.save();

  await Parent.updateMany(
    { studentId: student._id },
    { isActive: student.isActive }
  );

  if (student.hostelId) {
    await syncHostelOrganizations(student.hostelId);
  }

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

const bulkUpdateStudentStatus = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return sendError(res, 400, "Please provide an array of student IDs");
  }

  if (typeof isActive !== "boolean") {
    return sendError(res, 400, "Please provide a boolean value for isActive");
  }

  let organizationId = null;

  if (req.user.role === "admin") {
    const admin = await User.findById(req.user.id)
      .select("organization")
      .lean();

    if (!admin?.organization) {
      return sendError(res, 400, "Admin is not assigned to any organization");
    }

    organizationId = admin.organization.toString();
  }

  if (organizationId) {
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    const validCount = await Student.countDocuments({
      _id: { $in: objectIds },
      organizationId,
    });

    if (validCount !== ids.length) {
      return sendError(res, 403, "One or more students are not under your organization");
    }
  }

  const result = await bulkUpdateStudentStatusDb(ids, isActive, organizationId);

  return sendSuccess(
    res,
    200,
    `Successfully updated ${result.modifiedCount} student(s) to ${isActive ? "Active" : "Inactive"} status`,
    {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    }
  );
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

  const oldOrganizationId = student.organizationId;

  student.organizationId = organizationId;

  await student.save();

  if (student.hostelId && oldOrganizationId?.toString() !== organizationId.toString()) {
    await syncHostelOrganizations(student.hostelId);
  }

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

const getStudentsByWarden = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const wardenHostels = await hostelModel.find({ wardens: wardenId }).select('_id').lean();

  if (!wardenHostels.length) {
    return sendSuccess(res, 200, "Students fetched successfully", {
      students: [],
      pagination: { totalRecords: 0, page: 1, totalPages: 0, limit: req.query.limit || 10 }
    });
  }

  const hostelIds = wardenHostels.map(h => h._id);

  const result = await getStudentsService({
    hostelIds,
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

const getStudentFilterOptions = asyncHandler(async (req, res) => {
  const filters = await getStudentFilterOptionsService({
    role: req.user.role,
    userId: req.user.id,
    organizationId: req.query.organizationId,
  });

  return sendSuccess(
    res,
    200,
    "Student filter options fetched successfully",
    { filters }
  );
});



const getStudentFurnitures = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student = await Student.findById(id).lean();
  if (!student) {
    return sendError(res, 404, "Student not found");
  }
  const assets = await FurnitureAsset.find({
    studentId: id,
    status: "allocated",
  })
    .populate("furnitureTypeId", "name prefix")
    .lean();

  return sendSuccess(res, 200, "Furniture assets fetched successfully", {
    studentId: id,
    assets,
  });
});




const getStudentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 400, "Invalid student ID");
  }

  const student = await Student.findById(id)
    .populate("organizationId", "name code")
    .populate("hostelId", "name code hosteltype")
    .populate("courseId", "name code")
    .populate("departmentId", "name code")
    .populate("batchId", "name code")
    .lean();

  if (!student) {
    return sendError(res, 404, "Student not found");
  }

  if (user.role === "admin") {
    const admin = await User.findById(user.id || user._id).select("organization").lean();
    if (!admin?.organization || student.organizationId?._id?.toString() !== admin.organization.toString()) {
      return sendError(res, 403, "Access denied: Student belongs to another organization");
    }
  }
  if (user.role === "warden") {
    const hostel = await hostelModel.findOne({ wardens: user.id || user._id }).lean();
    const studentHostelId = student.hostelId?._id?.toString() || student.hostelId?.toString();

    if (!hostel || studentHostelId !== hostel._id.toString()) {
      return sendError(res, 403, "Access denied: Student belongs to another hostel");
    }
  }

  const parents = await Parent.find({ studentId: id }).lean();
  if (parents && parents.length > 0) {
    student.parents = parents.map(p => {
      const { password, ...parentData } = p;
      return parentData;
    });
  }

  // Fetch active hostel allocation
  const activeAllocation = await studentHostelModel.findOne({ studentId: id, status: "active" })
    .populate("allocatedBy", "name")
    .lean();

  if (activeAllocation) {
    student.activeAllocation = activeAllocation;
  }

  student.organization = student.organizationId;
  student.hostel = student.hostelId;
  student.course = student.courseId;
  student.department = student.departmentId;
  student.batch = student.batchId;

  student.organizationId = student.organization?._id;
  student.hostelId = student.hostel?._id;
  student.courseId = student.course?._id;
  student.departmentId = student.department?._id;
  student.batchId = student.batch?._id;

  return sendSuccess(res, 200, "Student details fetched successfully", student);
});


export {
  createStudent,
  updateStudent,
  changeStudentEmail,
  toggleStudentStatus,
  updateStudentOrganization,
  getAdminOrganizationData,
  getAdminStats,
  getStudentsByAdmin,
  getStudentsBySuperAdmin,
  getStudentsByWarden,
  getStudentFilterOptions,
  getStudentFurnitures,
  getStudentById,
  bulkUpdateStudentStatus,
};
