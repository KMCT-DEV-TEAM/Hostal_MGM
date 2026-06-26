import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import jwt from "jsonwebtoken";
import Hostel from "../hostels/hostel.model.js";
import {
  createAttendanceWindowDb,
  getAttendanceWindowsDb,
  getAttendanceWindowDetailsDb,
  getAttendanceRecordsDb,
  scanStudentDb,
  completeAttendanceWindowDb,
} from "./attendance.service.js";

const getScope = async (req) => {
  const scope = {
    role: req.user.role,
    userId: req.user.id,
  };

  if (req.user.role === "warden") {
    const hostel = await Hostel.findOne({ wardens: req.user.id, isActive: true }).lean();
    if (hostel) {
      scope.hostelId = hostel._id;
    }
  }

  return scope;
};

export const createAttendanceWindow = asyncHandler(async (req, res) => {
  const scope = await getScope(req);
  
  if (scope.role !== "warden") {
    return sendError(res, 403, "Only wardens can create an attendance window.");
  }
  
  if (!scope.hostelId) {
    return sendError(res, 403, "No active hostel assignment found for this warden.");
  }

  const window = await createAttendanceWindowDb(scope.hostelId, scope.userId);
  return sendSuccess(res, 201, "Attendance window created successfully", window);
});

export const getAttendanceWindows = asyncHandler(async (req, res) => {
  const scope = await getScope(req);
  const result = await getAttendanceWindowsDb(req.query, scope);
  return sendSuccess(res, 200, "Attendance windows fetched successfully", result);
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

  if (scope.role !== "warden") {
    return sendError(res, 403, "Only wardens can scan students.");
  }

  let studentId;
  try {
    const decoded = jwt.verify(qrToken, process.env.JWT_ACCESS_TOKEN || "fallback_secret");
    studentId = decoded.id || decoded.studentId;
  } catch (err) {
    return sendError(res, 400, "Invalid or expired QR code.");
  }

  if (!studentId) {
    return sendError(res, 400, "Invalid QR code payload.");
  }

  const record = await scanStudentDb(id, studentId, scope.userId);
  return sendSuccess(res, 201, "Student scanned successfully", record);
});

export const completeAttendanceWindow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const scope = await getScope(req);

  if (scope.role !== "warden") {
    return sendError(res, 403, "Only wardens can complete an attendance window.");
  }

  const window = await completeAttendanceWindowDb(id, scope.userId);
  return sendSuccess(res, 200, "Attendance window completed successfully", window);
});
