import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { deleteOtpDb, verifyOtpDb } from "../otps/otp.service.js"; // Note: Adapted to 'otps' module
import { createParentDb } from "./parent.service.js";
import { createLogDb } from "../logs/log.service.js";
import { checkStudentAccess } from "./parent.scope.js";

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
