import React from 'react';
import { CheckCircle, Calendar as CalendarIcon } from 'lucide-react';
import StudentMonthlyCalendar from '../components/StudentMonthlyCalendar';
import { useAuthStore } from '@/store/useAuthStore';

const StudentAttendanceMobileView = ({
    todayStats,
}) => {
    const { user } = useAuthStore();

    return (
        <div className="w-full h-full p-4 flex flex-col bg-background-secondary gap-4 overflow-y-auto">
            {/* Today's Status Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex items-center justify-between shrink-0">
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

            {/* Self-Fetching Calendar Component (Grid + Stats) */}
            <StudentMonthlyCalendar student={user} userRole={user?.role} />
        </div>
    );
};

export default StudentAttendanceMobileView;
