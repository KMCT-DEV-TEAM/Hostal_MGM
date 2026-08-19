import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { deleteOtpDb, verifyOtpDb } from "../otps/otp.service.js";
import { 
  createParentDb,
  updateParentDb,
  changeParentEmailDb
} from "./parent.service.js";
import { createLogDb } from "../logs/log.service.js";
import { checkStudentAccess, checkParentAccess } from "./parent.scope.js";
import { prisma } from "../../config/prisma.js"; // Import prisma for user/hostel queries

export const createParent = asyncHandler(async (req, res) => {
  const { email, parentOtp, studentId } = req.body;

  if (studentId) {
    try {
      await checkStudentAccess(req.user, studentId);
    } catch (error) {
      return sendError(res, error.statusCode || 403, error.message);
    }
  }

  const isOtpValid = await verifyOtpDb(email, parentOtp);

  if (!isOtpValid) {
    return sendError(res, 400, "Invalid or expired OTP");
  }

  await deleteOtpDb(email);

  let result;
  try {
    result = await createParentDb({
      ...req.body,
      isVerified: true,
    });
  } catch (error) {
    if (error.code === "PARENT_EXISTS_WITH_DIFFERENT_DATA") {
      return res.status(409).json({
        success: false,
        code: error.code,
        message: error.message,
        data: error.conflictData,
      });
    }

    if (error.code === "PARENT_ALREADY_LINKED") {
      return res.status(409).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (error.message === "Invalid studentId") {
      return sendError(res, 400, "Invalid studentId");
    }

    throw error;
  }

  if (!result) {
    return sendError(res, 404, "Student not found");
  }

  await createLogDb({
    action: "Created Parent",
    entityType: "Parent",
    entityId: result.parent._id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Created parent account for ${result.parent.parentName} (${result.parent.email})`,
    status: "success"
  });

  return sendSuccess(res, 201, "Parent created successfully", {
    data: {
      parentId: result.parent._id,
      studentId: result.parent.studentId,
      parentName: result.parent.parentName,
      email: result.parent.email,
      defaultGuardian: result.parent.defaultGuardian,
    }
  });
});

export const resolveParentConflict = asyncHandler(async (req, res) => {
  const { resolutionAction, studentId, ...parentData } = req.body;

  if (studentId) {
    try {
      await checkStudentAccess(req.user, studentId);
    } catch (error) {
      return sendError(res, error.statusCode || 403, error.message);
    }
  }

  if (!resolutionAction) {
    return sendError(res, 400, "Resolution action is required");
  }

  if (resolutionAction !== 'use_existing' && resolutionAction !== 'update_existing') {
    return sendError(res, 400, "Invalid resolution action");
  }

  let result;
  try {
    result = await createParentDb({
      ...parentData,
      studentId,
      resolutionAction,
      isVerified: true,
    });
  } catch (error) {
    if (error.code === "PARENT_ALREADY_LINKED") {
      return res.status(409).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (error.message === "Invalid studentId") {
      return sendError(res, 400, "Invalid studentId");
    }
    throw error;
  }

  if (!result) {
    return sendError(res, 404, "Student not found");
  }

  await createLogDb({
    action: "Resolved Parent Conflict",
    entityType: "Parent",
    entityId: result.parent?._id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Parent conflict resolved via action: ${resolutionAction}`,
    status: "success"
  });

  return sendSuccess(
    res,
    201,
    "Parent added successfully after conflict resolution",
    result
  );
});

export const updateParent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await checkParentAccess(req.user, id);
  } catch (error) {
    return sendError(res, error.statusCode || 403, error.message);
  }

  let result;
  try {
    result = await updateParentDb(id, req.body);
  } catch (error) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return sendError(res, 400, `Parent ${field} already exists`);
    }
    if (error.message === "Parent email already exists" || error.message === "Parent phone already exists") {
      return sendError(res, 400, error.message);
    }
    throw error;
  }

  if (!result) {
    return sendError(res, 404, "Parent not found");
  }

  await createLogDb({
    action: "Updated Parent",
    entityType: "Parent",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Updated parent profile details`,
    status: "success"
  });

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

export const changeParentEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { oldEmail, newEmail, otp } = req.body;

  if (!oldEmail || !newEmail || !otp) {
    return sendError(res, 400, "oldEmail, newEmail, and otp are required");
  }

  let parentContext;
  try {
    parentContext = await checkParentAccess(req.user, id);
  } catch (error) {
    return sendError(res, error.statusCode || 403, error.message);
  }

  const normalizedOldEmail = String(oldEmail).trim().toLowerCase();
  const normalizedNewEmail = String(newEmail).trim().toLowerCase();

  if (normalizedOldEmail === normalizedNewEmail) {
    return sendError(res, 400, "New email must be different from current email");
  }

  if (parentContext.email !== normalizedOldEmail) {
    return sendError(res, 400, "Current email does not match");
  }

  const isOtpValid = await verifyOtpDb(normalizedNewEmail, otp);

  if (!isOtpValid) {
    return sendError(res, 400, "Invalid or expired OTP");
  }

  let parent;
  try {
    parent = await changeParentEmailDb(id, normalizedNewEmail);
  } catch (error) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return sendError(res, 400, `Parent ${field} already exists`);
    }
    if (error.message === "Parent email already exists") {
      return sendError(res, 400, error.message);
    }
    throw error;
  }

  await deleteOtpDb(normalizedNewEmail);

  await createLogDb({
    action: "Changed Parent Email",
    entityType: "Parent",
    entityId: parent.id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Parent email changed from ${normalizedOldEmail} to ${normalizedNewEmail}`,
    status: "success"
  });

  // To perfectly match Mongoose behavior, we emulate the undefined values for missing properties
  return sendSuccess(res, 200, "Parent email updated successfully", {
    data: {
      parentId: parent.id,
      studentId: undefined,
      parentName: parent.parentName,
      email: parent.email,
      phone: parent.phone,
      relationship: undefined,
      defaultGuardian: undefined,
    },
  });
});
