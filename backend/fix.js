const fs = require("fs");
const path = "d:\\KMCT\\Projects\\Hostal_MGM\\backend\\src\\modules\\dashboard\\dashboard.controller.js";
let content = fs.readFileSync(path, "utf8");

const marker = "  const pendingLeaveRequestsCount = await Pass.countDocuments({";
const index = content.indexOf(marker);

if (index !== -1) {
  content = content.substring(0, index) + marker + `
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

export {
  getSuperAdminStats,
  getStudentCountByOrganization,
  getAdminStats,
  getStudentDashboardStats,
  getParentDashboardStats,
  getAttendanceOverview
};
\`;
  fs.writeFileSync(path, content, "utf8");
}
