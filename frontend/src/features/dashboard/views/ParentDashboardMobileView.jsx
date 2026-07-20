import React from 'react';
import { Bell, FileEdit, Wifi, Utensils, User } from 'lucide-react';
import LeaveCard from '@/features/leaves/components/cards/LeaveCard';
import Button from '@/components/ui/Button';

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
    recentAnnouncements = [],
    isLoading,
    onNavigate
}) {
    const attendanceRate = dashboardData?.attendanceRate || 0;
    const pendingLeaveCount = dashboardData?.pendingLeaveRequestsCount || 0;
    const visitorsCount = dashboardData?.recentVisitors?.length || 0;
    // Circular Progress Circle calc
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F5F7F8] font-sans  overflow-x-hidden animate-pulse">
                <div className="px-5 pt-8 pb-4 space-y-6">
                    {/* Attendance Card Skeleton */}
                    <div className="bg-white rounded-lg p-6 flex justify-between items-center shadow-sm border border-gray-100">
                        <div className="flex flex-col gap-2 z-10 w-full">
                            <div className="h-5 bg-gray-200 rounded w-36"></div>
                            <div className="h-3.5 bg-gray-200 rounded w-44 mt-0.5"></div>
                            <div className="flex items-center gap-2 mt-5">
                                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                                <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                        </div>
                        <div className="w-[76px] h-[76px] rounded-full bg-gray-200 shrink-0 z-10 mr-2"></div>
                    </div>

                    {/* Stats Row Skeleton */}
                    <div className="bg-white rounded-[24px] py-6 px-6 flex justify-between items-center shadow-sm">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="h-5 bg-gray-200 rounded w-10 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                        ))}
                    </div>

                    {/* Leave Approvals Skeleton */}
                    <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-center px-1">
                            <div className="h-5 w-32 bg-gray-200 rounded"></div>
                            <div className="h-4 w-12 bg-gray-200 rounded"></div>
                        </div>
                        <div className="flex gap-4 overflow-hidden">
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm min-w-[300px] w-[300px] sm:min-w-[340px] sm:w-[340px] shrink-0 flex flex-col gap-4 border border-gray-50">
                                    <div className="flex justify-between items-center">
                                        <div className="h-3 w-20 bg-gray-200 rounded"></div>
                                        <div className="h-3 w-16 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="h-5 w-48 bg-gray-200 rounded"></div>
                                    <div className="space-y-2 mt-1">
                                        <div className="h-3.5 w-full bg-gray-200 rounded"></div>
                                        <div className="h-3.5 w-3/4 bg-gray-200 rounded"></div>
                                    </div>
                                    <hr className="border-gray-50 my-1" />
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-2">
                                            <div className="h-2.5 w-16 bg-gray-200 rounded"></div>
                                            <div className="h-3.5 w-24 bg-gray-200 rounded"></div>
                                        </div>
                                        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                                    </div>
                                    <div className="mt-3 w-full h-10 bg-gray-200 rounded-xl"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Announcements Skeleton */}
                    <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-center px-1">
                            <div className="h-5 w-40 bg-gray-200 rounded"></div>
                            <div className="h-4 w-12 bg-gray-200 rounded"></div>
                        </div>
                        <div className="flex gap-4 overflow-hidden">
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-[#EBECEF] rounded-[24px] p-5 min-w-[260px] w-[260px] shrink-0">
                                    <div className="w-[46px] h-[46px] rounded-[14px] bg-gray-200 mb-5"></div>
                                    <div className="h-4 w-32 bg-gray-200 rounded mb-2.5"></div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-full bg-gray-200 rounded"></div>
                                        <div className="h-3 w-4/5 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F7F8] font-sans  overflow-x-hidden">
            <div className="px-5 pt-8 pb-4 space-y-6">
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
                                    className="bg-white rounded-[24px] p-5 cursor-pointer min-w-[300px] w-[300px] sm:min-w-[340px] sm:w-[340px] shrink-0 snap-start flex flex-col"
                                    onClick={() => onNavigate(`/dashboard/leaves/details/${req._id || req.id}`)}
                                >
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-[50px] h-[50px] rounded-full bg-[#DCE4F0] flex items-center justify-center shrink-0">
                                            <FileEdit className="w-[22px] h-[22px] text-[#0A437A]" strokeWidth={1.5} />
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="text-[17px] font-semibold text-[#1A1F36] capitalize">{req.passType?.replace('_', ' ') || 'Weekend Home Pass'}</h3>
                                            <span className="text-[13px] text-[#9CA3AF] mt-0.5">{req.reason || 'Family Event'}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mb-8">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium uppercase tracking-wider mb-2">From</span>
                                            <span className="text-[14px] font-medium text-[#1A1F36]">
                                                {new Date(req.fromDate || req.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex flex-col text-left min-w-[100px]">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium uppercase tracking-wider mb-2">To</span>
                                            <span className="text-[14px] font-medium text-[#1A1F36]">
                                                {req.toDate ? new Date(req.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto">

                                        <Button
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation(); // prevent card click
                                                onNavigate(`/dashboard/leaves/details/${req._id || req.id}`);
                                            }}
                                            icon={<FileEdit />}
                                            variant='primary'
                                        >
                                            Approve
                                        </Button>
                                    </div>
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

                    {recentAnnouncements.length > 0 ? (
                        <div
                            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {recentAnnouncements.map((announcement, index) => (
                                <div key={announcement._id || index} className="bg-white rounded-[24px] p-5 min-w-[260px] w-[260px] shrink-0 snap-start">
                                    <div className="w-[46px] h-[46px] rounded-[14px] bg-[#DCE4F0] flex items-center justify-center mb-5">
                                        <Bell className="w-[22px] h-[22px] text-[#1e3a8a]" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-[15px] font-semibold text-[#1A1F36] mb-2">{announcement.title}</h3>
                                    <p className="text-[13px] text-gray-500 leading-snug line-clamp-3">{announcement.message}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[24px] p-5 text-center text-sm text-gray-500 shadow-sm">
                            No recent announcements.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
