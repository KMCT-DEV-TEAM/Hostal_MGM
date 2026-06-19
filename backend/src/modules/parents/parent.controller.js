import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { deleteOtpDb, verifyOtpDb } from "../otp/otp.service.js";
import User from "../users/user.model.js";
import Parent from "./parent.model.js";
import Student from "../students/student.model.js";
import { createParentDb, updateParentDb, toggleParentStatusDb, setDefaultGuardianDb, getParentsService } from "./parent.service.js";

const createParent = asyncHandler(async (req, res) => {
  const {
    email,
    parentOtp,
  } = req.body;

  const existingParent = await Parent.findOne({ email });

  if (existingParent) {
    return sendError(res, 400, "Parent email already exists");
  }

  const isOtpValid = await verifyOtpDb(email, parentOtp);

  if (!isOtpValid) {
    return sendError(
      res,
      400,
      "Invalid or expired OTP"
    );
  }

  await deleteOtpDb(email);

  let result;

  try {
    result = await createParentDb({
      ...req.body,
      isVerified: true,
    });
  } catch (error) {
    if (error.message === "Parent email already exists") {
      return sendError(res, 400, error.message);
    }

    if (error.message === "Invalid studentId") {
      return sendError(res, 400, "Invalid studentId");
    }

    throw error;
  }

  if (!result) {
    return sendError(res, 404, "Student not found");
  }

  return sendSuccess(
    res,
    201,
    "Parent created successfully",
    {
      data: {
        parentId: result.parent._id,
        studentId: result.parent.studentId,
        parentName: result.parent.parentName,
        email: result.parent.email,
        defaultGuardian: result.parent.defaultGuardian,
      },
    }
  );
});
const updateParent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let result;
  try {
    result = await updateParentDb(id, req.body);
  } catch (error) {
    if (error.message === "Parent email already exists") {
      return sendError(res, 400, error.message);
    }
    throw error;
  }

  if (!result) {
    return sendError(res, 404, "Parent not found");
  }

  return sendSuccess(res, 200, "Parent updated successfully", {
    data: {
      parentId: result.parentProfile._id,
      parentName: result.parentProfile.parentName,
      email: result.parentProfile.email,
      phone: result.parentProfile.phone,
      relationship: result.parentProfile.relationship,
      defaultGuardian: result.parentProfile.defaultGuardian,
    }
  });
});

const changeParentEmail = asyncHandler(async (req, res) => {
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

  const parent = await Parent.findById(id);

  if (!parent) {
    return sendError(res, 404, "Parent not found");
  }

  if (req.user.role === "admin") {
    const [admin, student] = await Promise.all([
      User.findById(req.user.id).select("organization").lean(),
      Student.findById(parent.studentId).select("organizationId").lean(),
    ]);

    if (!admin?.organization) {
      return sendError(res, 400, "Admin is not assigned to any organization");
    }

    if (!student || String(student.organizationId) !== String(admin.organization)) {
      return sendError(res, 403, "You can update only parents in your organization");
    }
  }

  if (parent.email !== normalizedOldEmail) {
    return sendError(res, 400, "Current email does not match");
  }

  const existingParent = await Parent.findOne({
    email: normalizedNewEmail,
    _id: { $ne: id },
  });

  if (existingParent) {
    return sendError(res, 400, "Parent email already exists");
  }

  const isOtpValid = await verifyOtpDb(normalizedNewEmail, otp);

  if (!isOtpValid) {
    return sendError(res, 400, "Invalid or expired OTP");
  }

  parent.email = normalizedNewEmail;
  parent.isVerified = true;
  await parent.save();
  await deleteOtpDb(normalizedNewEmail);

  return sendSuccess(res, 200, "Parent email updated successfully", {
    data: {
      parentId: parent._id,
      studentId: parent.studentId,
      parentName: parent.parentName,
      email: parent.email,
      phone: parent.phone,
      relationship: parent.relationship,
      defaultGuardian: parent.defaultGuardian,
    },
  });
});

const toggleParentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await toggleParentStatusDb(id);

  if (!result) {
    return sendError(res, 404, "Parent not found");
  }

  const message = result.parentProfile.isActive
    ? "Parent activated successfully"
    : "Parent deactivated successfully";

  return sendSuccess(res, 200, message, {
    data: {
      parentId: result.parentProfile._id,
      isActive: result.parentProfile.isActive,
    }
  });
});

const getParentsByAdmin = asyncHandler(async (req, res) => {
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
  const organizationId = admin.organization;

  if (!organizationId) {
    return sendError(res, 400, "Admin is not assigned to any organization");
  }

  const result = await getParentsService({
    organizationId,
    query: req.query,
  });

  return sendSuccess(res, 200, "Parents fetched successfully", result);
});

const getParentsBySuperAdmin = asyncHandler(async (req, res) => {
  const { organizationId } = req.query;

  const result = await getParentsService({
    organizationId,
    query: req.query,
  });

  return sendSuccess(res, 200, "Parents fetched successfully", result);
});

const setDefaultGuardian = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { defaultGuardian } = req.body;

  if (typeof defaultGuardian !== "boolean") {
    return sendError(res, 400, "defaultGuardian must be a boolean");
  }

  const result = await setDefaultGuardianDb(id, defaultGuardian);

  if (!result) {
    return sendError(res, 404, "Parent not found");
  }

  const message = defaultGuardian
    ? "Parent set as default guardian successfully"
    : "Parent removed as default guardian successfully";

  return sendSuccess(res, 200, message, {
    data: {
      parentId: result.parentProfile._id,
      defaultGuardian: result.parentProfile.defaultGuardian,
    }
  });
});

export {
  createParent,
  updateParent,
  changeParentEmail,
  toggleParentStatus,
  setDefaultGuardian,
  getParentsByAdmin,
  getParentsBySuperAdmin,
};
