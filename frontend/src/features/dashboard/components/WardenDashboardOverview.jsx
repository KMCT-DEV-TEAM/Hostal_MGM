import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CalendarCheck, CalendarMinus, AlertTriangle, UserMinus, Calendar, MessageSquare, ClipboardCheck, Clock, ClipboardList, UserCheck, CheckCircle, XCircle, Info } from 'lucide-react';
import wardenService from '@/services/warden.service';
import { logApi } from '@/features/dashboard/api/logApi';
import Dropdown from '@/components/ui/Dropdown';

export default function WardenDashboardOverview({ user }) {
    const [stats, setStats] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('This Week');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch warden summary stats (which now includes recentActivities)
                const { data } = await wardenService.getWardenDashboardStats();
                setStats(data);
                
                // Set recent activities directly from the warden summary
                setRecentActivities(data.recentActivities || []);
                
            } catch (error) {
                console.error("Failed to fetch warden dashboard data:", error);
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

    const totalStudents = stats?.totalStudents ?? 3000;
    const presentToday = stats?.presentToday ?? 2050;
    const absentToday = stats?.absentToday ?? 50;
    const pendingComplaints = stats?.pendingComplaints ?? 12;
    const leaveRequests = stats?.leaveRequests ?? 10;

    const attendanceRate = stats?.totalStudents ? ((stats.presentToday / stats.totalStudents) * 100).toFixed(1) : "88.3";
    const absenceRate = stats?.totalStudents ? ((stats.absentToday / stats.totalStudents) * 100).toFixed(1) : "11.7";

    const statCards = [
        {
            label: "TOTAL STUDENTS",
            value: totalStudents,
            sub: "↑ 12% vs Last Month",
            icon: <Users size={18} className="text-[#2D7CC3]" />,
            iconBg: "bg-blue-50"
        },
        {
            label: "PRESENT TODAY",
            value: presentToday,
            sub: `${attendanceRate}% Attendance rate`,
            icon: <CalendarCheck size={18} className="text-primary" />,
            iconBg: "bg-indigo-50"
        },
        {
            label: "ABSENT TODAY",
            value: absentToday,
            sub: `${absenceRate}% Absence rate`,
            icon: <CalendarMinus size={18} className="text-[#9747FF]" />,
            iconBg: "bg-violet-50"
        },
        {
            label: "PENDING COMPLAINTS",
            value: pendingComplaints,
            sub: `${Math.max(0, pendingComplaints - 9)} From yesterday`,
            icon: <AlertTriangle size={18} className="text-[#446015]" />,
            iconBg: "bg-green-50"
        },
        {
            label: "LEAVE REQUESTS",
            value: leaveRequests,
            sub: `${stats?.leavesApproved?.pending ?? 2} Pending reviews`,
            icon: <UserMinus size={18} className="text-[#14B8A6]" />,
            iconBg: "bg-teal-50"
        }
    ];

    const generateChartData = (range) => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dataMap = new Map();
        
        days.forEach(day => dataMap.set(day, 0));

        if (!stats?.attendanceHistory) {
             return days.map(day => ({ name: day, value: 0 }));
        }

        const today = new Date();
        const currentDayOfWeek = today.getDay() || 7; 
        
        let startDate = new Date(today);
        let endDate = new Date(today);

        if (range === 'This Week') {
            startDate.setDate(today.getDate() - currentDayOfWeek + 1);
            startDate.setHours(0,0,0,0);
            endDate.setDate(today.getDate() - currentDayOfWeek + 7);
            endDate.setHours(23,59,59,999);
        } else {
            startDate.setDate(today.getDate() - currentDayOfWeek - 6);
            startDate.setHours(0,0,0,0);
            endDate.setDate(today.getDate() - currentDayOfWeek);
            endDate.setHours(23,59,59,999);
        }

        stats.attendanceHistory.forEach(record => {
            const recordDate = new Date(record.attendanceDate);
            if (recordDate >= startDate && recordDate <= endDate) {
                const dayIndex = recordDate.getDay() || 7;
                const dayName = days[dayIndex - 1];
                const percentage = record.totalStudents > 0 
                    ? Math.round((record.presentCount / record.totalStudents) * 100) 
                    : 0;
                
                // Keep the highest percentage if there are multiple windows in a single day
                dataMap.set(dayName, Math.max(dataMap.get(dayName) || 0, percentage));
            }
        });

        return days.map(day => ({ name: day, value: dataMap.get(day) }));
    };

    const currentChartData = generateChartData(timeRange);
    const validValues = currentChartData.filter(d => d.value > 0).map(d => d.value);
    const avgRate = validValues.length > 0 ? Math.round(validValues.reduce((a, b) => a + b, 0) / validValues.length) : 0;
    const peakDay = validValues.length > 0 ? Math.max(...validValues) : 0;
    const lowest = validValues.length > 0 ? Math.min(...validValues) : 0;

    const COMPLAINT_COLORS = ["#0A467F", "#9D77CE", "#F8BA52", "#55CDA6", "#A6A6A6", "#FF6B6B"];
    const defaultComplaintSummary = [
        { name: 'Maintainance', count: 499, value: 40, color: COMPLAINT_COLORS[0] },
        { name: 'Mess / Food', count: 312, value: 25, color: COMPLAINT_COLORS[1] },
        { name: 'Roommate', count: 187, value: 15, color: COMPLAINT_COLORS[2] },
        { name: 'Wifi Network', count: 125, value: 10, color: COMPLAINT_COLORS[3] },
        { name: 'Other', count: 125, value: 10, color: COMPLAINT_COLORS[4] }
    ];
    
    let complaintSummaryData = defaultComplaintSummary;
    let complaintTotal = 50;
    
    if (stats?.complaintSummary?.length > 0) {
        complaintTotal = stats.totalComplaints ?? stats.pendingComplaints ?? 50;
        complaintSummaryData = stats.complaintSummary.map((cat, index) => ({
            name: cat.name,
            count: cat.count || Math.floor(complaintTotal * cat.value / 100),
            value: cat.value,
            color: COMPLAINT_COLORS[index % COMPLAINT_COLORS.length]
        }));
    }

    const quickSummary = [
        {
            icon: Calendar,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            title: "Today's Attendance",
            desc: `${presentToday} / ${totalStudents}`,
            descClass: "text-primary",
        },
        {
            icon: AlertTriangle,
            iconBg: "bg-danger/10",
            iconColor: "text-danger",
            title: "Complaint Status",
            desc: `${stats?.complaintStatus?.open ?? 0} Open, ${stats?.complaintStatus?.highPriority ?? 0} High Priority`,
            descClass: "text-danger",
        },
        {
            icon: UserCheck,
            iconBg: "bg-success/10",
            iconColor: "text-success",
            title: "Leaves Approved",
            desc: `${stats?.leavesApproved?.thisWeek ?? 0} this week`,
            descClass: "text-success",
        },
        {
            icon: Users,
            iconBg: "bg-warning/10",
            iconColor: "text-warning",
            title: "Today's Visitors",
            desc: `${stats?.parentMessage?.unread ?? 0} Checked In`,
            descClass: "text-warning",
        },
    ];

    return (
        <div className="min-h-screen bg-[#F4F6F9] font-sans text-sm text-gray-900">
            {/* Topbar */}
            <div className="px-4 md:px-7 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Left Section */}
                <div>
                    <h1 className="text-2xl font-bold text-black mb-1">
                        Dashboard
                    </h1>

                    <p className="text-sm text-gray-500">
                        Welcome back{" "}
                        <span className="text-primary font-semibold">{user?.firstName || 'Warden'}</span>, here's
                        what's happening today
                    </p>
                </div>
            </div>

            <div className="p-6 md:p-8 flex flex-col gap-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {statCards.map((c, index) => {
                        const borderColors = [
                            "border-t-[#2D7CC3]", // 1st box
                            "border-t-[#0A467F]", // 2nd box
                            "border-t-[#9747FF]", // 3rd box
                            "border-t-[#446015]", // 4th box
                            "border-t-[#14B8A6]", // 5th box
                        ];

                        return (
                            <div
                                key={c.label}
                                className={`bg-white rounded-xl p-5 border border-gray-100 border-t-2 ${borderColors[index]} ${index === 0 ? 'col-span-2 sm:col-span-1' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-xs text-gray-500 font-medium leading-tight uppercase tracking-wider">
                                        {c.label}
                                    </span>

                                    <div
                                        className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center text-sm flex-shrink-0`}
                                    >
                                        {c.icon}
                                    </div>
                                </div>

                                <div className="text-[24px] font-semibold tracking-tight mt-2 mb-1">
                                    {c.value}
                                </div>

                                <div className="text-[12px] text-[#9CA3AF]">{c.sub}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Middle Row (Attendance Area Chart + Quick Summary) */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                    {/* Attendance Area Chart */}
                    <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-[20px] font-bold text-black">
                                    Attendance Overview
                                </h2>
                                <p className="text-sm text-[#8F8F8F] mt-1">
                                    Overall attendance percentage of {timeRange.toLowerCase()}.
                                </p>
                            </div>
                            <div className="relative min-w-[120px]">
                                <Dropdown
                                    options={[
                                        { value: 'This Week', label: 'This Week' },
                                        { value: 'Last Week', label: 'Last Week' }
                                    ]}
                                    value={timeRange}
                                    onChange={(val) => setTimeRange(val)}
                                    triggerClassName="px-3 py-1.5 text-xs font-medium text-start rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors cursor-pointer w-full flex justify-between items-center"
                                />
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 mb-8">
                            <div className="flex-1 bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-4 py-3 min-w-[90px] text-center">
                                <div className="text-[#2D7CC3] font-bold text-sm">{avgRate}%</div>
                                <div className="text-xs text-[#8F8F8F] mt-1">Avg Rate</div>
                            </div>
                            <div className="flex-1 bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-4 py-3 min-w-[90px] text-center">
                                <div className="text-[#0F6E56] font-bold text-sm">{peakDay}%</div>
                                <div className="text-xs text-[#8F8F8F] mt-1">Peak Day</div>
                            </div>
                            <div className="flex-1 bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-4 py-3 min-w-[90px] text-center">
                                <div className="text-[#EF4444] font-bold text-sm">{lowest}%</div>
                                <div className="text-xs text-[#8F8F8F] mt-1">Lowest</div>
                            </div>
                        </div>

                        <div className="h-[220px] w-full min-w-0">
                            {currentChartData.some(d => d.value > 0) ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={currentChartData}
                                        margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0A467F" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#0A467F" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid
                                            vertical={false}
                                            stroke="#EEF1F4"
                                        />

                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#9CA3AF", fontSize: 12 }}
                                        />

                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            domain={[0, 100]}
                                            ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                                            tickFormatter={(v) => `${v}%`}
                                            tick={{ fill: "#9CA3AF", fontSize: 12 }}
                                        />

                                        <RechartsTooltip formatter={(value) => [`${value}%`, "Attendance"]} />

                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#0A467F"
                                            strokeWidth={3}
                                            fill="url(#attendanceGradient)"
                                            dot={false}
                                            activeDot={{
                                                r: 5,
                                                fill: "#0A467F",
                                            }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <p className="text-sm">No data found in this date period</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Summary */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                        <h2 className="text-sm font-bold text-[#000000]">Quick Summary</h2>
                        <p className="text-xs text-[#777777] mt-0.5 mb-2">Today at a glance</p>
                        
                        {quickSummary.map((item, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-3 py-3 ${i < quickSummary.length - 1 ? "border-b border-gray-50" : ""}`}
                            >
                                <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#777777]">{item.title}</p>
                                    <p className={`text-xs font-medium mt-0.5 ${item.descClass}`}>
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Row (Complaint Summary + Recent Activities) */}
                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
                    {/* Complaint Pie Chart */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        <h2 className="text-sm font-bold text-[#000000] mb-5">
                            Complaint Summary
                        </h2>
                        {complaintSummaryData.length > 0 ? (
                            <div className="flex flex-col items-center justify-center gap-6">
                                <PieChart width={190} height={190}>
                                    <Pie
                                        data={complaintSummaryData}
                                        cx={90}
                                        cy={90}
                                        innerRadius={58}
                                        outerRadius={88}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                        labelLine={false}
                                        stroke="none"
                                    >
                                        {complaintSummaryData.map((e, i) => (
                                            <Cell key={i} fill={e.color} />
                                        ))}
                                    </Pie>
                                    <text
                                        x={90}
                                        y={84}
                                        textAnchor="middle"
                                        fontSize={22}
                                        fontWeight={700}
                                        fill="#1A1F36"
                                    >
                                        {complaintTotal}
                                    </text>
                                    <text
                                        x={90}
                                        y={104}
                                        textAnchor="middle"
                                        fontSize={10}
                                        fill="#000000"
                                    >
                                        Total Complaints
                                    </text>
                                </PieChart>

                                <div className="flex flex-col gap-3 w-full">
                                    {complaintSummaryData.map((item) => (
                                        <div
                                            key={item.name}
                                            className="flex items-center gap-2.5 text-xs"
                                        >
                                            <div
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ background: item.color }}
                                            />
                                            <span className="text-gray-600 flex-1">{item.name}</span>
                                            <span className="font-bold text-gray-900 w-8 text-right">
                                                {item.value}%
                                            </span>
                                            <span className="text-gray-300 w-8 text-right">({item.count})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <MessageSquare size={32} className="mb-2 text-gray-200" />
                                <p className="text-sm">No data found in this date period</p>
                            </div>
                        )}
                    </div>

                    {/* Recent Activities */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm h-full">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h2 className="text-sm font-bold text-[#000000]">
                                    Recent Activities
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Latest actions across the system
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col">
                            {recentActivities.length > 0 ? (
                                recentActivities.map((log) => {
                                    let iconBg = "bg-[#EAF3FF]";
                                    let iconColor = "text-[#2D7CC3]";
                                    let tagClass = "bg-[#EAF3FF] text-[#2D7CC3]";
                                    let icon = <Info size={18} className={iconColor} />;

                                    const isComplaint = log.action.toLowerCase().includes('complaint');
                                    const isLeave = log.action.toLowerCase().includes('leave');

                                    if (isComplaint) {
                                        iconBg = "bg-[#FFF4E5]";
                                        iconColor = "text-[#F59E0B]";
                                        tagClass = "bg-[#FFF4E5] text-[#F59E0B]";
                                        icon = <AlertTriangle size={18} className={iconColor} />;
                                        if (log.action.toLowerCase().includes('new')) {
                                            iconBg = "bg-[#EAF3FF]";
                                            iconColor = "text-[#2D7CC3]";
                                            tagClass = "bg-[#EAF3FF] text-[#2D7CC3]";
                                        }
                                    } else if (isLeave) {
                                        iconBg = "bg-[#EEF7E7]";
                                        iconColor = "text-[#6B8E23]";
                                        tagClass = "bg-[#EEF7E7] text-[#6B8E23]";
                                        icon = <CheckCircle size={18} className={iconColor} />;
                                    }

                                    return (
                                        <div
                                            key={log._id}
                                            className="flex items-center justify-between bg-[#F8FAFC] border border-[#EEF2F7] rounded-xl px-4 py-3 mt-3"
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                                                    {icon}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center flex-wrap gap-2">
                                                        <p className="text-[13px] text-[#333333]">
                                                            {log.action}
                                                        </p>
                                                        {(isComplaint || isLeave) && (
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${tagClass}`}>
                                                                {isComplaint ? 'Complaint' : 'Leave'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-[#9CA3AF] mt-1 capitalize">
                                                        By {log.performedByModel === 'User' ? (log.performedBy?.name || 'Admin') : (log.performedBy?.name || 'System')}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-[#9CA3AF] whitespace-nowrap ml-4">
                                                {formatRelativeTime(log.createdAt)}
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                /* Fallback mock items */
                                <>
                                    <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#EEF2F7] rounded-xl px-4 py-3 mt-3">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 rounded-lg bg-[#EAF3FF] flex items-center justify-center flex-shrink-0">
                                                <Info size={18} className="text-[#2D7CC3]" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <p className="text-[13px] text-[#333333]">
                                                        Maintenance complaint filed - Room A07 <strong className="font-medium">Plumbing</strong>
                                                    </p>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize bg-[#EAF3FF] text-[#2D7CC3]">New</span>
                                                </div>
                                                <p className="text-xs text-[#9CA3AF] mt-1 capitalize">By Roy Mathew</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-[#9CA3AF] whitespace-nowrap ml-4">5 min ago</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#EEF2F7] rounded-xl px-4 py-3 mt-3">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 rounded-lg bg-[#EEF7E7] flex items-center justify-center flex-shrink-0">
                                                <CheckCircle size={18} className="text-[#6B8E23]" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <p className="text-[13px] text-[#333333]">
                                                        Leave Request from <strong className="font-medium">Rohan Mehtha</strong> approved
                                                    </p>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize bg-[#EEF7E7] text-[#6B8E23]">Approved</span>
                                                </div>
                                                <p className="text-xs text-[#9CA3AF] mt-1 capitalize">By Admin</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-[#9CA3AF] whitespace-nowrap ml-4">10 min ago</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#EEF2F7] rounded-xl px-4 py-3 mt-3">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 rounded-lg bg-[#FFF4E5] flex items-center justify-center flex-shrink-0">
                                                <AlertTriangle size={18} className="text-[#F59E0B]" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <p className="text-[13px] text-[#333333]">
                                                        Maintenance complaint filed — Room A08 <strong className="font-medium">plumbing</strong>
                                                    </p>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize bg-[#FFF4E5] text-[#F59E0B]">Open</span>
                                                </div>
                                                <p className="text-xs text-[#9CA3AF] mt-1 capitalize">By Kiran Raj</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-[#9CA3AF] whitespace-nowrap ml-4">18 min ago</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
