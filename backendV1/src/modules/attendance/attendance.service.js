import { prisma } from "../../config/prisma.js";
import { orchestratorService } from "../notification/services/orchestrator.service.js";
import { ROLES } from "../../constants/roles.js";

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

export const getAttendanceWindowsDb = async (query, scope) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const where = {};

  if (scope.role === ROLES.WARDEN || scope.role === ROLES.ASSISTANT_WARDEN) {
    where.hostelId = scope.hostelId;
  } else if (scope.role === ROLES.MENTOR) {
    if (query.hostelId && (scope.hostelIds || []).includes(query.hostelId)) {
      where.hostelId = query.hostelId;
    } else if (query.hostelId) {
      // Unauthorized hostel filter, return empty
      return {
        windows: [],
        pagination: {
          page, limit, totalRecords: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false
        }
      };
    } else {
      where.hostelId = { in: scope.hostelIds || [] };
    }
  } else if (query.hostelId) {
    where.hostelId = query.hostelId;
  }

  if (query.status) {
    where.status = query.status.toUpperCase();
  }

  if (query.date) {
    where.attendanceDate = getStartOfDay(query.date);
  } else if (query.fromDate || query.toDate) {
    where.attendanceDate = {};
    if (query.fromDate) where.attendanceDate.gte = getStartOfDay(query.fromDate);
    if (query.toDate) where.attendanceDate.lte = new Date(new Date(query.toDate).setHours(23, 59, 59, 999));
  } else if (query.month && query.year) {
    const startOfMonth = new Date(Date.UTC(query.year, query.month - 1, 1));
    const endOfMonth = new Date(Date.UTC(query.year, query.month, 0, 23, 59, 59, 999));
    where.attendanceDate = { gte: startOfMonth, lte: endOfMonth };
  }

  const [records, totalRecords] = await Promise.all([
    prisma.attendanceWindow.findMany({
      where,
      orderBy: { attendanceDate: 'desc' },
      skip,
      take: limit,
      include: {
        hostel: { select: { id: true, name: true } },
        startedBy: { select: { id: true, fullName: true, email: true } },
        completedBy: { select: { id: true, fullName: true, email: true } }
      }
    }),
    prisma.attendanceWindow.count({ where })
  ]);

  const windows = records.map(w => ({
    _id: w.id,
    attendanceDate: w.attendanceDate,
    totalStudents: w.totalStudents,
    scannedCount: w.scannedCount,
    presentCount: w.presentCount,
    absentCount: w.absentCount,
    onLeaveCount: w.onLeaveCount,
    status: w.status.toLowerCase(),
    startedAt: w.startedAt,
    completedAt: w.completedAt,
    createdAt: w.createdAt,
    hostel: w.hostel ? { _id: w.hostel.id, name: w.hostel.name } : null,
    startedBy: w.startedBy ? { _id: w.startedBy.id, name: w.startedBy.fullName, email: w.startedBy.email } : null,
    completedBy: w.completedBy ? { _id: w.completedBy.id, name: w.completedBy.fullName, email: w.completedBy.email } : null
  }));

  return {
    windows,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1,
    },
  };
};

export const getAttendanceWindowDetailsDb = async (windowId, scope) => {
  const where = { id: windowId };
  
  if (scope.role === ROLES.WARDEN || scope.role === ROLES.ASSISTANT_WARDEN) {
    where.hostelId = scope.hostelId;
  }

  const window = await prisma.attendanceWindow.findFirst({
    where,
    include: {
      hostel: { select: { id: true, name: true } },
      startedBy: { select: { id: true, fullName: true, email: true } },
      completedBy: { select: { id: true, fullName: true, email: true } }
    }
  });

  if (!window) return null;

  return {
    totalStudents: window.totalStudents,
    presentToday: window.presentCount,
    absentToday: window.absentCount,
    windowId: window.id,
    windowStatus: window.status.toLowerCase(),
    windowStartedAt: window.startedAt,
    windowStartedByName: window.startedBy ? window.startedBy.fullName : null
  };
};

export const getDashboardStatsDb = async (dateStr, scope) => {
  const queryDate = getStartOfDay(dateStr || new Date());
  
  const where = {
    attendanceDate: queryDate
  };

  if (scope.role === ROLES.WARDEN || scope.role === ROLES.ASSISTANT_WARDEN) {
    where.hostelId = scope.hostelId;
  } else if (scope.role === ROLES.MENTOR) {
    where.hostelId = { in: scope.hostelIds || [] };
  }

  const windows = await prisma.attendanceWindow.findMany({
    where,
    include: {
      startedBy: { select: { fullName: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (windows.length === 0) {
    return {
      totalStudents: 0,
      presentToday: 0,
      absentToday: 0,
      windowStatus: null,
      windowStartedAt: null,
      windowStartedByName: null
    };
  }

  let totalStudents = 0;
  let presentToday = 0;
  let absentToday = 0;

  for (const w of windows) {
    totalStudents += w.totalStudents || 0;
    presentToday += w.presentCount || 0;
    absentToday += w.absentCount || 0;
  }

  const firstWindow = windows[0];

  return {
    totalStudents,
    presentToday,
    absentToday,
    windowId: firstWindow.id,
    windowStatus: firstWindow.status.toLowerCase(),
    windowStartedAt: firstWindow.createdAt,
    windowStartedByName: firstWindow.startedBy ? firstWindow.startedBy.fullName : null
  };
};

export const getAttendanceRecordsDb = async (windowId, query, scope) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const window = await prisma.attendanceWindow.findUnique({
    where: { id: windowId },
    select: { hostelId: true }
  });

  let totalStudentsCount = 0;
  if (window && window.hostelId) {
    totalStudentsCount = await prisma.studentHostel.count({
      where: {
        hostelId: window.hostelId,
        status: "active"
      }
    });
  }

  const where = { attendanceWindowId: windowId };

  if (query.status) {
    where.status = query.status.toUpperCase();
  }

  if (query.fromDate || query.toDate) {
    where.scannedAt = {};
    if (query.fromDate) where.scannedAt.gte = new Date(query.fromDate);
    if (query.toDate) where.scannedAt.lte = new Date(new Date(query.toDate).setHours(23, 59, 59, 999));
  }

  const studentMatch = {};
  if (query.search) {
    studentMatch.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { studentId: { contains: query.search, mode: 'insensitive' } }
    ];
  }
  if (query.room) {
    studentMatch.roomNumber = { contains: query.room, mode: 'insensitive' };
  }
  if (query.organizationId) {
    studentMatch.organizationId = query.organizationId;
  }
  if (query.courseId) {
    studentMatch.courseId = query.courseId;
  }
  if (query.departmentId) {
    studentMatch.departmentId = query.departmentId;
  }
  if (query.batchId) {
    studentMatch.batchId = query.batchId;
  }

  if (Object.keys(studentMatch).length > 0) {
    where.student = studentMatch;
  }

  const [records, totalRecords] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      orderBy: { scannedAt: 'desc' },
      skip,
      take: limit,
      include: {
        student: { select: { id: true, name: true, studentId: true, roomNumber: true } },
        scannedBy: { select: { id: true, fullName: true } }
      }
    }),
    prisma.attendanceRecord.count({ where })
  ]);

  const formattedRecords = records.map(r => ({
    _id: r.id,
    status: r.status.toLowerCase(),
    scannedAt: r.scannedAt,
    remarks: r.remarks,
    student: r.student ? {
      _id: r.student.id,
      name: r.student.name,
      studentId: r.student.studentId,
      room: r.student.roomNumber
    } : null,
    scannedBy: r.scannedBy ? {
      _id: r.scannedBy.id,
      name: r.scannedBy.fullName
    } : null
  }));

  return {
    records: formattedRecords,
    totalStudentsCount,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1,
    }
  };
};

export const scanStudentDb = async (windowId, studentId, wardenId) => {
  return await prisma.$transaction(async (tx) => {
    const window = await tx.attendanceWindow.findFirst({
      where: { id: windowId, status: "OPEN" },
      select: { id: true, hostelId: true }
    });

    if (!window) {
      throw new Error("Attendance window is closed or does not exist.");
    }

    const hostel = await tx.hostel.findFirst({
      where: { id: window.hostelId, isActive: true },
      select: { id: true }
    });

    if (!hostel) {
      throw new Error("Hostel is inactive or does not exist.");
    }

    const studentExists = await tx.student.findFirst({
      where: { id: studentId, isActive: true },
      select: { id: true, studentCode: true, fullName: true, studentHostels: { where: { status: "active" }, select: { hostelId: true } } }
    });

    if (!studentExists) {
      throw new Error("Student is inactive or does not exist.");
    }

    const activeHostel = studentExists.studentHostels[0];
    if (!activeHostel || activeHostel.hostelId !== window.hostelId) {
      throw new Error("Student does not belong to this hostel.");
    }

    let record;
    try {
      record = await tx.attendanceRecord.create({
        data: {
          attendanceWindowId: window.id,
          studentId: studentExists.id,
          hostelId: window.hostelId,
          scannedById: wardenId,
          status: "PRESENT",
          scannedAt: new Date()
        }
      });
    } catch (err) {
      if (err.code === "P2002") {
        throw new Error("Student has already been scanned in this window.");
      }
      throw err;
    }

    await tx.attendanceWindow.update({
      where: { id: window.id },
      data: {
        scannedCount: { increment: 1 },
        presentCount: { increment: 1 }
      }
    });

    return {
      attendance: {
        _id: record.id,
        status: record.status.toLowerCase(),
        scannedAt: record.scannedAt
      },
      student: {
        _id: studentExists.id,
        studentId: studentExists.studentCode,
        name: studentExists.fullName,
        profileImage: null
      }
    };
  });
};

export const closeAttendanceWindow = async (windowId, completedBy) => {
  const window = await prisma.attendanceWindow.findFirst({
    where: { id: windowId, status: "OPEN" }
  });

  if (!window) {
    throw new Error("Window is already completed or does not exist.");
  }

  const activeStudents = await prisma.student.findMany({
    where: {
      isActive: true,
      studentHostels: { some: { hostelId: window.hostelId, status: "active" } }
    },
    select: { id: true }
  });

  const activeStudentIds = activeStudents.map(s => s.id);

  const records = await prisma.attendanceRecord.findMany({
    where: { attendanceWindowId: windowId, studentId: { in: activeStudentIds } },
    select: { studentId: true }
  });

  const presentSet = new Set(records.map(r => r.studentId));
  const absentIds = activeStudentIds.filter(id => !presentSet.has(id));

  if (absentIds.length > 0) {
    const onLeavePasses = await prisma.pass.findMany({
      where: {
        studentId: { in: absentIds },
        status: "APPROVED"
      },
      include: {
        gateLogs: {
          orderBy: { eventTime: 'desc' },
          take: 1
        }
      }
    });

    const onLeaveSet = new Set(
      onLeavePasses
        .filter(p => p.gateLogs.length > 0 && p.gateLogs[0].eventType === "LEFT")
        .map(p => p.studentId)
    );

    const absentRecords = absentIds.map(studentId => ({
      attendanceWindowId: windowId,
      studentId: studentId,
      hostelId: window.hostelId,
      scannedById: completedBy,
      status: onLeaveSet.has(studentId) ? "ON_LEAVE" : "ABSENT",
      remarks: onLeaveSet.has(studentId)
        ? "Marked as on leave automatically upon window completion."
        : "Marked absent automatically upon window completion."
    }));

    await prisma.attendanceRecord.createMany({
      data: absentRecords
    });
  }

  const updatedWindow = await prisma.attendanceWindow.update({
    where: { id: windowId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      completedById: completedBy,
      absentCount: absentIds.length
    }
  });

  orchestratorService.triggerNotification({
    eventName: 'ATTENDANCE_CLOSED',
    target: { type: 'HOSTEL', filter: { hostelId: window.hostelId } },
    data: {
      category: 'ATTENDANCE',
      priority: 'NORMAL'
    },
    channels: ['in-app', 'push']
  }).catch(err => console.error("[Notification] Failed to trigger ATTENDANCE_CLOSED:", err));

  return {
    _id: updatedWindow.id,
    hostelId: updatedWindow.hostelId,
    attendanceDate: updatedWindow.attendanceDate,
    status: updatedWindow.status.toLowerCase(),
    totalStudents: updatedWindow.totalStudents,
    scannedCount: updatedWindow.scannedCount,
    presentCount: updatedWindow.presentCount,
    absentCount: updatedWindow.absentCount,
    completedAt: updatedWindow.completedAt
  };
};
