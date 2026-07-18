import React from 'react';
import { Bell, FileEdit, Wifi, Utensils, User } from 'lucide-react';

export default function ParentDashboardMobileView({
    user,
    period,
    setPeriod,
    radialPeriod,
    setRadialPeriod,
    dashboardData,
    attendanceData,
    radialData,
    leaveRequests,
    visitors,
    pendingParentLeaveRequests,
    onNavigate
}) {
    const attendanceRate = dashboardData?.attendanceRate || 0;
    const pendingLeaveCount = dashboardData?.pendingLeaveRequestsCount || 0;
    const visitorsCount = dashboardData?.recentVisitors?.length || 0;
    console.log(leaveRequests, "leaveRequests", pendingParentLeaveRequests)
    // Circular Progress Circle calc
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;

    return (
        <div className="min-h-screen bg-[#F5F7F8] font-sans pb-[100px] overflow-x-hidden">
            <div className="px-5 pt-2 pb-4 space-y-6">
                {/* Attendance Overview Card */}
                <div className="bg-white rounded-lg p-6 flex justify-between items-center  shadow-sm">
                    <div className="flex flex-col gap-1.5 z-10">
                        <h3 className="text-[17px] font-bold text-[#1A1F36]">Attendance Overview</h3>
                        <p className="text-[13px] text-gray-500 font-medium">{attendanceRate}% Monthly Attendance</p>
                        <div className="flex items-center gap-1.5 mt-5">
                            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                            <span className="text-[12px] text-[#10B981] font-medium">In good standing</span>
                        </div>
                    </div>

                    <div className="relative w-[76px] h-[76px] flex items-center justify-center shrink-0 z-10 mr-2">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
                            {/* Background circle */}
                            <circle
                                cx="30"
                                cy="30"
                                r={radius}
                                fill="transparent"
                                stroke="#F3F4F6"
                                strokeWidth="5.5"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="30"
                                cy="30"
                                r={radius}
                                fill="transparent"
                                stroke="#10B981"
                                strokeWidth="5.5"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[15px] font-bold text-[#1A1F36]">{attendanceRate}%</span>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="bg-white rounded-[24px] py-6 px-6 flex justify-between items-center shadow-sm">
                    <div className="flex flex-col items-center">
                        <span className="text-[17px] font-bold text-[#1e3a8a]">{attendanceRate}%</span>
                        <span className="text-[11px] text-gray-500 font-medium mt-1.5">Attendance</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[17px] font-bold text-[#F59E0B]">{(pendingLeaveCount < 10 && pendingLeaveCount > 0) ? `0${pendingLeaveCount}` : pendingLeaveCount}</span>
                        <span className="text-[11px] text-gray-500 font-medium mt-1.5">Approval Pending</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[17px] font-bold text-[#a855f7]">{(visitorsCount < 10 && visitorsCount > 0) ? `0${visitorsCount}` : visitorsCount}</span>
                        <span className="text-[11px] text-gray-500 font-medium mt-1.5">Visitors</span>
                    </div>
                </div>

                {/* Leave Approvals Section */}
                <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-[17px] font-bold text-[#1A1F36]">Leave Approvals</h2>
                        <button
                            onClick={() => onNavigate('/dashboard/leaves')}
                            className="text-[14px] text-[#2563EB] font-medium"
                        >
                            See All
                        </button>
                    </div>

                    {pendingParentLeaveRequests.length > 0 ? (
                        <div
                            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {pendingParentLeaveRequests.map((req, index) => (
                                <div
                                    key={req._id || index}
                                    className="bg-white rounded-[24px] p-5 shadow-sm cursor-pointer min-w-[300px] w-[300px] sm:min-w-[340px] sm:w-[340px] shrink-0 snap-start"
                                    onClick={() => onNavigate(`/dashboard/leaves/details/${req._id || req.id}`)}
                                >
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-[50px] h-[50px] rounded-full bg-[#F4F6F8] flex items-center justify-center shrink-0">
                                            <FileEdit className="w-[22px] h-[22px] text-[#0A437A]" strokeWidth={1.5} />
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="text-[16px] font-semibold text-[#1A1F36] capitalize">{req.passType?.replace('_', ' ') || 'Weekend Home Pass'}</h3>
                                            <span className="text-[12px] text-[#9CA3AF] mt-0.5">{req._id || 'Family Event'}</span>
                                        </div>
                                    </div>

                                    {/* Faint divider */}
                                    <div className="h-[1px] w-full bg-gray-50 mb-5"></div>

                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium uppercase tracking-wider mb-1.5">From</span>
                                            <span className="text-[14px] text-[#1A1F36]">
                                                {new Date(req.fromDate || req.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium uppercase tracking-wider mb-1.5">To</span>
                                            <span className="text-[14px] text-[#1A1F36]">
                                                {req.toDate ? new Date(req.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // prevent card click
                                            onNavigate(`/dashboard/leaves/details/${req._id || req.id}`);
                                        }}
                                        className="w-full bg-[#0A437A] hover:bg-[#073059] text-white text-[15px] font-medium py-3 rounded-[10px] transition-colors"
                                    >
                                        Approve
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[24px] p-5 text-center text-sm text-gray-500 shadow-sm">
                            No pending leave approvals.
                        </div>
                    )}
                </div>

                {/* Recent Announcements Section */}
                <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-[17px] font-medium text-[#1A1F36]">Recent Announcements</h2>
                        <button className="text-[14px] text-[#2563EB] font-medium">See All</button>
                    </div>

                    <div
                        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {/* Announcement Card 1 */}
                        <div className="bg-[#EBECEF] rounded-[24px] p-5 min-w-[260px] w-[260px] shrink-0 snap-start">
                            <div className="w-[46px] h-[46px] rounded-[14px] bg-[#DCE4F0] flex items-center justify-center mb-5">
                                <Wifi className="w-[22px] h-[22px] text-[#1e3a8a]" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-[15px] font-semibold text-[#1A1F36] mb-2">Wi-Fi Maintenance</h3>
                            <p className="text-[13px] text-gray-500 leading-snug">Expected downtime tomorrow from 2 AM to 4 AM for system...</p>
                        </div>

                        {/* Announcement Card 2 */}
                        <div className="bg-[#EBECEF] rounded-[24px] p-5 min-w-[260px] w-[260px] shrink-0 snap-start">
                            <div className="w-[46px] h-[46px] rounded-[14px] bg-[#F2E5DC] flex items-center justify-center mb-5">
                                <Utensils className="w-[22px] h-[22px] text-[#8B5E34]" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-[15px] font-semibold text-[#1A1F36] mb-2">Mess Menu Updated</h3>
                            <p className="text-[13px] text-gray-500 leading-snug">The menu for the upcoming week has been updated in the portal.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
