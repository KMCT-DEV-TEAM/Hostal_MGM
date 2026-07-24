import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import leaveService from '@/services/leave.service';
import complaintService from '@/services/complaint.service';
import { logApi } from '@/features/dashboard/api/logApi';
import Dropdown from '@/components/ui/Dropdown';
import { Link } from 'react-router-dom';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

import {
    Users,
    AlertTriangle,
    MessageSquare,
    CheckCircle,
    UserMinus,
    Printer,
    UserCheck,
    Mail,
    Building2,
    ShieldCheck,
    GraduationCap,
    House,
    Info,
    Megaphone
} from 'lucide-react';

const COMPLAINT_COLORS = ["#2563EB", "#8B5CF6", "#F59E0B", "#10B981", "#9CA3AF"];

export default function MentorDashboardOverview({ user }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("This Year");
    const [attendancePeriod, setAttendancePeriod] = useState("This Year");
    const [recentActivities, setRecentActivities] = useState([]);

    const defaultComplaintSummary = [
        { name: 'Resolved', count: 0, value: 0, color: COMPLAINT_COLORS[0] },
        { name: 'Pending', count: 0, value: 0, color: COMPLAINT_COLORS[1] },
        { name: 'In progress', count: 0, value: 0, color: COMPLAINT_COLORS[2] }
    ];

    const [complaintData, setComplaintData] = useState(defaultComplaintSummary);
    const [complaintTotal, setComplaintTotal] = useState(0);
    const [dashboardStats, setDashboardStats] = useState({
        wardens: 0, students: 0, parents: 0, pendingComplaints: 0, leaveRequests: 0,
        wardenLastMonthCount: 0, studentLastMonthCount: 0, parentLastMonthCount: 0,
        attendance: { thisYear: [], lastYear: [] },
        batches: [],
        announcements: []
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const { data: stats } = await leaveService.getMentorDashboardStats();

                setDashboardStats({
                    wardens: stats?.wardens || 0,
                    students: stats?.students || 0,
                    parents: stats?.parents || 0,
                    pendingComplaints: stats?.pendingComplaints || 0,
                    leaveRequests: stats?.leaveRequests || 0,
                    wardenLastMonthCount: stats?.wardenLastMonthCount || 0,
                    studentLastMonthCount: stats?.studentLastMonthCount || 0,
                    parentLastMonthCount: stats?.parentLastMonthCount || 0,
                    attendance: stats?.attendance || { thisYear: [], lastYear: [] },
                    batches: stats?.batches || [],
                    announcements: stats?.announcements || []
                });

                if (stats?.recentActivities) {
                    setRecentActivities(stats.recentActivities);
                }

                if (stats?.complaintSummary && stats.complaintSummary.length > 0) {
                    const total = stats.totalComplaints || stats.pendingComplaints || 0;
                    const mapped = stats.complaintSummary.map((cat, index) => ({
                        name: cat.name,
                        count: cat.count,
                        value: cat.value,
                        color: COMPLAINT_COLORS[index % COMPLAINT_COLORS.length]
                    }));
                    setComplaintData(mapped);
                    setComplaintTotal(total);
                } else {
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
                }
            } catch (error) {
                console.error("Error fetching mentor dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F4F6F9]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const kpiCards = [
        {
            label: "TOTAL BATCHES", value: dashboardStats.batches?.length || 0,
            sub: "Assigned Batches",
            icon: <Building2 size={18} />, iconBg: "bg-blue-50", iconColor: "text-blue-600"
        },
        {
            label: "TOTAL STUDENTS", value: dashboardStats.students,
            sub: <><span className="text-[#10B981] font-semibold">+{dashboardStats.studentLastMonthCount || 0}%</span> vs Last Month</>,
            icon: <GraduationCap size={18} />, iconBg: "bg-green-50", iconColor: "text-[#10B981]"
        },
        {
            label: "TOTAL PARENTS", value: dashboardStats.parents,
            sub: "Active Parents",
            icon: <Users size={18} />, iconBg: "bg-[#FDF4FF]", iconColor: "text-[#D946EF]"
        },
        {
            label: "LEAVE REQUESTS", value: dashboardStats.leaveRequests,
            sub: <><span className="text-[#8B5CF6] font-semibold">{dashboardStats.leaveRequests}</span> Pending reviews</>,
            icon: <UserCheck size={18} />, iconBg: "bg-[#F5F3FF]", iconColor: "text-[#8B5CF6]"
        }
    ];

    const quickSummaryData = [
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
        }
    ];

    const currentData = (attendancePeriod === "This Year" ? dashboardStats.attendance?.thisYear : dashboardStats.attendance?.lastYear) || [];
    const validMonths = currentData.filter(d => d.value > 0);
    const avgRate = validMonths.length > 0
        ? Math.round(validMonths.reduce((sum, d) => sum + d.value, 0) / validMonths.length)
        : 88;
    const currentMonthIndex = new Date().getMonth();
    const currentMonthValue = currentData[currentMonthIndex]?.value || 91;
    const lastMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
    const lastMonthValue = currentData[lastMonthIndex]?.value || 89;
    const vsLast = lastMonthValue > 0 ? (((currentMonthValue - lastMonthValue) / lastMonthValue) * 100).toFixed(1) : "2.1";
    const vsLastFormatted = vsLast >= 0 ? `+${vsLast}%` : `${vsLast}%`;

    const monthlyAttendanceData = currentData.length > 0 ? currentData : [
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

    return (
        <div className="min-h-screen bg-[#F8F9FB] font-sans text-sm text-gray-900 pb-[100px]">
            {/* Topbar */}
            <div className="px-4 md:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
                    <p className="text-sm text-gray-500">
                        Welcome back <span className="font-semibold text-gray-900">{user?.firstName || "Mentor"}!</span>, here's what happening today
                    </p>
                </div>
            </div>

            <div className="px-4 md:px-8 flex flex-col gap-6">
                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

                {/* Attendance + Quick Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
                    {/* Attendance Analytics */}
                    <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-[16px] font-bold text-gray-900">Attendance Overview</h2>
                                <p className="text-xs text-gray-400 mt-1">Overall attendance percentage across organization.</p>
                            </div>
                            <div className="relative min-w-[120px]">
                                <Dropdown
                                    options={[
                                        { value: "This Year", label: "This Year" },
                                        { value: "Last Year", label: "Last Year" }
                                    ]}
                                    value={attendancePeriod}
                                    onChange={(val) => setAttendancePeriod(val)}
                                    triggerClassName="px-3 py-1.5 text-xs font-medium text-start rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors cursor-pointer w-full flex justify-between items-center"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mb-8">
                            <div className="bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-5 py-3 min-w-[90px] text-center">
                                <div className="text-[#2D7CC3] font-bold text-sm">{avgRate}%</div>
                                <div className="text-xs text-[#8F8F8F] mt-1">Avg Rate</div>
                            </div>
                            <div className="bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-5 py-3 min-w-[90px] text-center">
                                <div className="text-[#0F6E56] font-bold text-sm">{currentMonthValue}%</div>
                                <div className="text-xs text-[#8F8F8F] mt-1">Current Month</div>
                            </div>
                            <div className="bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-5 py-3 min-w-[90px] text-center">
                                <div className="text-[#0F6E56] font-bold text-sm">{vsLastFormatted}</div>
                                <div className="text-xs text-[#8F8F8F] mt-1">vs Last</div>
                            </div>
                        </div>

                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={monthlyAttendanceData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="attendanceGradientMentor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0A467F" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#0A467F" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="#EEF1F4" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                                <Tooltip formatter={(value) => [`${value}%`, "Attendance"]} cursor={{ fill: "#F3F4F6" }} />
                                <Area type="monotone" dataKey="value" stroke="#0A467F" strokeWidth={3} fill="url(#attendanceGradientMentor)" dot={false} activeDot={{ r: 5, fill: "#0A467F" }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quick Summary */}
                    <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm flex flex-col">
                        <h2 className="text-[16px] font-bold text-gray-900">Quick Summary</h2>
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

                {/* Batches + Recent Activities */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Managed Batches */}
                    <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-[16px] font-bold text-gray-900">Managed Batches</h2>
                                <p className="text-xs text-gray-400 mt-1">Batches assigned under your mentorship</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            {dashboardStats.batches && dashboardStats.batches.length > 0 ? (
                                dashboardStats.batches.map((batch, i) => (
                                    <div key={i} className="flex items-center justify-between p-3.5 bg-[#F9FAFB] rounded-[12px]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                {batch.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-800">{batch.name}</h4>
                                                <p className="text-xs text-gray-400 mt-0.5">Code: {batch.code}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400">No batches assigned</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-[16px] font-bold text-gray-900">Recent Activities</h2>
                                <p className="text-xs text-gray-400 mt-1">Latest action across the system</p>
                            </div>
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
                        </div>
                    </div>
                </div>

                {/* Announcements Section */}
                <div className="flex flex-col mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-[16px] font-bold text-gray-900">Recent Announcements</h2>
                            <p className="text-xs text-gray-400 mt-1">Important updates and notifications</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dashboardStats.announcements && dashboardStats.announcements.length > 0 ? (
                            dashboardStats.announcements.map((ann, i) => (
                                <div key={i} className="bg-white rounded-[12px] p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2.5">
                                            <div className="w-8 h-8 rounded-[10px] bg-[#EEF2F6] flex items-center justify-center flex-shrink-0">
                                                <Megaphone className="w-4 h-4 text-[#2D7CC3]" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-black leading-snug">
                                                    {ann.title}
                                                </h3>
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    Posted by {ann.createdBy?.firstName || 'Admin'}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                            {ann.message}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-[12px] p-4 border border-gray-100 shadow-sm col-span-2 flex flex-col items-center justify-center py-6 text-gray-400">
                                <Megaphone className="mb-1 text-gray-200" size={24} />
                                <p className="text-sm">No announcements posted yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
