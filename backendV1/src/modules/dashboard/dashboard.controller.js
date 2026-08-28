import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { prisma } from "../../config/prisma.js";
import { Prisma } from "@prisma/client";
const getSuperAdminStats = asyncHandler(async (req, res) => {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    admins,
    wardens,
    students,
    organizations,
    hostels,
    adminLastMonthCount,
    wardenLastMonthCount,
    studentLastMonthCount,
    organizationLastMonthCount,
    hostelLastMonthCount,
    newStudentsToday,
    highPriorityComplaints,
    pendingPasswordRequests,
    inactiveOrganizations,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "WARDEN" } }),
    prisma.student.count(),
    prisma.organization.count(),
    prisma.hostel.count(),

    prisma.user.count({
      where: { role: "ADMIN", createdAt: { gte: lastMonth } },
    }),

    prisma.user.count({
      where: { role: "WARDEN", createdAt: { gte: lastMonth } },
    }),

    prisma.student.count({
      where: { createdAt: { gte: lastMonth } },
    }),

    prisma.organization.count({
      where: { createdAt: { gte: lastMonth } },
    }),

    prisma.hostel.count({
      where: { createdAt: { gte: lastMonth } },
    }),

    prisma.student.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.complaint.count({
      where: {
        priority: "HIGH",
        status: { notIn: ["RESOLVED", "REJECTED"] },
      },
    }),
    prisma.passwordRequest.count({ where: { status: "pending" } }),
    prisma.organization.count({ where: { isActive: false } }),
  ]);

  return sendSuccess(
    res,
    200,
    "Dashboard stats fetched successfully",
    {
      data: {
        organizations,
        admins,
        wardens,
        students,
        hostels,
        organizationLastMonthCount,
        adminLastMonthCount,
        wardenLastMonthCount,
        studentLastMonthCount,
        hostelLastMonthCount,
        newStudentsToday,
        highPriorityComplaints,
        pendingPasswordRequests,
        inactiveOrganizations,
      },
    }
  );
});

const getStudentCountByOrganization = asyncHandler(async (req, res) => {
  const { period } = req.query;
  const matchStage = {};

  if (period) {
    const currentYear = new Date().getFullYear();
    let startYear, endYear;

    if (period === "This Year") {
      startYear = new Date(currentYear, 0, 1);
      endYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    } else if (period === "Last Year") {
      startYear = new Date(currentYear - 1, 0, 1);
      endYear = new Date(currentYear - 1, 11, 31, 23, 59, 59, 999);
    }

    if (startYear && endYear) {
      matchStage.createdAt = { gte: startYear, lte: endYear };
    }
  }

  const grouped = await prisma.student.groupBy({
    by: ['organizationId'],
    _count: {
      id: true
    },
    where: matchStage,
    orderBy: {
      _count: {
        id: 'desc'
      }
    }
  });

  const orgIds = grouped.map(g => g.organizationId);
  const organizations = await prisma.organization.findMany({
    where: { id: { in: orgIds } },
    select: { id: true, name: true }
  });

  const stats = grouped.map(g => {
    const org = organizations.find(o => o.id === g.organizationId);
    return {
      _id: g.organizationId,
      name: org ? org.name : "Unknown Organization",
      count: g._count.id
    };
  });

  return sendSuccess(res, 200, "Student count by organization fetched successfully", {
    data: stats,
  });
});

const getAdminStats = asyncHandler(async (req, res) => {
  const admin = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { organizationId: true }
  });

  if (!admin?.organizationId) {
    return sendError(res, 400, "Admin is not assigned to any organization");
  }

  const organizationId = admin.organizationId;
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const currentYearStart = new Date(new Date().getFullYear(), 0, 1);
  const lastYearStart = new Date(new Date().getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(new Date().getFullYear() - 1, 11, 31, 23, 59, 59);

  const [
    wardens,
    students,
    parents,
    wardenLastMonthCount,
    studentLastMonthCount,
    parentLastMonthCount,
    pendingComplaintsCount,
    leaveRequestsCount,
    inactiveWardensCount,
    totalComplaintsCount,
    unresolvedComplaintsCount,
    approvedLeaveRequestsCount
  ] = await Promise.all([
    prisma.user.count({
      where: { role: "WARDEN", organizationId },
    }),
    prisma.student.count({
      where: { organizationId },
    }),
    prisma.parent.count({
      where: {
        studentParents: { some: { student: { organizationId } } }
      }
    }),
    prisma.user.count({
      where: { role: "WARDEN", organizationId, createdAt: { gte: lastMonth } },
    }),
    prisma.student.count({
      where: { organizationId, createdAt: { gte: lastMonth } },
    }),
    prisma.parent.count({
      where: {
        createdAt: { gte: lastMonth },
        studentParents: { some: { student: { organizationId } } }
      }
    }),
    prisma.complaint.count({
      where: { organizationId, status: "PENDING" },
    }),
    prisma.pass.count({
      where: { status: "pending_admin", student: { organizationId } },
    }),
    prisma.user.count({
      where: { role: "WARDEN", organizationId, isActive: false }
    }),
    prisma.complaint.count({
      where: { organizationId }
    }),
    prisma.complaint.count({
      where: { organizationId, status: { not: "RESOLVED" } }
    }),
    prisma.pass.count({
      where: { status: "approved", student: { organizationId } }
    })
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const thisYearRaw = await prisma.$queryRaw`
    SELECT EXTRACT(MONTH FROM a.created_at) as month,
           SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
           COUNT(*) as total_count
    FROM attendance_records a
    JOIN students s ON a.student_id = s.id
    WHERE s.organization_id = ${organizationId}::uuid
      AND a.created_at >= ${currentYearStart}
    GROUP BY EXTRACT(MONTH FROM a.created_at)
  `;

  const lastYearRaw = await prisma.$queryRaw`
    SELECT EXTRACT(MONTH FROM a.created_at) as month,
           SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
           COUNT(*) as total_count
    FROM attendance_records a
    JOIN students s ON a.student_id = s.id
    WHERE s.organization_id = ${organizationId}::uuid
      AND a.created_at >= ${lastYearStart}
      AND a.created_at <= ${lastYearEnd}
    GROUP BY EXTRACT(MONTH FROM a.created_at)
  `;

  const formatRaw = (rawResults) => {
    return monthNames.map((month, index) => {
      const monthIndex = index + 1;
      const stat = rawResults.find(s => Number(s.month) === monthIndex);
      let value = 0;
      if (stat && Number(stat.total_count) > 0) {
        value = Math.round((Number(stat.present_count) / Number(stat.total_count)) * 100);
      }
      return { month, value };
    });
  };

  return sendSuccess(
    res,
    200,
    "Dashboard stats fetched successfully",
    {
      data: {
        wardens,
        students,
        parents,
        wardenLastMonthCount,
        studentLastMonthCount,
        parentLastMonthCount,
        pendingComplaints: pendingComplaintsCount,
        leaveRequests: leaveRequestsCount,
        inactiveWardens: inactiveWardensCount,
        parentsMessages: 0,
        complaintsOverview: { total: totalComplaintsCount, unresolved: unresolvedComplaintsCount },
        leaveApproved: approvedLeaveRequestsCount,
        attendance: {
          thisYear: formatRaw(thisYearRaw),
          lastYear: formatRaw(lastYearRaw)
        }
      },
    }
  );
});

const getStudentDashboardStats = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const student = await prisma.student.findUnique({
    where: { id: studentId }
  });

  if (!student) {
    return sendError(res, 404, "Student not found");
  }

  const { period, radialPeriod } = req.query;

  const now = new Date();
  let startOfRadial = new Date(now.getFullYear(), now.getMonth(), 1);
  let endOfRadial = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  if (radialPeriod === "Last Month") {
    startOfRadial = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endOfRadial = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  }

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
      createdAt: { gte: startOfRadial, lte: endOfRadial }
    }
  });

  let presentCount = 0;
  let totalDays = attendanceRecords.length;
  attendanceRecords.forEach(record => {
    if (record.status === "PRESENT") presentCount++;
  });
  const attendanceRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

  let startOfYear = new Date(now.getFullYear(), 0, 1);
  let endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

  if (period === "Last Year") {
    startOfYear = new Date(now.getFullYear() - 1, 0, 1);
    endOfYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
  }

  const monthlyStats = await prisma.$queryRaw`
    SELECT EXTRACT(MONTH FROM created_at) as month,
           SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
           COUNT(*) as total_count
    FROM attendance_records
    WHERE student_id = ${studentId}::uuid
      AND created_at >= ${startOfYear}
      AND created_at <= ${endOfYear}
    GROUP BY EXTRACT(MONTH FROM created_at)
  `;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const monthlyAttendance = monthNames.map((month, index) => {
    const stat = monthlyStats.find(s => Number(s.month) === index + 1);
    let value = 0;
    if (stat && Number(stat.total_count) > 0) {
      value = Math.round((Number(stat.present_count) / Number(stat.total_count)) * 100);
    }
    return { month, value };
  });

  const openComplaintsCount = await prisma.complaint.count({
    where: {
      studentId,
      status: { in: ["PENDING", "IN_PROGRESS"] }
    }
  });

  const pendingLeaveRequestsCount = await prisma.pass.count({
    where: {
      studentId,
      status: { in: ["pending_parent", "pending_admin"] }
    }
  });

  const recentComplaints = await prisma.complaint.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  const recentLeaveRequests = await prisma.pass.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  const studentHostel = await prisma.studentHostel.findFirst({
    where: { studentId, status: "active" }
  });
  const hostelId = studentHostel?.hostelId;

  const recentAnnouncements = await prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [
        { targetType: "GENERAL" },
        { targetType: "ORGANIZATION", organizations: { some: { organizationId: student.organizationId } } },
        ...(hostelId ? [{ targetType: "HOSTEL", hostels: { some: { hostelId } } }] : [])
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return sendSuccess(res, 200, "Student dashboard stats fetched successfully", {
    data: {
      attendanceRate,
      presentCount,
      totalDays,
      openComplaintsCount,
      pendingLeaveRequestsCount,
      recentComplaints,
      recentLeaveRequests,
      recentAnnouncements,
      monthlyAttendance
    }
  });
});

const getParentDashboardStats = asyncHandler(async (req, res) => {
  const studentId = req.student ? req.student.id : req.params.studentId;

  if (!studentId) {
    return sendError(res, 400, "Student ID is required.");
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId }
  });
  if (!student) {
    return sendError(res, 404, "Student not found");
  }

  const { period, radialPeriod } = req.query;

  const now = new Date();
  let startOfRadial = new Date(now.getFullYear(), now.getMonth(), 1);
  let endOfRadial = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  if (radialPeriod === "Last Month") {
    startOfRadial = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endOfRadial = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  }

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
      createdAt: { gte: startOfRadial, lte: endOfRadial }
    }
  });

  let presentCount = 0;
  let leaveCount = 0;
  let totalDays = attendanceRecords.length;
  attendanceRecords.forEach(record => {
    if (record.status === "PRESENT") presentCount++;
    if (record.status === "ON_LEAVE") leaveCount++;
  });
  const attendanceRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

  let startOfYear = new Date(now.getFullYear(), 0, 1);
  let endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

  if (period === "Last Year") {
    startOfYear = new Date(now.getFullYear() - 1, 0, 1);
    endOfYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
  }

  const monthlyStats = await prisma.$queryRaw`
    SELECT EXTRACT(MONTH FROM created_at) as month,
           SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
           COUNT(*) as total_count
    FROM attendance_records
    WHERE student_id = ${studentId}::uuid
      AND created_at >= ${startOfYear}
      AND created_at <= ${endOfYear}
    GROUP BY EXTRACT(MONTH FROM created_at)
  `;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const monthlyAttendance = monthNames.map((month, index) => {
    const stat = monthlyStats.find(s => Number(s.month) === index + 1);
    let value = 0;
    if (stat && Number(stat.total_count) > 0) {
      value = Math.round((Number(stat.present_count) / Number(stat.total_count)) * 100);
    }
    return { month, value };
  });

  const pendingVisitorsCount = await prisma.visitRequest.count({
    where: {
      studentId,
      status: "PENDING"
    }
  });

  const pendingLeaveRequestsCount = await prisma.pass.count({
    where: {
      studentId,
      status: { in: ["pending_parent", "pending_admin"] }
    }
  });

  const pendingParentLeaveRequests = await prisma.pass.findMany({
    where: {
      studentId,
      status: "pending_parent"
    },
    include: {
      student: { select: { name: true, admissionNo: true } }
    }
  });

  const recentVisitors = await prisma.visitRequest.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { visitor: true }
  });

  const recentLeaveRequests = await prisma.pass.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  const studentHostel = await prisma.studentHostel.findFirst({
    where: { studentId, status: "active" }
  });
  const hostelId = studentHostel?.hostelId;

  const recentAnnouncements = await prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [
        { targetType: "GENERAL" },
        { targetType: "ORGANIZATION", organizations: { some: { organizationId: student.organizationId } } },
        ...(hostelId ? [{ targetType: "HOSTEL", hostels: { some: { hostelId } } }] : [])
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return sendSuccess(res, 200, "Parent dashboard stats fetched successfully", {
    data: {
      attendanceRate,
      presentCount,
      leaveCount,
      totalDays,
      pendingVisitorsCount,
      pendingLeaveRequestsCount,
      recentVisitors,
      recentLeaveRequests,
      recentAnnouncements,
      monthlyAttendance,
      pendingParentLeaveRequests
    }
  });
});

const getAttendanceOverview = asyncHandler(async (req, res) => {
  const { period } = req.query;
  const currentYear = new Date().getFullYear();
  const year = period === "Last Year" ? currentYear - 1 : currentYear;

  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

  const windows = await prisma.$queryRaw`
    SELECT EXTRACT(MONTH FROM attendance_date) as month,
           SUM(present_count) as present_count,
           SUM(total_students) as total_students
    FROM attendance_windows
    WHERE attendance_date >= ${startOfYear}
      AND attendance_date <= ${endOfYear}
    GROUP BY EXTRACT(MONTH FROM attendance_date)
    ORDER BY month ASC
  `;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dataMap = new Map();
  monthNames.forEach(m => dataMap.set(m, { present: 0, total: 0 }));

  windows.forEach(w => {
    const monthName = monthNames[Number(w.month) - 1];
    dataMap.set(monthName, { present: Number(w.present_count), total: Number(w.total_students) });
  });

  const chartData = monthNames.map(month => {
    const data = dataMap.get(month);
    const value = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
    return { month, value, rawPresent: data.present, rawTotal: data.total };
  });

  let yearlyPresent = 0;
  let yearlyTotal = 0;
  chartData.forEach(d => {
    yearlyPresent += d.rawPresent;
    yearlyTotal += d.rawTotal;
  });
  const avgRate = yearlyTotal > 0 ? Math.round((yearlyPresent / yearlyTotal) * 100) : 0;

  const currentActualMonth = new Date().getMonth();

  let currentMonthRate = 0;
  let lastMonthRate = 0;

  if (period === "Last Year") {
    currentMonthRate = chartData[11].value;
    lastMonthRate = chartData[10].value;
  } else {
    currentMonthRate = chartData[currentActualMonth].value;
    lastMonthRate = currentActualMonth > 0 ? chartData[currentActualMonth - 1].value : chartData[11].value;
  }

  const vsLastMonth = currentMonthRate - lastMonthRate;
  const cleanChartData = chartData.map(({ month, value }) => ({ month, value }));

  return sendSuccess(res, 200, "Attendance overview fetched successfully", {
    data: {
      chartData: cleanChartData,
      avgRate: avgRate + "%",
      currentMonth: currentMonthRate + "%",
      vsLastMonth: (vsLastMonth >= 0 ? "+" : "") + vsLastMonth + "%"
    }
  });
});

const getMentorDashboardStats = asyncHandler(async (req, res) => {
  const activeAssignments = await prisma.mentorAssignment.findMany({
    where: {
      mentorId: req.user.id,
      status: "ACTIVE"
    },
    select: { batchId: true }
  });

  const batchIds = activeAssignments.map(a => a.batchId);

  const students = await prisma.student.findMany({
    where: { batchId: { in: batchIds } },
    select: { id: true }
  });
  const studentIds = students.map(s => s.id);

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const currentYearStart = new Date(new Date().getFullYear(), 0, 1);
  const lastYearStart = new Date(new Date().getFullYear() - 1, 0, 1);

  const [
    studentsCount,
    studentLastMonthCount,
    parentsCount,
    parentLastMonthCount,
    batches,
    announcements,
    recentLeaveRequests,
    recentVisitorsRaw
  ] = await Promise.all([
    prisma.student.count({ where: { batchId: { in: batchIds } } }),
    prisma.student.count({ where: { batchId: { in: batchIds }, createdAt: { gte: lastMonth } } }),
    prisma.parent.count({ where: { studentParents: { some: { studentId: { in: studentIds } } } } }),
    prisma.parent.count({ where: { createdAt: { gte: lastMonth }, studentParents: { some: { studentId: { in: studentIds } } } } }),

    prisma.batch.findMany({ where: { id: { in: batchIds } }, select: { id: true, name: true, code: true } }),

    prisma.announcement.findMany({
      where: { status: "ACTIVE", isActive: true },
      include: { createdBy: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),

    prisma.pass.findMany({
      where: { studentId: { in: studentIds } },
      include: { student: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),

    prisma.visitRequest.findMany({
      where: { studentId: { in: studentIds } },
      include: { visitor: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ]);

  let attendanceStatsRaw = [];
  if (studentIds.length > 0) {
    attendanceStatsRaw = await prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: {
        studentId: {
          in: studentIds,
        },
        createdAt: {
          gte: lastYearStart,
        },
      },
      _count: {
        _all: true,
      },
    });
  }

  const pendingPassesCount = await prisma.pass.count({ where: { studentId: { in: studentIds }, status: { in: ["pending_admin", "pending_parent"] } } });
  const approvedPassesCount = await prisma.pass.count({ where: { studentId: { in: studentIds }, status: "approved" } });

  const currentYear = new Date().getFullYear();
  const formatAttendance = (yearToFilter) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.map((month, index) => {
      const found = (Array.isArray(attendanceStatsRaw) ? attendanceStatsRaw : []).find(item => Number(item.year) === yearToFilter && Number(item.month) === (index + 1));
      return {
        month,
        value: found && Number(found.total_count) > 0 ? Math.round((Number(found.present_count) / Number(found.total_count)) * 100) : 0
      };
    });
  };

  const recentActivities = [
    ...recentLeaveRequests.map(r => ({
      action: `Leave Request ${r.status.split('_')[0]}`,
      createdAt: r.createdAt,
      user: { name: r.student?.name || 'Student' }
    })),
    ...recentVisitorsRaw.map(v => ({
      action: `New Visitor`,
      createdAt: v.createdAt,
      user: { name: v.visitor?.name || 'Visitor' }
    }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const stats = {
    students: studentsCount,
    studentLastMonthCount: studentLastMonthCount,
    parents: parentsCount,
    parentLastMonthCount: parentLastMonthCount,
    leaveRequests: pendingPassesCount,
    quickSummary: {
      leaves: {
        pending: pendingPassesCount,
        approved: approvedPassesCount
      },
      studentsOutside: {
        current: 0,
        returned: 0
      }
    },
    recentActivities,
    attendance: {
      thisYear: formatAttendance(currentYear),
      lastYear: formatAttendance(currentYear - 1)
    },
    batches: batches.map(b => ({ _id: b.id, name: b.name, code: b.code })),
    announcements: announcements.map(a => ({
      _id: a.id,
      title: a.title,
      message: a.message,
      createdBy: { firstName: a.createdBy?.name || 'Admin' },
      createdAt: a.createdAt
    }))
  };

  return sendSuccess(res, 200, "Dashboard statistics loaded successfully.", { data: stats });
});

const getWardenDashboardSummary = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;

  const wardenHostels = await prisma.hostelWarden.findMany({
    where: { userId: wardenId },
    select: { hostelId: true }
  });

  if (!wardenHostels.length) {
    return sendError(res, 404, "No active hostel assigned to this warden.");
  }

  const hostelIds = wardenHostels.map(h => h.hostelId);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    totalStudents,
    pendingComplaints,
    leaveRequests,
    todaysAttendanceRecords,
    highPriorityComplaints,
    leavesApprovedThisWeek,
    visitorsToday,
    totalComplaints
  ] = await Promise.all([
    prisma.student.count({
      where: {
        studentHostels: { some: { hostelId: { in: hostelIds }, status: "active" } }
      }
    }),
    prisma.complaint.count({
      where: { hostelId: { in: hostelIds }, status: { in: ["PENDING", "IN_PROGRESS", "AWAITING"] } }
    }),
    prisma.pass.count({
      where: {
        student: { studentHostels: { some: { hostelId: { in: hostelIds }, status: "active" } } },
        status: { in: ["pending_parent", "pending_admin"] }
      }
    }),
    prisma.attendanceRecord.findMany({
      where: {
        hostelId: { in: hostelIds },
        createdAt: { gte: todayStart, lte: todayEnd }
      },
      select: { status: true }
    }),
    prisma.complaint.count({
      where: { hostelId: { in: hostelIds }, status: { in: ["PENDING", "IN_PROGRESS", "AWAITING"] }, priority: "HIGH" }
    }),
    prisma.pass.count({
      where: {
        student: { studentHostels: { some: { hostelId: { in: hostelIds }, status: "active" } } },
        status: "approved",
        updatedAt: { gte: weekStart }
      }
    }),
    prisma.visitRequest.count({
      where: {
        student: { studentHostels: { some: { hostelId: { in: hostelIds }, status: "active" } } },
        createdAt: { gte: todayStart, lte: todayEnd }
      }
    }),
    prisma.complaint.count({
      where: { hostelId: { in: hostelIds } }
    })
  ]);

  let presentToday = 0;
  let absentToday = 0;
  todaysAttendanceRecords.forEach(r => {
    if (r.status === "PRESENT") presentToday++;
    if (r.status === "ABSENT") absentToday++;
  });

  const complaintStatsRaw = await prisma.complaint.groupBy({
    by: ['status'],
    where: { hostelId: { in: hostelIds } },
    _count: { id: true }
  });

  const complaintStats = complaintStatsRaw.map(s => ({
    name: s.status,
    count: s._count.id
  }));

  const allStatuses = ['INCOMPLETE', 'RESOLVED', 'PENDING', 'IN_PROGRESS', 'AWAITING', 'REJECTED'];
  const existingStatuses = new Set(complaintStats.map(s => s.name));

  allStatuses.forEach(status => {
    if (!existingStatuses.has(status)) {
      complaintStats.push({ name: status, count: 0 });
    }
  });

  complaintStats.sort((a, b) => b.count - a.count);

  const complaintSummary = complaintStats.map(stat => ({
    name: stat.name.charAt(0) + stat.name.slice(1).toLowerCase().replace('_', ' '),
    count: stat.count,
    value: totalComplaints > 0 ? Math.round((stat.count / totalComplaints) * 100) : 0
  }));

  const recentComplaints = await prisma.complaint.findMany({
    where: { hostelId: { in: hostelIds } },
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: { student: { select: { name: true } } }
  });

  const recentPasses = await prisma.pass.findMany({
    where: {
      student: { studentHostels: { some: { hostelId: { in: hostelIds }, status: "active" } } }
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: { student: { select: { name: true } } }
  });

  const recentActivities = [
    ...recentComplaints.map(c => ({
      _id: c.id,
      action: `Complaint filed - Room ${c.roomNo || 'N/A'}: ${c.subject}`,
      performedBy: { name: c.student?.name || 'Student' },
      performedByModel: 'User',
      createdAt: c.createdAt
    })),
    ...recentPasses.map(p => ({
      _id: p.id,
      action: `Leave Request from ${p.student?.name || 'Student'}`,
      performedBy: { name: p.student?.name || 'Student' },
      performedByModel: 'User',
      createdAt: p.createdAt
    }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  twoWeeksAgo.setHours(0, 0, 0, 0);

  const attendanceWindowsRaw = await prisma.attendanceWindow.findMany({
    where: {
      hostelId: { in: hostelIds },
      attendanceDate: { gte: twoWeeksAgo }
    },
    select: { attendanceDate: true, presentCount: true, totalStudents: true },
    orderBy: { attendanceDate: 'asc' }
  });

  const data = {
    totalStudents,
    presentToday,
    absentToday,
    pendingComplaints,
    totalComplaints,
    leaveRequests,
    recentActivities,
    attendanceHistory: attendanceWindowsRaw,

    messAttendance: { value: presentToday, total: totalStudents },
    complaintStatus: { open: pendingComplaints, highPriority: highPriorityComplaints },
    leavesApproved: { thisWeek: leavesApprovedThisWeek, pending: leaveRequests },
    parentMessage: { unread: visitorsToday, urgent: 0 },

    complaintSummary: complaintSummary.length > 0 ? complaintSummary : [
      { name: 'Maintenance', value: 40, color: '#3B82F6' },
      { name: 'Mess / Food', value: 25, color: '#A855F7' },
      { name: 'Roommate', value: 15, color: '#F59E0B' },
      { name: 'Wifi Network', value: 10, color: '#10B981' },
      { name: 'Other', value: 10, color: '#9CA3AF' }
    ]
  };

  return sendSuccess(res, 200, "Warden dashboard summary fetched successfully", { data });
});

export {
  getSuperAdminStats,
  getStudentCountByOrganization,
  getAdminStats,
  getStudentDashboardStats,
  getParentDashboardStats,
  getAttendanceOverview,
  getMentorDashboardStats,
  getWardenDashboardSummary
};
