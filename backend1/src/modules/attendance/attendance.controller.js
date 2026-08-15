import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import jwt from "jsonwebtoken";
import Hostel from "../hostels/hostel.model.js";
import Parent from "../parents/parent.model.js";
import MentorAssignment from "../mentors/mentorAssignment.model.js";
import Student from "../students/student.model.js";
import StudentParent from "../parents/studentParent.model.js";
import {
  createAttendanceWindowDb,
  getAttendanceWindowsDb,
  getDashboardStatsDb,
  getAttendanceWindowDetailsDb,
  getAttendanceRecordsDb,
  scanStudentDb,
  closeAttendanceWindow,
  getStudentDashboardStatsDb,
  getStudentAttendanceHistoryDb,
  getStudentAttendanceCalendarDb,
  getStudentAttendanceDetailsDb,
  correctAttendanceDb,
} from "./attendance.service.js";
import { createLogDb } from "../logs/log.service.js";

const getScope = async (req) => {
  const scope = {
    role: req.user.role,
    userId: req.user.id,
  };

  if (req.user.role === "warden" || req.user.role === "assistant_warden") {
    const hostel = await Hostel.findOne({ wardens: req.user.id, isActive: true }).lean();
    if (hostel) {
      scope.hostelId = hostel._id;
    }
  } else if (req.user.role === "mentor") {
    const activeAssignments = await MentorAssignment.find({
      mentorId: req.user.id,
      status: "active",
    }).select("batchId").lean();

    if (activeAssignments.length > 0) {
      const batchIds = activeAssignments.map(({ batchId }) => batchId);
      const students = await Student.find({ batchId: { $in: batchIds } }).select("hostelId").lean();
      const hostelIds = [...new Set(students.map(s => s.hostelId?.toString()).filter(Boolean))];
      scope.hostelIds = hostelIds;
    } else {
      scope.hostelIds = [];
    }
  }

  return scope;
};

export const createAttendanceWindow = asyncHandler(async (req, res) => {
  const scope = await getScope(req);

  if (scope.role !== "warden" && scope.role !== "assistant_warden") {
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
    user: req.user.id || req.user._id,
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

  if (!["warden", "assistant_warden"].includes(scope.role)) {
    return sendError(res, 403, "Only wardens can scan students.");
  }

  let studentId;
  try {
    // Check if qrToken is just a JSON string with _id (used for testing or simple QRs)
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

  if (!["warden", "assistant_warden"].includes(scope.role)) {
    return sendError(res, 403, "Only wardens can complete an attendance window.");
  }

  const window = await closeAttendanceWindow(id, scope.userId);

  await createLogDb({
    action: "Completed Attendance Window",
    entityType: "Attendance",
    entityId: id,
    user: req.user.id || req.user._id,
    userRole: req.user.role,
    details: `Warden closed/completed attendance window`,
    status: "success"
  });

  return sendSuccess(res, 200, "Attendance window completed successfully", window);
});

export const correctAttendance = asyncHandler(async (req, res) => {
  const { windowId, studentId } = req.params;
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
      user: req.user.id || req.user._id,
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

// --- Shared Student & Parent Controllers ---
const resolveStudentId = async (req) => {
  if (["warden", "assistant_warden", "admin", "super_admin", "mentor"].includes(req.user.role)) {
    if (!req.query.studentId && !req.params.studentId) {
      throw new Error("studentId is required for staff roles to view student details.");
    }
    return req.query.studentId || req.params.studentId;
  }

  if (req.user.role === 'parent') {
    const parent = await Parent.findById(req.user.id).select("isActive").lean();
    console.log(parent, "parent", req.params.studentId)
    if (!parent || !parent.isActive) {
      throw new Error("Parent account is inactive or not found");
    }
    console.log(req.params)

    // Use the injected req.student from verifyStudentAccess if available, otherwise fallback to params/query
    const requestedStudentId = req.student?.id

    if (requestedStudentId) {
      const isLinked = await StudentParent.exists({
        parentId: req.user.id,
        studentId: requestedStudentId,
        status: 'active'
      });
      if (!isLinked) {
        throw new Error("You are not authorized to view this student's records.");
      }
      return requestedStudentId;
    }

    // Fallback for strict V1 backward compatibility (if no studentId is passed anywhere)
    // const firstLink = await StudentParent.findOne({ parentId: req.user.id, status: 'active' }).select("studentId").lean();

    // if (!firstLink || !firstLink.studentId) {
    //   throw new Error("No student linked to this parent account");
    // }
    // return firstLink.studentId;
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

export const getAttendanceCalendar = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  try {
    const studentId = await resolveStudentId(req);
    const result = await getStudentAttendanceCalendarDb(studentId, month, year);
    return sendSuccess(res, 200, "Calendar events fetched successfully", result);
  } catch (error) {
    return sendError(res, 403, error.message);
  }
});

export const getAttendanceDetails = asyncHandler(async (req, res) => {
  const { date } = req.params;
  try {
    const studentId = await resolveStudentId(req);
    const result = await getStudentAttendanceDetailsDb(studentId, date);
    if (!result) return sendError(res, 404, "No attendance record found for this date.");
    return sendSuccess(res, 200, "Attendance details fetched successfully", result);
  } catch (error) {
    return sendError(res, 403, error.message);
  }
});

