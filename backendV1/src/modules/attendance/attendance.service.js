import prisma from "../../config/prisma.js";
import { orchestratorService } from "../notification/services/orchestrator.service.js";

const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const createAttendanceWindowDb = async (hostelId, wardenId) => {
  const today = getStartOfDay(new Date());

  const existingWindow = await prisma.attendanceWindow.findFirst({
    where: {
      hostelId,
      attendanceDate: today,
    },
  });

  if (existingWindow) {
    return {
      _id: existingWindow.id,
      hostelId: existingWindow.hostelId,
      attendanceDate: existingWindow.attendanceDate,
      totalStudents: existingWindow.totalStudents,
      status: existingWindow.status.toLowerCase(),
      startedAt: existingWindow.createdAt
    };
  }

  // Update existing open windows to completed.
  await prisma.attendanceWindow.updateMany({
    where: {
      hostelId,
      status: "OPEN",
      attendanceDate: { lt: today },
    },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      completedById: wardenId
    }
  });

  // Count active students in the hostel
  // MongoDB did: Student.countDocuments({ hostelId, isActive: true, hostelStatus: "active" })
  // In Prisma, we check StudentHostel with status ALLOCATED
  const totalStudents = await prisma.studentHostel.count({
    where: {
      hostelId,
      status: "ALLOCATED",
      student: { isActive: true }
    }
  });

  const newWindow = await prisma.attendanceWindow.create({
    data: {
      hostelId,
      attendanceDate: today,
      totalStudents,
      status: "OPEN",
      startedById: wardenId,
      startedAt: new Date() // Add startedAt since it's in the schema
    }
  });

  // Trigger Notification asynchronously
  orchestratorService.triggerNotification({
    eventName: 'ATTENDANCE_OPENED',
    target: { type: 'HOSTEL', filter: { hostelId: newWindow.hostelId } },
    data: {
      category: 'ATTENDANCE',
      priority: 'HIGH'
    },
    channels: ['in-app', 'push']
  }).catch(err => console.error("[Notification] Failed to trigger ATTENDANCE_OPENED:", err));

  return {
    _id: newWindow.id,
    hostelId: newWindow.hostelId,
    attendanceDate: newWindow.attendanceDate,
    totalStudents: newWindow.totalStudents,
    status: newWindow.status.toLowerCase(),
    startedAt: newWindow.createdAt
  };
};
