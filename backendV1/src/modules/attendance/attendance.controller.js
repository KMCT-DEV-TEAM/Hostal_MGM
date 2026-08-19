import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { prisma } from "../../config/prisma.js";
import jwt from "jsonwebtoken";
import { createAttendanceWindowDb, getAttendanceWindowsDb, getAttendanceWindowDetailsDb, getDashboardStatsDb, getAttendanceRecordsDb, scanStudentDb, closeAttendanceWindow, correctAttendanceDb, getStudentDashboardStatsDb, getStudentAttendanceHistoryDb } from "./attendance.service.js";
import { createLogDb } from "../logs/log.service.js";
import { ROLES } from "../../constants/roles.js";

const getScope = async (req) => {
  const scope = {
    role: req.user.role,
    userId: req.user.id, // Ensure Prisma user ID matches this format
  };

  if (req.user.role === ROLES.WARDEN || req.user.role === ROLES.ASSISTANT_WARDEN) {
    // Check if hostel exists where this warden is assigned
    const hostel = await prisma.hostel.findFirst({
      where: {
        wardens: {
          some: { id: req.user.id }
        },
        isActive: true
      },
      select: { id: true }
    });

    if (hostel) {
      scope.hostelId = hostel.id;
    }
  } else if (req.user.role === ROLES.MENTOR) {
    const activeAssignments = await prisma.mentorAssignment.findMany({
      where: {
        mentorId: req.user.id,
        status: "ACTIVE",
      },
      select: { batchId: true }
    });

    if (activeAssignments.length > 0) {
      const batchIds = activeAssignments.map(({ batchId }) => batchId);

      const students = await prisma.studentHostel.findMany({
        where: {
          student: { batchId: { in: batchIds } },
          status: "ALLOCATED"
        },
        select: { hostelId: true }
      });

      const hostelIds = [...new Set(students.map(s => s.hostelId).filter(Boolean))];
      scope.hostelIds = hostelIds;
    } else {
      scope.hostelIds = [];
    }
  }

  return scope;
};

export const createAttendanceWindow = asyncHandler(async (req, res) => {
  const scope = await getScope(req);

  if (scope.role !== ROLES.WARDEN && scope.role !== ROLES.ASSISTANT_WARDEN) {
    return sendError(res, 403, "Only wardens can create an attendance window.");
  }

  if (!scope.hostelId) {
    return sendError(res, 403, "No active hostel assignment found for this warden.");
  }

  const attendanceWindow = await createAttendanceWindowDb(
    scope.hostelId,
    scope.userId
  );

  await createLogDb({
    action: "Created Attendance Window",
    entityType: "Attendance",
    entityId: attendanceWindow._id,
    user: req.user.id,
    userRole: req.user.role,
    details: `Warden opened a new attendance window for hostel`,
    status: "success"
  });

  return sendSuccess(
    res,
    201,
    "Attendance window created successfully",
    attendanceWindow
  );
});

export const getAttendanceWindows = asyncHandler(async (req, res) => {
  const scope = await getScope(req);
  const result = await getAttendanceWindowsDb(req.query, scope);
  return sendSuccess(res, 200, "Attendance windows fetched successfully", result);
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const scope = await getScope(req);
  const { date } = req.query;
  const result = await getDashboardStatsDb(date, scope);
  return sendSuccess(res, 200, "Dashboard stats fetched successfully", result);
});

export const getAttendanceWindowDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const scope = await getScope(req);

  const window = await getAttendanceWindowDetailsDb(id, scope);
  if (!window) {
    return sendError(res, 404, "Attendance window not found or you don't have access.");
  }

  return sendSuccess(res, 200, "Attendance window details fetched successfully", window);
});

export const getAttendanceRecords = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const scope = await getScope(req);

  const window = await getAttendanceWindowDetailsDb(id, scope);
  if (!window) {
    return sendError(res, 404, "Attendance window not found or you don't have access.");
  }

  const result = await getAttendanceRecordsDb(id, req.query, scope);
  return sendSuccess(res, 200, "Attendance records fetched successfully", result);
});

export const scanStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { qrToken } = req.body;
  const scope = await getScope(req);

  if (![ROLES.WARDEN, ROLES.ASSISTANT_WARDEN].includes(scope.role)) {
    return sendError(res, 403, "Only wardens can scan students.");
  }

  let studentId;
  try {
    try {
      const parsedToken = JSON.parse(qrToken);
      if (parsedToken._id || parsedToken.studentId) {
        studentId = parsedToken._id || parsedToken.studentId;
      }
    } catch (e) {
      // Ignore JSON parse error, fall back to JWT
    }

    if (!studentId) {
      const decoded = jwt.verify(qrToken, process.env.JWT_ACCESS_TOKEN);
      if (decoded.type !== "attendance_qr") {
        return sendError(res, 400, "Invalid QR code.");
      }
      studentId = decoded.studentId || decoded.id;
    }
  } catch (err) {
    return sendError(res, 400, "Invalid or expired QR code.");
  }

  if (!studentId) {
    return sendError(res, 400, "Invalid QR code payload.");
  }

  try {
    const result = await scanStudentDb(id, studentId, scope.userId);
    return sendSuccess(res, 201, "Attendance marked successfully", result);
  } catch (error) {
    return sendError(res, 400, error.message);
  }
});

export const completeAttendanceWindow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const scope = await getScope(req);

  if (![ROLES.WARDEN, ROLES.ASSISTANT_WARDEN].includes(scope.role)) {
    return sendError(res, 403, "Only wardens can complete an attendance window.");
  }

  const window = await closeAttendanceWindow(id, scope.userId);

  await createLogDb({
    action: "Completed Attendance Window",
    entityType: "Attendance",
    entityId: id,
    user: req.user.id,
    userRole: req.user.role,
    details: `Warden closed/completed attendance window`,
    status: "success"
  });

  return sendSuccess(res, 200, "Attendance window completed successfully", window);
});

export const correctAttendance = asyncHandler(async (req, res) => {
  const { id: windowId, studentId } = req.params;
  const { status, remarks } = req.body;
  const scope = await getScope(req);

  if (!scope.hostelId) {
    return sendError(res, 403, "No active hostel assignment found for this warden.");
  }

  try {
    const result = await correctAttendanceDb(
      windowId,
      studentId,
      scope.userId,
      scope.hostelId,
      { status, remarks }
    );

    await createLogDb({
      action: "Manual Attendance Correction",
      entityType: "Attendance",
      entityId: windowId,
      user: req.user.id,
      userRole: req.user.role,
      details: `Warden manually corrected attendance for student ${studentId} to status: ${status}. Remarks: ${remarks || 'N/A'}`,
      status: "success"
    });

    return sendSuccess(res, 200, "Attendance corrected successfully.", result);
  } catch (error) {
    const code = error.statusCode || 500;
    return sendError(res, code, error.message);
  }
});

const resolveStudentId = async (req) => {
  if ([ROLES.WARDEN, ROLES.ASSISTANT_WARDEN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MENTOR].includes(req.user.role)) {
    if (!req.query.studentId && !req.params.studentId) {
      throw new Error("studentId is required for staff roles to view student details.");
    }
    return req.query.studentId || req.params.studentId;
  }

  if (req.user.role === ROLES.PARENT) {
    const parent = await prisma.parent.findUnique({
      where: { id: req.user.id },
      select: { isActive: true }
    });
    
    if (!parent || !parent.isActive) {
      throw new Error("Parent account is inactive or not found");
    }

    const requestedStudentId = req.student?.id || req.query.studentId || req.params.studentId;

    if (requestedStudentId) {
      const isLinked = await prisma.studentParent.findFirst({
        where: {
          parentId: req.user.id,
          studentId: requestedStudentId,
          status: "ACTIVE"
        }
      });
      if (!isLinked) {
        throw new Error("You are not authorized to view this student's records.");
      }
      return requestedStudentId;
    }
  }
  return req.user.id;
};

export const getAttendanceDashboard = asyncHandler(async (req, res) => {
  try {
    const studentId = await resolveStudentId(req);
    const result = await getStudentDashboardStatsDb(studentId);
    return sendSuccess(res, 200, "Dashboard stats fetched successfully", result);
  } catch (error) {
    return sendError(res, 403, error.message);
  }
});

export const getAttendanceHistory = asyncHandler(async (req, res) => {
  try {
    const studentId = await resolveStudentId(req);
    const result = await getStudentAttendanceHistoryDb(studentId, req.query);
    return sendSuccess(res, 200, "Attendance history fetched successfully", result);
  } catch (error) {
    return sendError(res, 403, error.message);
  }
});
