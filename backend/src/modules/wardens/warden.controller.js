import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { getAggregateOrganizationDataDb } from "../organizations/organization.service.js";
import User from "../users/user.model.js";
import Organization from "../organizations/organization.model.js";
import Hostel from "../hostels/hostel.model.js";
import Student from "../students/student.model.js";
import Complaint from "../complaints/complaint.model.js";
import Pass from "../passes/pass.model.js";
import { AttendanceWindow } from "../attendance/attendance.model.js";
import VisitorVisit from "../visitor/visitorVisit.model.js";
const getOrganizationData = asyncHandler(async (req, res) => {
  // Warden gets all organizations according to API 1
  const data = await getAggregateOrganizationDataDb(null);

  if (!data || data.length === 0) {
    return sendError(res, 404, "Organization data not found");
  }

  return sendSuccess(res, 200, "Organization data fetched successfully", {
    data: data
  });
});

const getWardenStats = asyncHandler(async (req, res) => {
  const [organizationCount, studentCount] = await Promise.all([
    Organization.countDocuments(),
    User.countDocuments({ role: "student" }),
  ]);

  return sendSuccess(res, 200, "Warden stats fetched successfully", {
    data: {
      organizations: organizationCount,
      students: studentCount,
    },
  });
});

const getWardenDashboardSummary = asyncHandler(async (req, res) => {
  const wardenId = req.user.id;

  // 1. Get the hostel assigned to the warden
  const hostel = await Hostel.findOne({ wardens: wardenId, isActive: true }).lean();
  
  if (!hostel) {
    return sendError(res, 404, "No active hostel assigned to this warden.");
  }

  const hostelId = hostel._id;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  // 2. Fetch basic counts concurrently
  const [
    totalStudents,
    pendingComplaints,
    leaveRequests,
    todaysAttendance,
    highPriorityComplaints,
    leavesApprovedThisWeek,
    visitorsToday
  ] = await Promise.all([
    Student.countDocuments({ hostelId, hostelStatus: "active" }),
    Complaint.countDocuments({ hostelId: hostelId, status: { $in: ["Pending", "In progress", "Awaiting"] } }),
    Pass.countDocuments({ hostelId: hostelId, status: { $in: ["pending_parent", "pending_admin"] } }),
    AttendanceWindow.findOne({ hostelId: hostelId, attendanceDate: { $gte: todayStart, $lte: todayEnd } }).lean(),
    Complaint.countDocuments({ hostelId: hostelId, status: { $in: ["Pending", "In progress", "Awaiting"] }, priority: "High" }),
    Pass.countDocuments({ hostelId: hostelId, status: "approved", "adminApproval.actionAt": { $gte: weekStart } }),
    VisitorVisit.countDocuments({ hostelId: hostelId, checkInTime: { $gte: todayStart, $lte: todayEnd } })
  ]);

  const presentToday = todaysAttendance ? todaysAttendance.presentCount : 0;
  const absentToday = todaysAttendance ? todaysAttendance.absentCount : 0;

  const totalComplaints = await Complaint.countDocuments({ hostelId: hostelId });

  const complaintStats = await Complaint.aggregate([
    { $match: { hostelId: hostelId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        name: "$_id",
        count: 1
      }
    }
  ]);

  const complaintSummary = complaintStats.map(stat => ({
    name: stat.name,
    count: stat.count,
    value: totalComplaints > 0 ? Math.round((stat.count / totalComplaints) * 100) : 0
  }));

  const recentComplaints = await Complaint.find({ hostelId: hostelId })
    .sort({ createdAt: -1 })
    .limit(4)
    .populate("studentId", "name")
    .lean();
    
  const recentPasses = await Pass.find({ hostelId: hostelId })
    .sort({ createdAt: -1 })
    .limit(4)
    .populate("studentId", "name")
    .lean();

  const recentActivities = [
    ...recentComplaints.map(c => ({
      _id: c._id,
      action: `Complaint filed - Room ${c.roomNo}: ${c.subject}`,
      performedBy: { name: c.studentId?.name || 'Student' },
      performedByModel: 'User',
      createdAt: c.createdAt
    })),
    ...recentPasses.map(p => ({
      _id: p._id,
      action: `Leave Request from ${p.studentId?.name || 'Student'}`,
      performedBy: { name: p.studentId?.name || 'Student' },
      performedByModel: 'User',
      createdAt: p.createdAt
    }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  twoWeeksAgo.setHours(0, 0, 0, 0);

  const attendanceHistory = await AttendanceWindow.find({
    hostelId: hostelId,
    attendanceDate: { $gte: twoWeeksAgo }
  })
  .select('attendanceDate presentCount totalStudents')
  .sort({ attendanceDate: 1 })
  .lean();

  // 3. Generate Mock/Derived stats for the dashboard structure
  const data = {
    totalStudents,
    presentToday,
    absentToday,
    pendingComplaints,
    totalComplaints,
    leaveRequests,
    recentActivities,
    attendanceHistory,
    
    messAttendance: { value: presentToday, total: totalStudents },
    complaintStatus: { open: pendingComplaints, highPriority: highPriorityComplaints },
    leavesApproved: { thisWeek: leavesApprovedThisWeek, pending: leaveRequests },
    parentMessage: { unread: visitorsToday, urgent: 0 }, // Reusing this slot for Visitors Today in frontend
    
    complaintSummary: complaintSummary.length > 0 ? complaintSummary : [
      { name: 'Maintainance', value: 40, color: '#3B82F6' },
      { name: 'Mess / Food', value: 25, color: '#A855F7' },
      { name: 'Roommate', value: 15, color: '#F59E0B' },
      { name: 'Wifi Network', value: 10, color: '#10B981' },
      { name: 'Other', value: 10, color: '#9CA3AF' }
    ]
  };

  return sendSuccess(res, 200, "Warden dashboard summary fetched successfully", { data });
});


const getWardenByAdmin = asyncHandler(async (req, res) => {
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

  const wardens = await User.find({
    role: "warden",
    organization: admin.organization,
  })
    .lean();

  return sendSuccess(res, 200, "Warden fetched successfully", {
    data: {
      wardens,
    },
  });


})

export {
  getOrganizationData,
  getWardenStats,
  getWardenDashboardSummary,
  getWardenByAdmin
};
