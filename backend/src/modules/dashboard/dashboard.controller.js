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
import { AttendanceRecord } from "../attendance/attendance.model.js";
import mongoose from "mongoose";

const getSuperAdminStats = asyncHandler(async (req, res) => {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
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
      },
    }
  );
});

const getStudentCountByOrganization = asyncHandler(async (req, res) => {
  const stats = await Student.aggregate([
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
    },
  ]);

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

    const [
    wardens,
    students,
    parents,
    wardenLastMonthCount,
    studentLastMonthCount,
    parentLastMonthCount,
    pendingComplaintsCount,
    leaveRequestsCount
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
  ]);


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
      },
    }
  );
});


const getStudentDashboardStats = asyncHandler(async (req, res) => {
  const studentId = req.user.id;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const attendanceRecords = await AttendanceRecord.find({
    studentId,
    createdAt: { $gte: startOfMonth }
  });

  let presentCount = 0;
  let totalDays = attendanceRecords.length;
  attendanceRecords.forEach(record => {
    if (record.status === "present") presentCount++;
  });
  const attendanceRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

  const monthlyStats = await AttendanceRecord.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
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

  return sendSuccess(res, 200, "Student dashboard stats fetched successfully", {
    data: {
      attendanceRate,
      presentCount,
      totalDays,
      openComplaintsCount,
      pendingLeaveRequestsCount,
      recentComplaints,
      recentLeaveRequests,
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

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const attendanceRecords = await AttendanceRecord.find({
    studentId,
    createdAt: { $gte: startOfMonth }
  });

  let presentCount = 0;
  let totalDays = attendanceRecords.length;
  attendanceRecords.forEach(record => {
    if (record.status === "present") presentCount++;
  });
  const attendanceRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

  const monthlyStats = await AttendanceRecord.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
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

  const recentVisitors = await Visitor.find({ students: studentId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentLeaveRequests = await Pass.find({ studentId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return sendSuccess(res, 200, "Parent dashboard stats fetched successfully", {
    data: {
      attendanceRate,
      presentCount,
      totalDays,
      pendingVisitorsCount,
      pendingLeaveRequestsCount,
      recentVisitors,
      recentLeaveRequests,
      monthlyAttendance
    }
  });
});

export {
  getSuperAdminStats,
  getStudentCountByOrganization,
  getAdminStats,
  getStudentDashboardStats,
  getParentDashboardStats
};
