import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { createStudentWithParentDb } from "./student.service.js";
import { verifyOtpDb, deleteOtpDb } from "../otp/otp.service.js";
import { createLogDb } from "../logs/log.service.js";
import { orchestratorService } from "../notifications/services/orchestrator.service.js";
import { buildSender } from "../notifications/utils/sender.util.js";
import { prisma } from "../../config/prisma.js";

export const createStudent = asyncHandler(async (req, res) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const { email, parentEmail } = req.body;
      let { organizationId } = req.body;

      console.log('Role:', req.user.role)
      if (email === parentEmail) {
        throw { statusCode: 400, message: "Student and parent email must be different" };
      }

      if (req.user?.role === "ADMIN" || req.user?.role === "admin") {
        const admin = await tx.user.findUnique({
          where: { id: req.user.id },
          select: { organizationId: true }
        });

        if (!admin?.organizationId) {
          throw { statusCode: 400, message: "Admin is not assigned to any organization" };
        }

        const adminOrganizationId = admin.organizationId;

        if (organizationId && organizationId !== adminOrganizationId) {
          throw { statusCode: 403, message: "Admin can create students only for their own organization" };
        }

        organizationId = adminOrganizationId;
        req.body.organizationId = adminOrganizationId;
      }

      const organization = await tx.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization) {
        throw { statusCode: 404, message: "Organization not found" };
      }

      if (!organization.isActive) {
        throw { statusCode: 400, message: "Cannot create student in inactive organization" };
      }

      const existingStudent = await tx.student.findUnique({
        where: { email }
      });

      if (existingStudent) {
        throw { statusCode: 400, message: "Student email already exists" };
      }

      const { studentOtp, parentOtp } = req.body;

      const isStudentOtpValid = await verifyOtpDb(email, studentOtp);
      const isParentOtpValid = await verifyOtpDb(parentEmail, parentOtp);

      if (!isStudentOtpValid) {
        throw { statusCode: 400, message: "Invalid or expired OTP for student" };
      }
      if (!isParentOtpValid) {
        throw { statusCode: 400, message: "Invalid or expired OTP for  parent email" };
      }

      const creationResult = await createStudentWithParentDb(
        { ...req.body, isVerified: true },
        tx
      );

      await deleteOtpDb(email);
      await deleteOtpDb(parentEmail);

      return creationResult;
    });

    await createLogDb({
      action: "Created Student",
      entityType: "Student",
      entityId: result.student?.id || result.id || undefined,
      user: req.user?.id,
      userRole: req.user?.role,
      details: `Created new student`,
      status: "success"
    });

    const studentId = result.student?.id || result.id;
    const studentName = result.student?.fullName || req.body.name || '';

    orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'STUDENT_CREATED',
      target: [
        { type: 'STUDENT', filter: { studentId } },
        { type: 'PARENT', filter: { studentId } }
      ],
      data: {
        studentName,
        studentId
      }
    }).catch(err => console.error("[Notification Error] STUDENT_CREATED:", err));

    return sendSuccess(
      res,
      201,
      "Student and parent created successfully",
      result
    );
  } catch (error) {
    if (error.code === 'PARENT_EXISTS_WITH_DIFFERENT_DATA') {
      return res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message,
        data: error.conflictData
      });
    }
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    throw error;
  }
});
