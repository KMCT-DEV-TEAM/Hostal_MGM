import React, { useState, useEffect } from 'react';
import { getParentDashboardStats } from '@/services/parent.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';
import {
    Calendar,
    Users,
    CalendarClock,
    Megaphone,
    Headset,
    ChevronDown
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';



const StatusBadge = ({ status }) => {
    let dotColor = '';
    let textColor = '';

    switch (status) {
        case 'Approved':
        case 'Completed':
            dotColor = 'bg-[#10B981]';
            textColor = 'text-[#10B981]';
            break;
        case 'Pending':
            dotColor = 'bg-[#F59E0B]';
            textColor = 'text-[#F59E0B]';
            break;
        default:
            dotColor = 'bg-gray-400';
            textColor = 'text-gray-500';
    }

    if (status === 'Completed') {
        dotColor = 'bg-[#3B82F6]';
        textColor = 'text-[#3B82F6]';
    }

    return (
        <div className={`flex items-center gap-1.5 text-xs font-medium ${textColor}`}>
            <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
            {status}
        </div>
    );
};

export default function ParentDashboard() {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const [period, setPeriod] = useState('This Year');
    const [radialPeriod, setRadialPeriod] = useState('This Month');
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getParentDashboardStats();
                setDashboardData(res?.data);
            } catch (err) {
                console.error("Failed to fetch parent stats", err);
            }
        };
        fetchStats();
    }, []);

    const attendanceData = dashboardData?.monthlyAttendance || [];
    const radialData = [
        { name: 'Absent', value: 100 - (dashboardData?.attendanceRate || 0), color: '#F3F4F6' },
        { name: 'Present', value: dashboardData?.attendanceRate || 0, color: '#0F6E56' }
    ];
    const leaveRequests = dashboardData?.recentLeaveRequests || [];
    const visitors = dashboardData?.recentVisitors || [];

    return (
        <div className="min-h-screen bg-[#F4F6F9] font-sans text-sm text-gray-900 pb-[100px]">
            {/* Header */}
            <div className="px-4 md:px-7 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-black mb-1">
                        Hey {user?.name?.split(' ')[0] || 'Satheeshan'}...!
                    </h1>
                    <p className="text-sm text-gray-500">
                        Here is your childs hostel activity overview
                    </p>
                </div>
            </div>

            <div className="p-6 md:p-8 flex flex-col gap-6">
                {/* Top Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Attendance Card */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 border-t-1 border-t-[#10B981]">
                        <div className="flex justify-between items-start">
                            <span className="text-xs text-gray-500 font-medium leading-tight">
                                ATTENDANCE
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] flex items-center justify-center text-sm flex-shrink-0 text-[#10B981]">
                                <Calendar size={18} />
                            </div>
                        </div>
                        <div className="text-[20px] font-semibold tracking-tight">
                            {dashboardData?.attendanceRate || 0}%
                        </div>
                        <div className="text-[12px] text-[#9CA3AF]">This month</div>
                    </div>

                    {/* Visitors Card */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 border-t-1 border-t-[#3B82F6]">
                        <div className="flex justify-between items-start">
                            <span className="text-xs text-gray-500 font-medium leading-tight">
                                VISITORS
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-sm flex-shrink-0 text-[#3B82F6]">
                                <Users size={18} />
                            </div>
                        </div>
                        <div className="text-[20px] font-semibold tracking-tight">
                            {dashboardData?.pendingVisitorsCount || 0}
                        </div>
                        <div className="text-[12px] text-[#9CA3AF]">Pending admin approval</div>
                    </div>

                    {/* Leave Requests Card */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 border-t-1 border-t-[#F59E0B]">
                        <div className="flex justify-between items-start">
                            <span className="text-xs text-gray-500 font-medium leading-tight">
                                LEAVE REQUESTS
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] flex items-center justify-center text-sm flex-shrink-0 text-[#F59E0B]">
                                <CalendarClock size={18} />
                            </div>
                        </div>
                        <div className="text-[20px] font-semibold tracking-tight">
                            {dashboardData?.pendingLeaveRequestsCount || 0}
                        </div>
                        <div className="text-[12px] text-[#9CA3AF]">Pending your approval</div>
                    </div>
                </div>

                {/* Attendance Overview Section */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                        {/* Left Side: Radial Chart */}
                        <div className="flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-[20px] font-bold text-black">
                                        Attendance Overview
                                    </h2>
                                    <p className="text-sm text-[#8F8F8F] mt-1">
                                        See the Attendance overview
                                    </p>
                                </div>
                                <div className="relative">
                                    <select
                                        value={radialPeriod}
                                        onChange={(e) => setRadialPeriod(e.target.value)}
                                        className="appearance-none bg-[#F9FAFB] border-none rounded-lg pl-3 pr-8 py-1.5 text-xs text-gray-500 font-medium cursor-pointer focus:outline-none"
                                    >
                                        <option>This Month</option>
                                        <option>Last Month</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center mt-6">
                                <div className="relative w-[200px] h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={radialData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={90}
                                                startAngle={90}
                                                endAngle={-270}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {radialData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-[32px] font-semibold text-[#1A1F36]">{dashboardData?.attendanceRate || 0}%</span>
                                        <span className="text-[13px] text-[#8F8F8F] font-medium mt-1">Overall</span>
                                    </div>
                                </div>

                                <div className="flex gap-8 mt-6">
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#0F6E56]"></span>
                                            Present
                                        </div>
                                        <span className="text-[10px] text-gray-400">{dashboardData?.presentCount || 0} Days</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                                            Absent
                                        </div>
                                        <span className="text-[10px] text-gray-400">{(dashboardData?.totalDays || 0) - (dashboardData?.presentCount || 0)} days</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Bar Chart */}
                        <div className="flex flex-col relative pt-[46px]">
                            <div className="absolute top-0 right-0 z-10">
                                <div className="relative">
                                    <select
                                        value={period}
                                        onChange={(e) => setPeriod(e.target.value)}
                                        className="appearance-none bg-[#F9FAFB] border-none rounded-lg pl-3 pr-8 py-1.5 text-[11px] text-gray-500 font-medium cursor-pointer focus:outline-none"
                                    >
                                        <option>This Year</option>
                                        <option>Last Year</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex-1 h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={attendanceData}
                                        margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
                                        barSize={20}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                        <XAxis 
                                            dataKey="month" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#9CA3AF', fontSize: 10, dy: 10 }}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                            tickFormatter={(value) => `${value}%`}
                                            domain={[0, 100]}
                                            ticks={[0, 20, 40, 60, 80, 100]}
                                        />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="value" fill="#0F6E56" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lists Section: Leave Requests & Visitors */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Recent Leave Requests */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-sm font-bold text-[#000000]">Recent Leave Requests</h2>
                                <p className="text-xs text-gray-400 mt-0.5">View recent leave requests</p>
                            </div>
                            <button className="text-xs text-[#777777] font-medium hover:underline cursor-pointer">
                                View all
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-3 flex-1">
                            {leaveRequests.length > 0 ? leaveRequests.map((req) => (
                                <div key={req._id} className="flex items-center justify-between bg-white border border-[#EEF2F7] rounded-[14px] p-4">
                                    <div>
                                        <div className="flex items-center gap-1.5 text-[13px] text-[#333333] font-medium">
                                            <span className="capitalize">{req.passType?.replace('_', ' ')}</span>
                                            {req.reason && (
                                                <span className="text-[#9CA3AF]">- {req.reason.substring(0, 20)}</span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                                            {new Date(req.fromDate || req.date).toLocaleDateString()} {req.toDate && `- ${new Date(req.toDate).toLocaleDateString()}`} <span className="ml-1">({req.totalDays || 1} days)</span>
                                        </div>
                                    </div>
                                    <StatusBadge status={req.status === "approved" ? "Approved" : req.status.includes("pending") ? "Pending" : "Rejected"} />
                                </div>
                            )) : (
                                <div className="text-center text-sm text-gray-400 py-4">No recent leave requests found</div>
                            )}
                        </div>
                    </div>

                    {/* Recent Visitors */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-sm font-bold text-[#000000]">Recent Visitors</h2>
                                <p className="text-xs text-gray-400 mt-0.5">View the list of recent visitors of your child</p>
                            </div>
                            <button className="text-xs text-[#777777] font-medium hover:underline cursor-pointer">
                                View all
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-3 flex-1">
                            {visitors.length > 0 ? visitors.map((visitor) => (
                                <div key={visitor._id} className="flex items-center justify-between bg-white border border-[#EEF2F7] rounded-[14px] p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-6 h-6 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white text-[10px] font-medium">
                                            {visitor.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-[13px] text-[#333333] font-medium mb-0.5">{visitor.name}</div>
                                            <div className="text-[11px] text-[#9CA3AF]">
                                                {new Date(visitor.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <StatusBadge status={visitor.approvalStatus} />
                                </div>
                            )) : (
                                <div className="text-center text-sm text-gray-400 py-4">No recent visitors found</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Important Announcement */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5] flex-shrink-0">
                                <Megaphone size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[#000000]">Important annoncement</h3>
                                <p className="text-xs text-gray-400 mt-0.5">View recent complaints</p>
                            </div>
                        </div>
                        
                        <div className="mt-4">
                            <p className="text-[12px] text-gray-500 leading-relaxed">
                                Water supply will be unavailable for saturday , <strong className="text-gray-700 font-semibold">10 Am to 2 Pm</strong> due to the scheduled maintainance
                            </p>
                        </div>
                        
                        <div className="text-[10px] text-gray-400 text-right mt-4">
                            2 hours ago
                        </div>
                    </div>

                    {/* Need Help */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6] flex-shrink-0">
                                <Headset size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[#000000]">Need Help ?</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Have facing any trouble</p>
                            </div>
                        </div>
                        
                        <div className="mt-4 space-y-4">
                            <p className="text-[12px] text-gray-500">
                                Contact the hostel Warden for any assistance
                            </p>
                            
                            <div className="flex justify-between items-center pt-2">
                                <div className="text-[11px] text-gray-500">
                                    Emergency Contact : <span className="text-[#3B82F6] font-medium">+91 6789876789</span>
                                </div>
                                <div className="text-[10px] text-gray-400">
                                    24 / 7 Available
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
