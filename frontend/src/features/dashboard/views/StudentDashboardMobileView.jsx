import React from 'react';
import { Wifi, Utensils, FileEdit, Tag } from 'lucide-react';

export default function StudentDashboardMobileView({
    user,
    period,
    setPeriod,
    radialPeriod,
    setRadialPeriod,
    dashboardData,
    attendanceData,
    radialData,
    leaveRequests = [],
    complaints = [],
    recentAnnouncements = [],
    isLoading,
    onNavigate
}) {
    const attendanceRate = dashboardData?.attendanceRate || 0;
    const leavePendingCount = dashboardData?.pendingLeaveRequestsCount || 0;
    const complaintsOpenCount = dashboardData?.openComplaintsCount || 0;

    // Circular Progress Circle calc
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;

    // Combine recent requests (leaves and complaints)
    const recentRequests = [
        ...leaveRequests.map(req => ({ ...req, type: 'leave' })),
        ...complaints.map(comp => ({ ...comp, type: 'complaint' }))
    ].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
        .slice(0, 5);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F8F9FA] font-sans overflow-x-hidden pb-[100px]">
                <div className="px-5 pt-8 pb-4 space-y-6 animate-pulse">

                    {/* Attendance Card Skeleton */}
                    <div className="bg-white rounded-[24px] p-6 flex justify-between items-center shadow-sm border border-gray-50">
                        <div className="flex flex-col gap-2 z-10 w-full">
                            <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
                            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                            <div className="flex items-center gap-1.5 mt-5">
                                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                                <div className="h-3 w-24 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                        <div className="w-[76px] h-[76px] rounded-full bg-gray-200 shrink-0 ml-4"></div>
                    </div>

                    {/* Stats Row Skeleton */}
                    <div className="bg-white rounded-[24px] py-6 px-4 flex justify-between items-center shadow-sm border border-gray-50">
                        <div className="flex flex-col items-center flex-1 gap-2">
                            <div className="h-5 w-10 bg-gray-200 rounded"></div>
                            <div className="h-3 w-16 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-10 w-[1px] bg-gray-100"></div>
                        <div className="flex flex-col items-center flex-1 gap-2">
                            <div className="h-5 w-10 bg-gray-200 rounded"></div>
                            <div className="h-3 w-16 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-10 w-[1px] bg-gray-100"></div>
                        <div className="flex flex-col items-center flex-1 gap-2">
                            <div className="h-5 w-10 bg-gray-200 rounded"></div>
                            <div className="h-3 w-16 bg-gray-200 rounded"></div>
                        </div>
                    </div>

                    {/* Recent Announcements Skeleton */}
                    <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-center px-1">
                            <div className="h-5 w-40 bg-gray-200 rounded"></div>
                            <div className="h-4 w-12 bg-gray-200 rounded"></div>
                        </div>
                        <div className="flex gap-4 overflow-x-hidden pb-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-white rounded-[24px] p-5 min-w-[260px] w-[260px] shrink-0 shadow-sm border border-gray-50">
                                    <div className="w-[46px] h-[46px] rounded-[14px] bg-gray-200 mb-5"></div>
                                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-2.5"></div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-full bg-gray-200 rounded"></div>
                                        <div className="h-3 w-4/5 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Requests Skeleton */}
                    <div className="space-y-4 pt-2">
                        <div className="h-5 w-32 bg-gray-200 rounded px-1 mb-2"></div>
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-white rounded-[20px] p-4 flex items-center justify-between shadow-sm border border-gray-50">
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="w-[46px] h-[46px] rounded-full bg-gray-200 shrink-0"></div>
                                        <div className="flex flex-col gap-2 flex-1">
                                            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                                            <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="h-6 w-16 bg-gray-200 rounded-full shrink-0 ml-4"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-sans overflow-x-hidden ">
            <div className="px-5 pt-8 pb-4 space-y-6">

                {/* Attendance Overview Card */}
                <div className="bg-white rounded-[24px] p-6 flex justify-between items-center shadow-sm border border-gray-50">
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
                            <circle
                                cx="30"
                                cy="30"
                                r={radius}
                                fill="transparent"
                                stroke="#F3F4F6"
                                strokeWidth="5.5"
                            />
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
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[15px] font-bold text-[#1A1F36]">{attendanceRate}%</span>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="bg-white rounded-[24px] py-6 px-4 flex justify-between items-center shadow-sm border border-gray-50">
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-[17px] font-bold text-[#1e3a8a] mb-1.5">{attendanceRate}%</span>
                        <span className="text-[10.5px] text-gray-400 font-medium uppercase tracking-wider">Attendance</span>
                    </div>
                    <div className="h-10 w-[1px] bg-gray-100"></div>
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-[17px] font-bold text-[#F59E0B] mb-1.5">{leavePendingCount.toString().padStart(2, '0')}</span>
                        <span className="text-[10.5px] text-gray-400 font-medium uppercase tracking-wider">Leave Pending</span>
                    </div>
                    <div className="h-10 w-[1px] bg-gray-100"></div>
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-[17px] font-bold text-[#EF4444] mb-1.5">{complaintsOpenCount.toString().padStart(2, '0')}</span>
                        <span className="text-[10.5px] text-gray-400 font-medium uppercase tracking-wider">Complaint Open</span>
                    </div>
                </div>

                {/* Recent Announcements Section */}
                <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-[17px] font-semibold text-[#1A1F36]">Recent Announcements</h2>
                        <button className="text-[14px] text-[#2563EB] font-medium">See All</button>
                    </div>

                    <div
                        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {recentAnnouncements.length > 0 ? (
                            recentAnnouncements.map((ann, idx) => {
                                const themes = [
                                    { bg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]', Icon: Wifi },
                                    { bg: 'bg-[#FFF7ED]', iconColor: 'text-[#C2410C]', Icon: Utensils },
                                    { bg: 'bg-[#ECFDF5]', iconColor: 'text-[#10B981]', Icon: Tag },
                                    { bg: 'bg-[#F3E8FF]', iconColor: 'text-[#9333EA]', Icon: FileEdit }
                                ];
                                const { bg, iconColor, Icon } = themes[idx % themes.length];

                                return (
                                    <div key={ann._id || idx} className="bg-white rounded-[24px] p-5 min-w-[260px] w-[260px] shrink-0 snap-start shadow-sm border border-gray-50">
                                        <div className={`w-[46px] h-[46px] rounded-[14px] ${bg} flex items-center justify-center mb-5`}>
                                            <Icon className={`w-[22px] h-[22px] ${iconColor}`} strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-[15px] font-semibold text-[#1A1F36] mb-2">{ann.title}</h3>
                                        <p className="text-[13px] text-gray-500 leading-snug line-clamp-2">{ann.message}</p>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-white rounded-[24px] p-5 text-center text-sm text-gray-500 shadow-sm border border-gray-50 flex-1">
                                No recent announcements.
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Requests Section */}
                <div className="space-y-4 pt-2">
                    <h2 className="text-[17px] font-semibold text-[#1A1F36] px-1">Recent Requests</h2>

                    <div className="space-y-3">
                        {recentRequests.length > 0 ? (
                            recentRequests.map((req, idx) => {
                                if (req.type === 'leave') {
                                    return (
                                        <div
                                            key={`leave-${req._id}`}
                                            className="bg-white rounded-[20px] p-4 flex items-center justify-between shadow-sm border border-gray-50 cursor-pointer"
                                            onClick={() => onNavigate(`/dashboard/leaves/details/${req._id}`)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-[46px] h-[46px] rounded-full bg-[#EEF2FF] flex items-center justify-center shrink-0">
                                                    <FileEdit className="w-5 h-5 text-[#4F46E5]" strokeWidth={1.5} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <h3 className="text-[15px] font-semibold text-[#1A1F36]">Leave Request</h3>
                                                    <span className="text-[13px] text-gray-400 mt-0.5 capitalize">{req.passType?.replace('_', ' ') || req.reason?.substring(0, 20) || 'Weekend Gateway'}</span>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 text-[11px] font-semibold rounded-full ${req.status === 'approved' || req.status === 'completed' ? 'bg-[#ECFDF5] text-[#10B981]' :
                                                req.status === 'rejected' ? 'bg-[#FEF2F2] text-[#EF4444]' : 'bg-[#FFFBEB] text-[#D97706]'
                                                }`}>
                                                {req.status === 'approved' || req.status === 'completed' ? 'Approved' :
                                                    req.status === 'rejected' ? 'Rejected' : 'Pending'}
                                            </span>
                                        </div>
                                    )
                                } else {
                                    return (
                                        <div
                                            key={`comp-${req._id}`}
                                            className="bg-white rounded-[20px] p-4 flex items-center justify-between shadow-sm border border-gray-50 cursor-pointer"
                                            onClick={() => onNavigate(`/dashboard/complaints/details/${req._id}`)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-[46px] h-[46px] rounded-full bg-[#FFE4E6] flex items-center justify-center shrink-0">
                                                    <Tag className="w-5 h-5 text-[#E11D48]" strokeWidth={1.5} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <h3 className="text-[15px] font-semibold text-[#1A1F36]">Complaint</h3>
                                                    <span className="text-[13px] text-gray-400 mt-0.5 line-clamp-1 max-w-[150px]">{req.subject || 'Room AC not working'}</span>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 text-[11px] font-semibold rounded-full ${req.status === 'Resolved' || req.status === 'Closed' ? 'bg-[#ECFDF5] text-[#10B981]' :
                                                req.status === 'In Progress' ? 'bg-[#EFF6FF] text-[#3B82F6]' : 'bg-[#F3E8FF] text-[#9333EA]'
                                                }`}>
                                                {req.status === 'Resolved' || req.status === 'Closed' ? 'Resolved' :
                                                    req.status === 'In Progress' ? 'In Progress' : req.status === 'Assigned' ? 'Assigned' : 'Open'}
                                            </span>
                                        </div>
                                    )
                                }
                            })
                        ) : (
                            <>
                                <div className="bg-white rounded-[20px] p-4 flex items-center justify-between shadow-sm border border-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-[46px] h-[46px] rounded-full bg-[#EEF2FF] flex items-center justify-center shrink-0">
                                            <FileEdit className="w-5 h-5 text-[#4F46E5]" strokeWidth={1.5} />
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="text-[15px] font-semibold text-[#1A1F36]">Leave Request</h3>
                                            <span className="text-[13px] text-gray-400 mt-0.5">Weekend Gateway</span>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-[#FFFBEB] text-[#D97706] text-[11px] font-semibold rounded-full">
                                        Pending
                                    </span>
                                </div>

                                <div className="bg-white rounded-[20px] p-4 flex items-center justify-between shadow-sm border border-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-[46px] h-[46px] rounded-full bg-[#FFE4E6] flex items-center justify-center shrink-0">
                                            <Tag className="w-5 h-5 text-[#E11D48]" strokeWidth={1.5} />
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="text-[15px] font-semibold text-[#1A1F36]">Complaint</h3>
                                            <span className="text-[13px] text-gray-400 mt-0.5">Room AC not working</span>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-[#F3E8FF] text-[#9333EA] text-[11px] font-semibold rounded-full">
                                        Assigned
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
