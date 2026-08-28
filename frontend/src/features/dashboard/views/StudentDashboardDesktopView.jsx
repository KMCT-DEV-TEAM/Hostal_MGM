import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
    Calendar,
    CalendarClock,
    Megaphone,
    Headset,
    TriangleAlert,
    MessageSquare
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
import Dropdown from '@/components/ui/Dropdown';

const StatusBadge = ({ status }) => {
    let dotColor = '';
    let textColor = '';

    switch (status) {
        case 'Approved':
            dotColor = 'bg-[#10B981]';
            textColor = 'text-[#10B981]';
            break;
        case 'Pending':
            dotColor = 'bg-[#F59E0B]';
            textColor = 'text-[#F59E0B]';
            break;
        case 'In Progress':
            dotColor = 'bg-[#3B82F6]';
            textColor = 'text-[#3B82F6]';
            break;
        default:
            dotColor = 'bg-gray-400';
            textColor = 'text-gray-500';
    }

    return (
        <div className={`flex items-center gap-1.5 text-xs font-medium ${textColor}`}>
            <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
            {status}
        </div>
    );
};

export default function StudentDashboardDesktopView({
    user,
    period,
    setPeriod,
    radialPeriod,
    setRadialPeriod,
    dashboardData,
    attendanceData,
    radialData,
    leaveRequests,
    complaints,
    onNavigate
}) {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-[#F4F6F9] font-sans text-sm text-gray-900 pb-[100px]">
            {/* Header */}
            <div className="px-4 md:px-7 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-black mb-1">
                        Hey {user?.name?.split(' ')[0] || 'Nila'}...!
                    </h1>
                    <p className="text-sm text-gray-500">
                        Here is your hostel activity overview
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

                    {/* Complaints Card */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 border-t-1 border-t-[#EF4444]">
                        <div className="flex justify-between items-start">
                            <span className="text-xs text-gray-500 font-medium leading-tight">
                                COMPLAINTS
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] flex items-center justify-center text-sm flex-shrink-0 text-[#EF4444]">
                                <TriangleAlert size={18} />
                            </div>
                        </div>
                        <div className="text-[20px] font-semibold tracking-tight">
                            {dashboardData?.openComplaintsCount || 0}
                        </div>
                        <div className="text-[12px] text-[#9CA3AF]">Open complaints</div>
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
                        <div className="text-[12px] text-[#9CA3AF]">Pending approval</div>
                    </div>
                </div>

                {/* Attendance Overview Section */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 relative">
                        {/* Left Side: Radial Chart */}
                        <div className="flex flex-col">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <div>
                                    <h2 className="text-[20px] font-bold text-black">
                                        Attendance Overview
                                    </h2>
                                    <p className="text-sm text-[#8F8F8F] mt-1">
                                        See the Attendance overview
                                    </p>
                                </div>
                                <Dropdown
                                    options={[
                                        { label: 'This Month', value: 'This Month' },
                                        { label: 'Last Month', value: 'Last Month' }
                                    ]}
                                    value={radialPeriod}
                                    onChange={(val) => setRadialPeriod(val)}
                                    minWidth="w-[120px]"
                                    triggerClassName="bg-[#F9FAFB] border-none rounded-lg px-3 py-1.5 text-xs text-gray-500 font-medium cursor-pointer focus:outline-none flex justify-between items-center gap-2"
                                />
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

                                <div className="flex flex-wrap gap-4 sm:gap-6 mt-6 justify-center">
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

                        {/* Vertical Divider - only visible on large screens */}
                        <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[1px] h-1/2 bg-gray-200"></div>

                        {/* Right Side: Bar Chart */}
                        <div className="flex flex-col mt-8 lg:mt-0">
                            <div className="flex justify-start sm:justify-end items-start sm:items-center mb-6 lg:h-[52px]">
                                <Dropdown
                                    options={[
                                        { label: 'This Year', value: 'This Year' },
                                        { label: 'Last Year', value: 'Last Year' }
                                    ]}
                                    value={period}
                                    onChange={(val) => setPeriod(val)}
                                    minWidth="w-[120px]"
                                    triggerClassName="bg-[#F9FAFB] border-none rounded-lg px-3 py-1.5 text-[11px] text-gray-500 font-medium cursor-pointer focus:outline-none flex justify-between items-center gap-2"
                                />
                            </div>

                            <div className="flex-1 min-h-[220px] w-full relative mt-6">
                                {attendanceData.some(item => item.value > 0) ? (
                                    <ResponsiveContainer width="100%" height={220}>
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
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-4">
                                        <MessageSquare size={32} className="mb-2 text-gray-200" />
                                        <p className="text-sm">No records found for {period.toLowerCase()}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lists Section: Complaints & Leave Requests */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Recent Complaints */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-sm font-bold text-[#000000]">Recent complaints</h2>
                                <p className="text-xs text-gray-400 mt-0.5">View recent complaints</p>
                            </div>
                            <button 
                                onClick={() => onNavigate('/dashboard/complaints')}
                                className="text-xs text-[#777777] font-medium hover:underline cursor-pointer"
                            >
                                View all
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-3 flex-1">
                            {complaints.length > 0 ? complaints.map((comp) => (
                                <div key={comp.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#EEF2F7] rounded-[14px] p-4">
                                    <div>
                                        <div className="text-[13px] text-[#333333] font-medium flex-wrap">{comp.subject}</div>
                                        <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                                            Submitted on {new Date(comp.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="self-start sm:self-auto">
                                        <StatusBadge status={comp.status} />
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-sm text-gray-400 py-4">No recent complaints found</div>
                            )}
                        </div>
                    </div>

                    {/* Recent Leave Requests */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-sm font-bold text-[#000000]">Recent Leave Requests</h2>
                                <p className="text-xs text-gray-400 mt-0.5">View recent leave requests</p>
                            </div>
                            <button 
                                onClick={() => onNavigate('/dashboard/leaves')}
                                className="text-xs text-[#777777] font-medium hover:underline cursor-pointer"
                            >
                                View all
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-3 flex-1">
                            {leaveRequests.length > 0 ? leaveRequests.map((req) => (
                                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#EEF2F7] rounded-[14px] p-4">
                                    <div>
                                        <div className="flex items-center gap-1.5 text-[13px] text-[#333333] font-medium flex-wrap">
                                            <span className="capitalize">{req.passType?.replace('_', ' ')}</span>
                                            {req.reason && (
                                                <span className="text-[#9CA3AF]">- {req.reason.substring(0, 20)}</span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                                            {new Date(req.fromDate || req.date).toLocaleDateString()} {req.toDate && `- ${new Date(req.toDate).toLocaleDateString()}`} <span className="ml-1">({req.totalDays || 1} days)</span>
                                        </div>
                                    </div>
                                    <div className="self-start sm:self-auto">
                                        <StatusBadge status={req.status === "approved" ? "Approved" : req.status.includes("pending") ? "Pending" : "Rejected"} />
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-sm text-gray-400 py-4">No recent leave requests found</div>
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
                            
                            <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 pt-2">
                                <div className="text-[11px] text-gray-500">
                                    Emergency Contact : <span className="text-primary font-medium whitespace-nowrap">+91 6789876789</span>
                                </div>
                                <div className="text-[10px] text-gray-400 whitespace-nowrap ml-auto">
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
