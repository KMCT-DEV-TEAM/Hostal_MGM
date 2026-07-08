import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';
import adminService from "@/services/admin.service";
import complaintService from "@/services/complaint.service";
import { logApi } from "@/features/dashboard/api/logApi";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

import {
    Users,
    AlertTriangle,
    MessageSquare,
    CheckCircle,
    UserMinus,
    Printer,
    UserCheck,
    Mail
} from 'lucide-react';

const COMPLAINT_COLORS = ["#2563EB", "#8B5CF6", "#F59E0B", "#10B981", "#9CA3AF"];

const monthlyAttendanceData = [
    { month: "Jan", value: 70 },
    { month: "Feb", value: 70 },
    { month: "Mar", value: 90 },
    { month: "Apr", value: 95 },
    { month: "May", value: 75 },
    { month: "Jun", value: 72 },
    { month: "July", value: 50 },
    { month: "Aug", value: 52 },
    { month: "Sep", value: 65 },
    { month: "Oct", value: 63 },
    { month: "Nov", value: 55 },
    { month: "Dec", value: 48 },
];

export default function AdminDashboard() {
    const { user } = useAuthStore();
    const { t } = useTranslation();

    const [dashboardStats, setDashboardStats] = useState({
        wardens: 0, students: 0, parents: 0, pendingComplaints: 0, leaveRequests: 0,
        wardenLastMonthCount: 0, studentLastMonthCount: 0, parentLastMonthCount: 0
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [complaintData, setComplaintData] = useState([]);
    const [complaintTotal, setComplaintTotal] = useState(0);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: stats } = await adminService.getDashboardStats();
                setDashboardStats({
                    wardens: stats?.wardens || 0,
                    students: stats?.students || 0,
                    parents: stats?.parents || 0,
                    pendingComplaints: stats?.pendingComplaints || 0,
                    leaveRequests: stats?.leaveRequests || 0,
                    wardenLastMonthCount: stats?.wardenLastMonthCount || 0,
                    studentLastMonthCount: stats?.studentLastMonthCount || 0,
                    parentLastMonthCount: stats?.parentLastMonthCount || 0
                });
            } catch (error) {
                console.error("Error fetching admin stats", error);
            }
        };

        const fetchActivities = async () => {
            try {
                const res = await logApi.getLogs({ page: 1, limit: 5 });
                const responseData = res.data?.data || res.data;
                setRecentActivities(responseData.logs || []);
            } catch (error) {
                console.error("Failed to fetch recent activities", error);
            }
        };

        const fetchComplaintSummary = async () => {
            try {
                const res = await complaintService.getComplaintSummary();
                if (res.success && res.data) {
                    const total = res.data.total;
                    const categories = res.data.categories.map((cat, index) => ({
                        name: cat.name,
                        count: cat.count,
                        value: total > 0 ? Math.round((cat.count / total) * 100) : 0,
                        color: COMPLAINT_COLORS[index % COMPLAINT_COLORS.length]
                    }));
                    setComplaintData(categories);
                    setComplaintTotal(total);
                }
            } catch (error) {
                console.error("Failed to fetch complaint summary", error);
            }
        };

        fetchStats();
        fetchActivities();
        fetchComplaintSummary();
    }, []);

    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        if (diffInSeconds < 60) return 'Just now';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    const kpiCards = [
        {
            label: "TOTAL STUDENTS", value: dashboardStats.students,
            sub: <><span className="text-[#10B981] font-semibold">+{dashboardStats.studentLastMonthCount || 0}%</span> vs Last Month</>,
            icon: <Printer size={18} />, iconBg: "bg-[#ECFDF5]", iconColor: "text-[#10B981]"
        },
        {
            label: "TOTAL WARDENS", value: dashboardStats.wardens,
            sub: "Active Wardens",
            icon: <UserMinus size={18} />, iconBg: "bg-[#EFF6FF]", iconColor: "text-[#3B82F6]"
        },
        {
            label: "TOTAL PARENTS", value: dashboardStats.parents,
            sub: "Active Parents",
            icon: <Users size={18} />, iconBg: "bg-[#FDF4FF]", iconColor: "text-[#D946EF]"
        },
        {
            label: "PENDING COMPLAINTS", value: dashboardStats.pendingComplaints,
            sub: <><span className="text-[#F59E0B] font-semibold">{dashboardStats.pendingComplaints}</span> From yesterday</>,
            icon: <AlertTriangle size={18} />, iconBg: "bg-[#FFFBEB]", iconColor: "text-[#F59E0B]"
        },
        {
            label: "LEAVE REQUESTS", value: dashboardStats.leaveRequests,
            sub: <><span className="text-[#8B5CF6] font-semibold">{dashboardStats.leaveRequests}</span> Pending reviews</>,
            icon: <UserCheck size={18} />, iconBg: "bg-[#F5F3FF]", iconColor: "text-[#8B5CF6]"
        }
    ];

    const quickSummaryData = [
        {
            title: "Complaint Status",
            sub1: `${dashboardStats.pendingComplaints} Open`,
            sub2: "5 High Priority",
            icon: <AlertTriangle size={18} />, iconBg: "bg-[#FFFBEB]", iconColor: "text-[#F59E0B]", sub2Color: "text-[#EF4444]"
        },
        {
            title: "Leaves Approved",
            sub1: "5 this week",
            sub2: `${dashboardStats.leaveRequests} Pending Review`,
            icon: <CheckCircle size={18} />, iconBg: "bg-[#ECFDF5]", iconColor: "text-[#10B981]", sub2Color: "text-[#F59E0B]"
        },
        {
            title: "Parent Message",
            sub1: "14 Unread",
            sub2: "5 Urgent",
            icon: <Mail size={18} />, iconBg: "bg-[#FDF4FF]", iconColor: "text-[#D946EF]", sub2Color: "text-[#EF4444]"
        },
        {
            title: "Inactive Wardens",
            sub1: "4",
            sub2: "",
            icon: <UserMinus size={18} />, iconBg: "bg-[#F5F3FF]", iconColor: "text-[#8B5CF6]", sub2Color: ""
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FB] font-sans text-sm text-gray-900 pb-[100px]">
            {/* Topbar */}
            <div className="px-4 md:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
                    <p className="text-sm text-gray-500">
                        Welcome back <span className="font-semibold text-gray-900">{user?.name?.split(' ')[0] || "User"}!</span>, here's what happening today
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2.5 rounded-lg bg-[#0F4A8A] text-white font-medium text-sm hover:bg-[#0c3a6d] transition-colors shadow-sm flex items-center">
                        + Add Announcement
                    </button>
                    <button className="px-4 py-2.5 rounded-lg bg-[#0F4A8A] text-white font-medium text-sm hover:bg-[#0c3a6d] transition-colors shadow-sm flex items-center">
                        + Add Student
                    </button>
                </div>
            </div>

            <div className="px-4 md:px-8 flex flex-col gap-6">
                {/* 5 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {kpiCards.map((c, index) => (
                        <div key={index} className="bg-white rounded-[16px] p-5 border border-gray-100 shadow-sm flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[11px] font-semibold text-gray-500 tracking-wider">
                                    {c.label}
                                </span>
                                <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center flex-shrink-0 ${c.iconColor}`}>
                                    {c.icon}
                                </div>
                            </div>
                            <div className="mt-auto">
                                <div className="text-[28px] font-bold text-gray-900 leading-none mb-2">
                                    {c.value}
                                </div>
                                <div className="text-[12px] text-gray-400">
                                    {c.sub}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Row 2: Attendance + Quick Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
                    {/* Attendance Analytics */}
                    <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-[16px] font-bold text-gray-900">Attendance Overview</h2>
                                <p className="text-xs text-gray-400 mt-1">Overall attendance percentage across organizations.</p>
                            </div>
                            <select className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-500 outline-none bg-[#F8F8F8] ">
                                <option>This Year</option>
                                <option>Last Year</option>
                            </select>
                        </div>

                        <div className="flex gap-3 mb-8">
                            <div className="bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-5 py-3 min-w-[90px] text-center">
                                <div className="text-[#2D7CC3] font-bold text-sm">91.2%</div>
                                <div className="text-xs text-[#8F8F8F] mt-1">Avg Rate</div>
                            </div>
                            <div className="bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-5 py-3 min-w-[90px] text-center">
                                <div className="text-[#0F6E56] font-bold text-sm">95.8%</div>
                                <div className="text-xs text-[#8F8F8F] mt-1">Current Month</div>
                            </div>
                            <div className="bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-5 py-3 min-w-[90px] text-center">
                                <div className="text-[#0F6E56] font-bold text-sm">+2.3%</div>
                                <div className="text-xs text-[#8F8F8F] mt-1">vs Last</div>
                            </div>
                        </div>

                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={monthlyAttendanceData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="attendanceGradientAdmin" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0A467F" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#0A467F" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="#EEF1F4" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                                <Tooltip formatter={(value) => [`${value}%`, "Attendance"]} cursor={{ fill: "#F3F4F6" }} />
                                <Area type="monotone" dataKey="value" stroke="#0A467F" strokeWidth={3} fill="url(#attendanceGradientAdmin)" dot={false} activeDot={{ r: 5, fill: "#0A467F" }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quick Summary */}
                    <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm flex flex-col">
                        <h2 className="text-[16px] font-bold text-gray-900">Quick Summery</h2>
                        <p className="text-xs text-gray-400 mt-1 mb-5">Today at glance</p>

                        <div className="grid grid-cols-1 gap-3 flex-1">
                            {quickSummaryData.map((item, i) => (
                                <div key={i} className="bg-[#F9FAFB] rounded-[12px] p-4 flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-[10px] ${item.iconBg} flex items-center justify-center flex-shrink-0 ${item.iconColor}`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>
                                        <div className="flex gap-2 text-[12px] mt-1 items-center text-gray-500">
                                            <span className="font-semibold text-gray-900">{item.sub1}</span>
                                            {item.sub2 && (
                                                <span className={`${item.sub2Color} font-medium`}>{item.sub2}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Row 3: Complaint Summary + Recent Activities */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Complaint Summary */}
                    <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-[16px] font-bold text-gray-900">Complaint Summary</h2>
                            <div className="flex items-center gap-2 bg-[#F9FAFB] border border-gray-100 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600">
                                This Month
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mt-4">
                            <div className="relative">
                                <PieChart width={220} height={220}>
                                    <Pie
                                        data={complaintData.length ? complaintData : [{ value: 1, color: '#F3F4F6' }]}
                                        cx={105}
                                        cy={105}
                                        innerRadius={70}
                                        outerRadius={105}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                        stroke="none"
                                    >
                                        {complaintData.length ? complaintData.map((e, i) => (
                                            <Cell key={i} fill={e.color} />
                                        )) : <Cell fill="#F3F4F6" />}
                                    </Pie>
                                </PieChart>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
                                    <span className="text-3xl font-bold text-gray-900">{complaintTotal}</span>
                                    <span className="text-[11px] font-medium text-gray-500 mt-1">Total Complaints</span>
                                </div>
                            </div>
                            
                            {/* Legends */}
                            <div className="flex flex-col gap-3 min-w-[150px]">
                                {complaintData.map((cat, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                            <span className="text-xs font-medium text-gray-700">{cat.name}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 font-semibold">
                                            {cat.value}% <span className="text-gray-400 font-normal">({cat.count})</span>
                                        </div>
                                    </div>
                                ))}
                                {complaintData.length === 0 && (
                                    <div className="text-xs text-gray-400">No complaints found.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-[16px] font-bold text-gray-900">Recent Activities</h2>
                                <p className="text-xs text-gray-400 mt-1">Latest action across the system</p>
                            </div>
                            <button className="text-sm font-medium text-gray-500 hover:text-gray-700">View all</button>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            {recentActivities.map((log, i) => {
                                let iconBg = "bg-[#EFF6FF]";
                                let iconColor = "text-[#3B82F6]";
                                let badgeColor = "bg-[#DBEAFE] text-[#1E40AF]";
                                let badgeText = "New";

                                if (log.action.toLowerCase().includes('leave')) {
                                    iconBg = "bg-[#ECFDF5]";
                                    iconColor = "text-[#10B981]";
                                    badgeColor = "bg-[#D1FAE5] text-[#065F46]";
                                    badgeText = "Approved";
                                } else if (log.action.toLowerCase().includes('complaint')) {
                                    iconBg = "bg-[#FFFBEB]";
                                    iconColor = "text-[#F59E0B]";
                                    badgeColor = "bg-[#FEF3C7] text-[#92400E]";
                                    badgeText = "Open";
                                }

                                return (
                                    <div key={i} className="flex items-center justify-between p-3.5 bg-[#F9FAFB] rounded-[12px]">
                                        <div className="flex items-center gap-3.5">
                                            <div className={`w-8 h-8 rounded-[8px] ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0`}>
                                                {log.action.toLowerCase().includes('leave') ? <CheckCircle size={16} /> : 
                                                 log.action.toLowerCase().includes('complaint') ? <AlertTriangle size={16} /> : 
                                                 <Mail size={16} />}
                                            </div>
                                            <div>
                                                <p className="text-[13px] text-gray-800 font-medium">
                                                    {log.action} <span className={`text-[10px] px-1.5 py-0.5 ml-1.5 rounded-full font-semibold ${badgeColor}`}>{badgeText}</span>
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    By {log.user?.name || log.user?.email || 'System'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
                                            {formatRelativeTime(log.createdAt)}
                                        </div>
                                    </div>
                                );
                            })}
                            {recentActivities.length === 0 && (
                                <div className="text-center py-8 text-sm text-gray-500">No recent activities found.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
