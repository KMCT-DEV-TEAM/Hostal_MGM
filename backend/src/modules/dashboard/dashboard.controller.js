import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import User from "../users/user.model.js";
import Organization from "../organizations/organization.model.js";
import Hostel from "../hostels/hostel.model.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import Complaint from "../complaints/complaint.model.js";
import Pass from "../passes/pass.model.js";
import Visitor from "../visitor/visitor.model.js";
import { AttendanceRecord, AttendanceWindow } from "../attendance/attendance.model.js";
import PasswordRequest from "../passwordRequests/passwordRequest.model.js";
import Announcement from "../announcements/announcement.model.js";
import MentorAssignment from "../mentors/mentorAssignment.model.js";
import Batch from "../batches/batch.model.js";
import { getManagementDashboardStatsDb } from "../passes/pass.service.js";
import mongoose from "mongoose";

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
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ role: "warden" }),
    Student.countDocuments(),
    Organization.countDocuments(),
    Hostel.countDocuments(),

    User.countDocuments({
      role: "admin",
      createdAt: { $gte: lastMonth },
    }),

    User.countDocuments({
      role: "warden",
      createdAt: { $gte: lastMonth },
    }),

    Student.countDocuments({
      createdAt: { $gte: lastMonth },
    }),

    Organization.countDocuments({
      createdAt: { $gte: lastMonth },
    }),

    Hostel.countDocuments({
      createdAt: { $gte: lastMonth },
    }),

    Student.countDocuments({ createdAt: { $gte: startOfToday } }),
    Complaint.countDocuments({ priority: "High", status: { $nin: ["Resolved", "Rejected"] } }),
    PasswordRequest.countDocuments({ status: "pending" }),
    Organization.countDocuments({ isActive: false }),
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
      matchStage.createdAt = { $gte: startYear, $lte: endYear };
    }
  }

  const pipeline = [];
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  pipeline.push(
    {
      $group: {
        _id: "$organizationId",
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "organizations",
        localField: "_id",
        foreignField: "_id",
        as: "organization",
      },
    },
    {
      $unwind: {
        path: "$organization",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        name: { $ifNull: ["$organization.name", "Unknown Organization"] },
        count: 1,
      },
    },
    {
      $sort: { count: -1 },
    }
  );

  const stats = await Student.aggregate(pipeline);

  return sendSuccess(res, 200, "Student count by organization fetched successfully", {
    data: stats,
  });
});


// admin controllers
const getAdminStats = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user.id)
    .select("organization")
    .lean();
  if (!admin?.organization) {
    return sendError(
      res,
      400,
      "Admin is not assigned to any organization"
    );
  }

  const organizationId = admin.organization;
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
    approvedLeaveRequestsCount,
    thisYearAttendanceStats,
    lastYearAttendanceStats
  ] = await Promise.all([
    User.countDocuments({
      role: "warden",
      organization: organizationId,
    }),

    Student.countDocuments({
      organizationId,
    }),

    Parent.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: "$student",
      },
      {
        $match: {
          "student.organizationId": organizationId,
        },
      },
      {
        $count: "total",
      },
    ]),

    User.countDocuments({
      role: "warden",
      organization: organizationId,
      createdAt: { $gte: lastMonth },
    }),

    Student.countDocuments({
      organizationId,
      createdAt: { $gte: lastMonth },
    }),

    Parent.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: "$student",
      },
      {
        $match: {
          "student.organizationId": organizationId,
          createdAt: { $gte: lastMonth },
        },
      },
      {
        $count: "total",
      },
    ]),

    Complaint.countDocuments({
      organizationId,
      status: "Pending",
    }),

    Pass.aggregate([
      {
        $match: {
          status: "pending_admin",
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: "$student",
      },
      {
        $match: {
          "student.organizationId": organizationId,
        },
      },
      {
        $count: "total",
      },
    ]),

    User.countDocuments({
      role: "warden",
      organization: organizationId,
      isActive: false
    }),

    Complaint.countDocuments({
      organizationId
    }),

    Complaint.countDocuments({
      organizationId,
      status: { $ne: "Resolved" }
    }),

    Pass.aggregate([
      { $match: { status: "approved" } },
      { $lookup: { from: "students", localField: "studentId", foreignField: "_id", as: "student" } },
      { $unwind: "$student" },
      { $match: { "student.organizationId": organizationId } },
      { $count: "total" }
    ]),

    AttendanceRecord.aggregate([
      { $match: { createdAt: { $gte: currentYearStart } } },
      { $lookup: { from: "students", localField: "studentId", foreignField: "_id", as: "student" } },
      { $unwind: "$student" },
      { $match: { "student.organizationId": organizationId } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          presentCount: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          totalCount: { $sum: 1 }
        }
      }
    ]),

    AttendanceRecord.aggregate([
      { $match: { createdAt: { $gte: lastYearStart, $lte: lastYearEnd } } },
      { $lookup: { from: "students", localField: "studentId", foreignField: "_id", as: "student" } },
      { $unwind: "$student" },
      { $match: { "student.organizationId": organizationId } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          presentCount: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          totalCount: { $sum: 1 }
        }
      }
    ])
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const thisYearAttendance = monthNames.map((month, index) => {
    const stat = thisYearAttendanceStats.find(s => s._id === index + 1);
    let value = 0;
    if (stat && stat.totalCount > 0) {
      value = Math.round((stat.presentCount / stat.totalCount) * 100);
    }
    return { month, value };
  });

  const lastYearAttendance = monthNames.map((month, index) => {
    const stat = lastYearAttendanceStats.find(s => s._id === index + 1);
    let value = 0;
    if (stat && stat.totalCount > 0) {
      value = Math.round((stat.presentCount / stat.totalCount) * 100);
    }
    return { month, value };
  });

  return sendSuccess(
    res,
    200,
    "Dashboard stats fetched successfully",
    {
      data: {
        wardens,
        students,
        parents: parents[0]?.total || 0,
        wardenLastMonthCount,
        studentLastMonthCount,
        parentLastMonthCount: parentLastMonthCount[0]?.total || 0,
        pendingComplaints: pendingComplaintsCount || 0,
        leaveRequests: leaveRequestsCount[0]?.total || 0,

        inactiveWardens: inactiveWardensCount,
        parentsMessages: 0,
        complaintsOverview: { total: totalComplaintsCount, unresolved: unresolvedComplaintsCount },
        leaveApproved: approvedLeaveRequestsCount[0]?.total || 0,
        attendance: {
          thisYear: thisYearAttendance,
          lastYear: lastYearAttendance
        }
      },
    }
  );
});


const getStudentDashboardStats = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const student = await Student.findById(studentId);

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

  const attendanceRecords = await AttendanceRecord.find({
    studentId,
    createdAt: { $gte: startOfRadial, $lte: endOfRadial }
  });

  let presentCount = 0;
  let totalDays = attendanceRecords.length;
  attendanceRecords.forEach(record => {
    if (record.status === "present") presentCount++;
  });
  const attendanceRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

  let startOfYear = new Date(now.getFullYear(), 0, 1);
  let endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

  if (period === "Last Year") {
    startOfYear = new Date(now.getFullYear() - 1, 0, 1);
    endOfYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
  }

  const monthlyStats = await AttendanceRecord.aggregate([
    {
      $match: {
        studentId: new mongoose.Types.ObjectId(studentId),
        createdAt: { $gte: startOfYear, $lte: endOfYear }
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        presentCount: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        totalCount: { $sum: 1 }
      }
    }
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const monthlyAttendance = monthNames.map((month, index) => {
    const stat = monthlyStats.find(s => s._id === index + 1);
    let value = 0;
    if (stat && stat.totalCount > 0) {
      value = Math.round((stat.presentCount / stat.totalCount) * 100);
    }
    return { month, value };
  });

  const openComplaintsCount = await Complaint.countDocuments({
    studentId,
    status: { $in: ["Pending", "In progress"] }
  });

  const pendingLeaveRequestsCount = await Pass.countDocuments({
    studentId,
    status: { $in: ["pending_parent", "pending_admin"] }
  });

  const recentComplaints = await Complaint.find({ studentId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentLeaveRequests = await Pass.find({ studentId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentAnnouncements = await Announcement.find({
    isActive: true,
    $or: [
      { targetType: "general" },
      { targetType: "organization", targetOrganizations: student.organizationId },
      { targetType: "hostel", targetHostels: student.hostelId }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

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
  const parentId = req.user.id;
  const parent = await Parent.findById(parentId).select('studentId');

  if (!parent) {
    return sendError(res, 404, "Parent not found");
  }

  const studentId = parent.studentId;
  const student = await Student.findById(studentId);

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

  const attendanceRecords = await AttendanceRecord.find({
    studentId,
    createdAt: { $gte: startOfRadial, $lte: endOfRadial }
  });

  let presentCount = 0;
  let leaveCount = 0;
  let totalDays = attendanceRecords.length;
  attendanceRecords.forEach(record => {
    if (record.status === "present") presentCount++;
    if (record.status === "on_leave") leaveCount++;
  });
  const attendanceRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

  let startOfYear = new Date(now.getFullYear(), 0, 1);
  let endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

  if (period === "Last Year") {
    startOfYear = new Date(now.getFullYear() - 1, 0, 1);
    endOfYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
  }

  const monthlyStats = await AttendanceRecord.aggregate([
    {
      $match: {
        studentId: new mongoose.Types.ObjectId(studentId),
        createdAt: { $gte: startOfYear, $lte: endOfYear }
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        presentCount: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        totalCount: { $sum: 1 }
      }
    }
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const monthlyAttendance = monthNames.map((month, index) => {
    const stat = monthlyStats.find(s => s._id === index + 1);
    let value = 0;
    if (stat && stat.totalCount > 0) {
      value = Math.round((stat.presentCount / stat.totalCount) * 100);
    }
    return { month, value };
  });

  const pendingVisitorsCount = await Visitor.countDocuments({
    students: studentId,
    approvalStatus: "Pending"
  });

  const pendingLeaveRequestsCount = await Pass.countDocuments({
    studentId,
    status: { $in: ["pending_parent", "pending_admin"] }
  });

  const pendingParentLeaveRequests = await Pass.find({
    studentId,
    status: "pending_parent"
  }).populate({
    path: "studentId",
    select: "firstName lastName admissionNo regNo"
  });


  const recentVisitors = await Visitor.find({ students: studentId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentLeaveRequests = await Pass.find({ studentId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentAnnouncements = await Announcement.find({
    isActive: true,
    $or: [
      { targetType: "general" },
      { targetType: "organization", targetOrganizations: student.organizationId },
      { targetType: "hostel", targetHostels: student.hostelId }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

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

  const windows = await AttendanceWindow.aggregate([
    {
      $match: {
        attendanceDate: { $gte: startOfYear, $lte: endOfYear }
      }
    },
    {
      $group: {
        _id: { $month: "$attendanceDate" },
        presentCount: { $sum: "$presentCount" },
        totalStudents: { $sum: "$totalStudents" }
      }
    },
    {
      $sort: { "_id": 1 }
    }
  ]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const dataMap = new Map();
  monthNames.forEach(m => dataMap.set(m, { present: 0, total: 0 }));

  windows.forEach(w => {
    const monthName = monthNames[w._id - 1];
    dataMap.set(monthName, { present: w.presentCount, total: w.totalStudents });
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

const buildMentorScopeForStats = async (req) => {
  const activeAssignments = await MentorAssignment.find({
    mentorId: req.user.id,
    status: "active"
  }).select("batchId").lean();

  const batchIds = activeAssignments.map(({ batchId }) => batchId);
  return {
    role: "mentor",
    organizationId: req.user.organization,
    batchIds,
    actorId: req.user.id
  };
};

const getMentorDashboardStats = asyncHandler(async (req, res) => {
  const scope = await buildMentorScopeForStats(req);
  const batchIds = scope.batchIds || [];

  // Resolve student IDs in mentor's batches
  const studentIds = await Student.distinct('_id', { batchId: { $in: batchIds } });

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const currentYearStart = new Date(new Date().getFullYear(), 0, 1);
  const lastYearStart = new Date(new Date().getFullYear() - 1, 0, 1);

  const [
    studentStats,
    parentStats,
    passStats,
    attendanceStats,
    batches,
    announcements,
    recentVisitors,
    recentLeaveRequests,
    todayWindows
  ] = await Promise.all([
    Student.aggregate([
      { $match: { batchId: { $in: batchIds } } },
      {
        $facet: {
          total: [{ $count: "count" }],
          lastMonth: [{ $match: { createdAt: { $gte: lastMonth } } }, { $count: "count" }]
        }
      }
    ]),
    Parent.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      {
        $facet: {
          total: [{ $count: "count" }],
          lastMonth: [{ $match: { createdAt: { $gte: lastMonth } } }, { $count: "count" }]
        }
      }
    ]),
    getManagementDashboardStatsDb(scope),
    AttendanceRecord.aggregate([
      { $match: { studentId: { $in: studentIds }, createdAt: { $gte: lastYearStart } } },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" }, 
            month: { $month: "$createdAt" } 
          },
          presentCount: { $sum: { $cond: [{ $eq: [{ $toLower: "$status" }, "present"] }, 1, 0] } },
          totalCount: { $sum: 1 }
        }
      }
    ]),
    Batch.find({ _id: { $in: batchIds } }).select("name code").lean(),
    Announcement.find({ status: "active", isActive: true })
      .populate("createdBy", "firstName lastName role")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Visitor.find({ students: { $in: studentIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Pass.find({ studentId: { $in: studentIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    (async () => {
      const hostelIds = await Student.distinct('hostelId', { batchId: { $in: batchIds } });
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      
      return AttendanceWindow.find({
        hostelId: { $in: hostelIds },
        attendanceDate: { $gte: startOfToday, $lte: endOfToday }
      }).select('status').lean();
    })()
  ]);

  const studentsCount = studentStats[0]?.total[0]?.count || 0;
  const studentLastMonthCount = studentStats[0]?.lastMonth[0]?.count || 0;
  const parentsCount = parentStats[0]?.total[0]?.count || 0;
  const parentLastMonthCount = parentStats[0]?.lastMonth[0]?.count || 0;

  const currentYear = new Date().getFullYear();
  const formatAttendance = (year) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.map((month, index) => {
      const found = attendanceStats.find(item => item._id.year === year && item._id.month === (index + 1));
      return {
        month,
        value: found && found.totalCount > 0 ? Math.round((found.presentCount / found.totalCount) * 100) : 0
      };
    });
  };

  let windowStatus = "Not Opened";
  if (todayWindows && todayWindows.length > 0) {
    if (todayWindows.some(w => w.status === 'open')) {
      windowStatus = "Opened";
    } else if (todayWindows.every(w => w.status === 'completed')) {
      windowStatus = "Closed";
    } else {
      windowStatus = "Opened";
    }
  }

  const quickSummary = {
    leaves: {
      pending: passStats?.pending || 0,
      approved: passStats?.approved || 0
    },
    studentsOutside: {
      current: passStats?.studentsOutside || 0,
      returned: passStats?.returnedToday || 0
    },
    attendanceStatus: windowStatus
  };

  const recentActivities = [
    ...(recentLeaveRequests || []).map(r => ({
      action: `Leave Request ${r.status.split('_')[0]}`,
      createdAt: r.createdAt,
      user: { name: r.studentId?.firstName || 'Student' }
    })),
    ...(recentVisitors || []).map(v => ({
      action: `New Visitor`,
      createdAt: v.createdAt,
      user: { name: v.name || 'Visitor' }
    }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const stats = {
    students: studentsCount,
    studentLastMonthCount: studentLastMonthCount,
    parents: parentsCount,
    parentLastMonthCount: parentLastMonthCount,
    leaveRequests: passStats?.pending || 0,
    quickSummary: {
      leaves: {
        pending: passStats?.pending || 0,
        approved: passStats?.approved || 0
      },
      studentsOutside: {
        current: passStats?.studentsOutside || 0,
        returned: passStats?.returnedToday || 0
      }
    },
    recentActivities,
    attendance: {
      thisYear: formatAttendance(currentYear),
      lastYear: formatAttendance(currentYear - 1)
    },
    batches: batches.map(b => ({ _id: b._id, name: b.name, code: b.code })),
    announcements: announcements.map(a => ({
      _id: a._id,
      title: a.title,
      message: a.message,
      createdBy: { firstName: a.createdBy?.firstName || 'Admin' },
      createdAt: a.createdAt
    }))
  };

  return sendSuccess(res, 200, "Dashboard statistics loaded successfully.", { data: stats });
});

export {
  getSuperAdminStats,
  getStudentCountByOrganization,
  getAdminStats,
  getStudentDashboardStats,
  getParentDashboardStats,
  getAttendanceOverview,
  getMentorDashboardStats
};
