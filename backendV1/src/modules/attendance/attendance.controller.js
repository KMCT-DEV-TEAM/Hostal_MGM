import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { prisma } from "../../config/prisma.js";
import { createAttendanceWindowDb, getAttendanceWindowsDb, getAttendanceWindowDetailsDb, getDashboardStatsDb } from "./attendance.service.js";
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
