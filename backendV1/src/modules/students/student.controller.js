import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { createStudentWithParentDb, updateStudentDb, getStudentsService } from "./student.service.js";
import { verifyOtpDb, deleteOtpDb } from "../otp/otp.service.js";
import { createLogDb } from "../logs/log.service.js";
import { orchestratorService } from "../notifications/services/orchestrator.service.js";
import { getAggregateOrganizationDataDb } from "../organizations/organization.service.js";
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

export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const oldStudent = await prisma.student.findUnique({
    where: { id }
  });

  if (!oldStudent) {
    return sendError(res, 404, "Student not found");
  }

  const result = await updateStudentDb(id, req.body);

  if (!result) {
    return sendError(res, 404, "Failed to update student");
  }

  await createLogDb({
    action: "Updated Student",
    entityType: "Student",
    entityId: id,
    user: req.user?.id,
    userRole: req.user?.role,
    details: `Updated student profile information`,
    status: "success"
  });

  const newStudent = result;

  if (oldStudent.batchId !== newStudent.batchId) {
    orchestratorService.triggerNotification({
      sender: buildSender(req.user),
      eventName: 'STUDENT_BATCH_CHANGED',
      target: [
        { type: 'STUDENT', filter: { studentId: id } },
        { type: 'MENTOR', filter: { studentId: id } }
      ],
      data: { studentName: newStudent.name, studentId: id }
    }).catch(err => console.error("[Notification Error] STUDENT_BATCH_CHANGED:", err));
  }

  return sendSuccess(res, 200, "Student updated successfully", {
    data: newStudent,
  });
});

export const changeStudentEmail = asyncHandler(async (req, res) => {
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

  const student = await prisma.student.findUnique({
    where: { id }
  });

  if (!student) {
    return sendError(res, 404, "Student not found");
  }

  if (req.user?.role === "admin" || req.user?.role === "ADMIN") {
    const admin = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { organizationId: true }
    });

    if (!admin?.organizationId) {
      return sendError(res, 400, "Admin is not assigned to any organization");
    }

    if (String(student.organizationId) !== String(admin.organizationId)) {
      return sendError(res, 403, "You can update only students in your organization");
    }
  }

  if (student.email !== normalizedOldEmail) {
    return sendError(res, 400, "Current email does not match");
  }

  const existingStudent = await prisma.student.findFirst({
    where: {
      email: normalizedNewEmail,
      id: { not: id }
    }
  });

  if (existingStudent) {
    return sendError(res, 400, "Student email already exists");
  }

  const isOtpValid = await verifyOtpDb(normalizedNewEmail, otp);

  if (!isOtpValid) {
    return sendError(res, 400, "Invalid or expired OTP");
  }

  const updatedStudent = await prisma.student.update({
    where: { id },
    data: {
      email: normalizedNewEmail,
      isVerified: true
    }
  });

  await deleteOtpDb(normalizedNewEmail);

  await createLogDb({
    action: "Changed Student Email",
    entityType: "Student",
    entityId: updatedStudent.id,
    user: req.user?.id,
    userRole: req.user?.role,
    details: `Student email changed from ${normalizedOldEmail} to ${normalizedNewEmail}`,
    status: "success"
  });

  orchestratorService.triggerNotification({
    sender: buildSender(req.user),
    eventName: 'EMAIL_CHANGED_CONFIRMATION',
    target: { type: 'STUDENT', filter: { studentId: updatedStudent.id } },
    data: { studentName: updatedStudent.fullName, studentId: updatedStudent.id }
  }).catch(err => console.error("[Notification Error] EMAIL_CHANGED_CONFIRMATION:", err));

  return sendSuccess(res, 200, "Email updated successfully");
});

export const getAdminOrganizationData = asyncHandler(async (req, res) => {
  const organizationId = req.user?.organizationId || req.user?.organization;

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

export const getAdminStats = asyncHandler(async (req, res) => {
  const organizationId = req.user?.organizationId || req.user?.organization;

  if (!organizationId) {
    return sendError(res, 400, "Admin is not assigned to any organization");
  }

  const studentCount = await prisma.student.count({
    where: {
      organizationId: organizationId
    }
  });

  return sendSuccess(res, 200, "Admin stats fetched successfully", {
    data: {
      students: studentCount,
    },
  });
});

export const getStudentsByAdmin = asyncHandler(async (req, res) => {
  const organizationId = req.user?.organizationId || req.user?.organization;

  if (!organizationId) {
    return sendError(res, 400, "Admin is not assigned to any organization");
  }

  const result = await getStudentsService({
    organizationId,
    query: req.query,
  });

  return sendSuccess(res, 200, "Students fetched successfully", result);
});

export const getStudentsByWarden = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;
  const wardenHostels = await prisma.hostelWarden.findMany({
    where: { userId: wardenId },
    select: { hostelId: true }
  });

  if (!wardenHostels.length) {
    return sendSuccess(res, 200, "Students fetched successfully", {
      students: [],
      pagination: { totalRecords: 0, page: 1, totalPages: 0, limit: req.query.limit || 10, hasNextPage: false, hasPreviousPage: false }
    });
  }

  const hostelIds = wardenHostels.map(h => h.hostelId);

  const result = await getStudentsService({
    hostelIds,
    query: req.query,
  });

  return sendSuccess(res, 200, "Students fetched successfully", result);
});

export const getStudentsBySuperAdmin = asyncHandler(async (req, res) => {
  const { organizationId } = req.query;

  const result = await getStudentsService({
    organizationId,
    query: req.query,
  });

  return sendSuccess(res, 200, "Students fetched successfully", result);
});

export const getStudentsByMentor = asyncHandler(async (req, res) => {
  const mentorId = req.user.id;

  const activeAssignments = await prisma.mentorAssignment.findMany({
    where: {
      mentorId,
      status: "ACTIVE",
    },
    select: { batchId: true }
  });

  if (!activeAssignments.length) {
    return sendSuccess(res, 200, "Students fetched successfully", {
      students: [],
      pagination: {
        page: 1,
        limit: Number(req.query.limit) || 10,
        totalRecords: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  }

  const batchIds = activeAssignments.map(a => a.batchId);
  const organizationId = req.user?.organizationId || req.user?.organization;

  const result = await getStudentsService({
    organizationId,
    batchIds,
    query: req.query,
  });

  return sendSuccess(res, 200, "Students fetched successfully", result);
});
