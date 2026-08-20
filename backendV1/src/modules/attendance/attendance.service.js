import { prisma } from "../../config/prisma.js";
import { orchestratorService } from "../notification/services/orchestrator.service.js";
import { ROLES } from "../../constants/roles.js";
import { ATTENDANCE_STATUS, ATTENDANCE_WINDOW_STATUS, STUDENT_HOSTEL_STATUS, PASS_STATUS, GATE_EVENT_TYPE } from "../../constants/status.js";

const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
};

const formatTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
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
      status: ATTENDANCE_WINDOW_STATUS.OPEN,
      attendanceDate: { lt: today },
    },
    data: {
      status: ATTENDANCE_WINDOW_STATUS.COMPLETED,
      completedAt: new Date(),
      completedById: wardenId
    }
  });

  // Count active students in the hostel
  // MongoDB did: Student.countDocuments({ hostelId, isActive: true, hostelStatus: STUDENT_HOSTEL_STATUS.ACTIVE })
  // In Prisma, we check StudentHostel with status active
  const totalStudents = await prisma.studentHostel.count({
    where: {
      hostelId: hostelId,
      status: STUDENT_HOSTEL_STATUS.ACTIVE,
      student: { isActive: true }
    }
  });

  const newWindow = await prisma.attendanceWindow.create({
    data: {
      hostelId,
      attendanceDate: today,
      totalStudents,
      status: ATTENDANCE_WINDOW_STATUS.OPEN,
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
        startedBy: { select: { id: true, name: true, email: true } },
        completedBy: { select: { id: true, name: true, email: true } }
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
    startedBy: w.startedBy ? { _id: w.startedBy.id, name: w.startedBy.name, email: w.startedBy.email } : null,
    completedBy: w.completedBy ? { _id: w.completedBy.id, name: w.completedBy.name, email: w.completedBy.email } : null
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
      startedBy: { select: { id: true, name: true, email: true } },
      completedBy: { select: { id: true, name: true, email: true } }
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
    windowStartedByName: window.startedBy ? window.startedBy.name : null
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
      startedBy: { select: { name: true } }
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
    windowStartedByName: firstWindow.startedBy ? firstWindow.startedBy.name : null
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
        status: STUDENT_HOSTEL_STATUS.ACTIVE
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
      { admissionNo: { contains: query.search, mode: 'insensitive' } }
    ];
  }
  if (query.room) {
    studentMatch.studentHostels = {
      some: { roomNumber: { contains: query.room, mode: 'insensitive' }, status: STUDENT_HOSTEL_STATUS.ACTIVE }
    };
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
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
            studentHostels: { where: { status: STUDENT_HOSTEL_STATUS.ACTIVE }, select: { roomNumber: true } }
          }
        },
        scannedBy: { select: { id: true, name: true } }
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
      admissionNo: r.student.admissionNo,
      room: r.student.studentHostels?.[0]?.roomNumber || null
    } : null,
    scannedBy: r.scannedBy ? {
      _id: r.scannedBy.id,
      name: r.scannedBy.name
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
      where: { id: windowId, status: ATTENDANCE_WINDOW_STATUS.OPEN },
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
      select: { id: true, admissionNo: true, name: true, studentHostels: { where: { status: STUDENT_HOSTEL_STATUS.ACTIVE }, select: { hostelId: true } } }
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
          status: ATTENDANCE_STATUS.PRESENT,
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
        admissionNo: studentExists.admissionNo,
        name: studentExists.name,
        profileImage: null
      }
    };
  });
};

export const closeAttendanceWindow = async (windowId, completedBy) => {
  const window = await prisma.attendanceWindow.findFirst({
    where: { id: windowId, status: ATTENDANCE_WINDOW_STATUS.OPEN }
  });

  if (!window) {
    throw new Error("Window is already completed or does not exist.");
  }

  const activeStudents = await prisma.student.findMany({
    where: {
      isActive: true,
      studentHostels: { some: { hostelId: window.hostelId, status: STUDENT_HOSTEL_STATUS.ACTIVE } }
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
        status: PASS_STATUS.APPROVED
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
        .filter(p => p.gateLogs.length > 0 && p.gateLogs[0].eventType === GATE_EVENT_TYPE.LEFT)
        .map(p => p.studentId)
    );

    const absentRecords = absentIds.map(studentId => ({
      attendanceWindowId: windowId,
      studentId: studentId,
      hostelId: window.hostelId,
      scannedById: completedBy,
      status: onLeaveSet.has(studentId) ? ATTENDANCE_STATUS.ON_LEAVE : ATTENDANCE_STATUS.ABSENT,
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
      status: ATTENDANCE_WINDOW_STATUS.COMPLETED,
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

const recalculateWindowStats = async (windowId, tx) => {
  const db = tx || prisma;

  const records = await db.attendanceRecord.groupBy({
    by: ['status'],
    where: { attendanceWindowId: windowId },
    _count: { status: true }
  });

  let presentCount = 0;
  let absentCount = 0;
  let onLeaveCount = 0;

  for (const record of records) {
    if (record.status === ATTENDANCE_STATUS.PRESENT) presentCount = record._count.status;
    if (record.status === ATTENDANCE_STATUS.ABSENT) absentCount = record._count.status;
    if (record.status === ATTENDANCE_STATUS.ON_LEAVE) onLeaveCount = record._count.status;
  }

  const scannedCount = presentCount + absentCount + onLeaveCount;

  await db.attendanceWindow.update({
    where: { id: windowId },
    data: { presentCount, absentCount, onLeaveCount, scannedCount }
  });

  return { presentCount, absentCount, onLeaveCount, scannedCount };
};

export const correctAttendanceDb = async (windowId, studentId, wardenId, wardenHostelId, { status, remarks }) => {
  return await prisma.$transaction(async (tx) => {
    const window = await tx.attendanceWindow.findUnique({
      where: { id: windowId }
    });

    if (!window) {
      const err = new Error("Attendance window not found.");
      err.statusCode = 404;
      throw err;
    }

    if (window.hostelId !== wardenHostelId) {
      const err = new Error("You are not allowed to modify this attendance window.");
      err.statusCode = 403;
      throw err;
    }

    if (window.status !== ATTENDANCE_WINDOW_STATUS.OPEN) {
      const err = new Error("Attendance window has already been completed.");
      err.statusCode = 422;
      throw err;
    }

    const student = await tx.student.findFirst({
      where: {
        id: studentId,
        isActive: true,
        studentHostels: { some: { hostelId: wardenHostelId, status: STUDENT_HOSTEL_STATUS.ACTIVE } }
      },
      select: { id: true, admissionNo: true, name: true }
    });

    if (!student) {
      const err = new Error("Student is inactive, does not exist, or does not belong to this hostel.");
      err.statusCode = 422;
      throw err;
    }

    const ALLOWED_STATUSES = [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.ABSENT, ATTENDANCE_STATUS.ON_LEAVE];
    const prismaStatus = status.toUpperCase();

    if (!ALLOWED_STATUSES.includes(prismaStatus)) {
      const err = new Error(`Invalid status. Must be one of: present, absent, on_leave.`);
      err.statusCode = 400;
      throw err;
    }

    const existingRecord = await tx.attendanceRecord.findFirst({
      where: { attendanceWindowId: windowId, studentId: student.id },
      include: { corrections: true }
    });

    const currentStatus = existingRecord ? existingRecord.status : null;

    if (currentStatus === prismaStatus) {
      const label = status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
      const err = new Error(`Attendance is already marked as ${label}.`);
      err.statusCode = 409;
      throw err;
    }

    if (!existingRecord && ![ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.ABSENT].includes(prismaStatus)) {
      const err = new Error("Cannot create an attendance record with this status. Only 'present' or 'absent' are allowed for new records.");
      err.statusCode = 422;
      throw err;
    }

    const remarksRequired =
      (currentStatus === ATTENDANCE_STATUS.PRESENT && prismaStatus === ATTENDANCE_STATUS.ABSENT) ||
      (currentStatus === ATTENDANCE_STATUS.ON_LEAVE && prismaStatus === ATTENDANCE_STATUS.PRESENT) ||
      (currentStatus === ATTENDANCE_STATUS.PRESENT && prismaStatus === ATTENDANCE_STATUS.ON_LEAVE);

    if (remarksRequired) {
      if (!remarks || remarks.trim().length < 5) {
        const err = new Error("Remarks are required for this status change (minimum 5 characters).");
        err.statusCode = 400;
        throw err;
      }
      if (remarks.trim().length > 300) {
        const err = new Error("Remarks must not exceed 300 characters.");
        err.statusCode = 400;
        throw err;
      }
    }

    if (currentStatus === ATTENDANCE_STATUS.PRESENT && prismaStatus === ATTENDANCE_STATUS.ON_LEAVE) {
      const activePass = await tx.pass.findFirst({
        where: {
          studentId,
          status: PASS_STATUS.APPROVED,
          gateLogs: {
            some: { eventType: GATE_EVENT_TYPE.LEFT },
            none: { eventType: GATE_EVENT_TYPE.RETURNED }
          }
        }
      });

      if (!activePass) {
        const err = new Error("Student does not have an active approved leave.");
        err.statusCode = 422;
        throw err;
      }
    }

    let updatedRecord;

    if (existingRecord) {
      updatedRecord = await tx.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: {
          status: prismaStatus,
          remarks: remarks ? remarks.trim() : existingRecord.remarks,
          corrections: {
            create: {
              previousStatus: existingRecord.status,
              newStatus: prismaStatus,
              remarks: remarks ? remarks.trim() : null,
              correctedById: wardenId,
              correctedAt: new Date()
            }
          }
        },
        include: { corrections: true }
      });
    } else {
      updatedRecord = await tx.attendanceRecord.create({
        data: {
          attendanceWindowId: windowId,
          studentId,
          hostelId: wardenHostelId,
          scannedById: wardenId,
          status: prismaStatus,
          remarks: remarks ? remarks.trim() : null,
          corrections: {
            create: {
              previousStatus: null,
              newStatus: prismaStatus,
              remarks: remarks ? remarks.trim() : null,
              correctedById: wardenId,
              correctedAt: new Date()
            }
          }
        },
        include: { corrections: true }
      });
    }

    const updatedCounts = await recalculateWindowStats(windowId, tx);

    return {
      record: {
        _id: updatedRecord.id,
        status: updatedRecord.status.toLowerCase(),
        remarks: updatedRecord.remarks,
        correctionHistory: updatedRecord.corrections.map(c => ({
          previousStatus: c.previousStatus ? c.previousStatus.toLowerCase() : null,
          newStatus: c.newStatus.toLowerCase(),
          remarks: c.remarks,
          wardenId: c.correctedById,
          changedAt: c.correctedAt
        }))
      },
      student: {
        _id: student.id,
        admissionNo: student.admissionNo,
        name: student.name
      },
      windowStats: updatedCounts
    };
  });
};

export const getStudentDashboardStatsDb = async (studentId) => {
  const todayStart = getStartOfDay(new Date());

  const todayRecord = await prisma.attendanceRecord.findFirst({
    where: {
      studentId,
      scannedAt: { gte: todayStart }
    },
    orderBy: { scannedAt: 'desc' }
  });

  let today = null;
  if (todayRecord) {
    today = {
      status: capitalize(todayRecord.status.toLowerCase()),
      markedAt: formatTime(todayRecord.scannedAt),
      date: formatDate(todayRecord.scannedAt)
    };
  }

  const records = await prisma.attendanceRecord.groupBy({
    by: ['status'],
    where: { studentId },
    _count: { status: true }
  });

  let present = 0;
  let absent = 0;

  for (const record of records) {
    if (record.status === ATTENDANCE_STATUS.PRESENT) present = record._count.status;
    if (record.status === ATTENDANCE_STATUS.ABSENT) absent = record._count.status;
  }

  const totalCount = present + absent;
  const summary = {
    present,
    absent,
    percentage: totalCount > 0 ? parseFloat(((present / totalCount) * 100).toFixed(2)) : 0
  };

  return { today, summary };
};

export const getStudentAttendanceHistoryDb = async (studentId, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const where = { studentId };

  if (query.status) {
    where.status = query.status.toUpperCase();
  }

  if (query.fromDate || query.toDate) {
    where.scannedAt = {};
    if (query.fromDate) where.scannedAt.gte = getStartOfDay(query.fromDate);
    if (query.toDate) where.scannedAt.lte = new Date(new Date(query.toDate).setUTCHours(23, 59, 59, 999));
  }

  const [totalRecords, records] = await Promise.all([
    prisma.attendanceRecord.count({ where }),
    prisma.attendanceRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { scannedAt: 'desc' },
      include: {
        scannedBy: {
          select: { name: true }
        }
      }
    })
  ]);

  const formattedRecords = records.map(record => ({
    id: record.id,
    date: formatDate(record.scannedAt),
    markedAt: formatTime(record.scannedAt),
    status: capitalize(record.status.toLowerCase()),
    wardenName: record.scannedBy ? record.scannedBy.name : null
  }));

  return {
    records: formattedRecords,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      hasNextPage: page * limit < totalRecords,
      hasPrevPage: page > 1
    }
  };
};

export const getStudentAttendanceCalendarDb = async (studentId, month, year) => {
  const m = parseInt(month);
  const y = parseInt(year);
  const startDate = new Date(Date.UTC(y, m - 1, 1));
  const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

  const records = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
      scannedAt: { gte: startDate, lte: endDate }
    },
    select: { scannedAt: true, status: true }
  });

  let present = 0;
  let absent = 0;

  const events = records.map(r => {
    if (r.status === ATTENDANCE_STATUS.PRESENT) present++;
    if (r.status === ATTENDANCE_STATUS.ABSENT) absent++;
    return {
      date: formatDate(r.scannedAt),
      status: r.status.toLowerCase()
    };
  });

  const activeHostelAssignment = await prisma.studentHostel.findFirst({
    where: { studentId, status: STUDENT_HOSTEL_STATUS.ACTIVE },
    select: { hostelId: true }
  });

  let notMarked = 0;
  if (activeHostelAssignment && activeHostelAssignment.hostelId) {
    const totalWindows = await prisma.attendanceWindow.count({
      where: {
        hostelId: activeHostelAssignment.hostelId,
        attendanceDate: { gte: startDate, lte: endDate },
        status: ATTENDANCE_WINDOW_STATUS.COMPLETED
      }
    });
    notMarked = Math.max(0, totalWindows - (present + absent));
  }

  return {
    month: m,
    year: y,
    summary: { present, absent, notMarked },
    events
  };
};
