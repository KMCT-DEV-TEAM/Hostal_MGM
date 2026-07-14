import React from 'react';
import { CheckCircle, Calendar as CalendarIcon } from 'lucide-react';
import DataTable from "@/components/ui/DataTable";
import InfoCard from '@/components/ui/InfoCard';
import { Filter } from 'lucide-react';
import { formatDateReadable, formatDay } from '@/utils/formatters';
import StudentMonthlyCalendar from '../components/StudentMonthlyCalendar';
import { useAuthStore } from '@/store/useAuthStore';

const StudentAttendanceMobileView = ({
    todayStats,
    history,
    loading,
    page,
    setPage,
    filters,
    pagination,
    setIsFilterModalOpen,
}) => {
    const { user } = useAuthStore();

    const presentCount = history?.filter(h => h.status === 'present')?.length || 0;
    const absentCount = history?.filter(h => h.status === 'absent')?.length || 0;
    const monthName = new Date().toLocaleString('default', { month: 'long' }).toUpperCase();
    const currentYear = new Date().getFullYear();

    return (
        <div className="w-full h-full p-4 flex flex-col bg-background-secondary gap-4 overflow-y-auto pb-24">
            {/* Today's Status Card */}
            <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] border border-gray-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-6 h-6 text-success" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm text-text-secondary">Today's Status</span>
                        <span className="text-lg font-semibold text-text-primary capitalize">{todayStats?.status || 'Pending'}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                    <span className="text-sm text-text-secondary">Marked on</span>
                    <span className="text-sm font-semibold text-text-primary">{todayStats?.markedAt || '--'}</span>
                </div>
            </div>

            {/* Monthly Summary Card */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-50 flex flex-col gap-6 shrink-0">
                <div>
                    <h3 className="text-lg font-semibold text-text-primary">Monthly Summary</h3>
                    <p className="text-sm text-text-secondary mt-1">Performance metrics for {monthName} {currentYear}</p>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1 bg-green-50/50 rounded-[16px] p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-[12px] bg-green-50 flex items-center justify-center shrink-0">
                            <CalendarIcon className="w-5 h-5 text-green-500" strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-text-primary">{presentCount.toString().padStart(2, '0')}</span>
                            <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Present</span>
                        </div>
                    </div>

                    <div className="flex-1 bg-red-50/50 rounded-[16px] p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-[12px] bg-red-50 flex items-center justify-center shrink-0">
                            <CalendarIcon className="w-5 h-5 text-red-500" strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-text-primary">{absentCount.toString().padStart(2, '0')}</span>
                            <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Absent</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Self-Fetching Calendar Component (Grid Only) */}
            <StudentMonthlyCalendar student={user} userRole={user?.role} showStats={false} />
        </div>
    );
};

export default StudentAttendanceMobileView;
