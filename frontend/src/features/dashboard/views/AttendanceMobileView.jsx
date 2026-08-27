import React from 'react';
import { CheckCircle } from 'lucide-react';
import StudentMonthlyCalendar from '../components/StudentMonthlyCalendar';
import { useAuthStore } from '@/store/useAuthStore';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { useActiveStudent } from '@/hooks/useActiveStudent';

const AttendanceMobileView = ({
  todayStats,
  student,
  userRole
}) => {
  useLayoutConfig();

  const { user: authUser } = useAuthStore();
  const { activeStudentId } = useActiveStudent();

  // Fallback to activeStudentId if parent, else authUser (for student role)
  const defaultStudent = authUser?.role === 'parent' ? { id: activeStudentId } : authUser;
  const activeStudent = student || defaultStudent;
  const activeRole = userRole || authUser?.role;

  return (
    <div className="w-full p-4 flex flex-col gap-4">
      {/* Today's Status Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-success" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-text-secondary">Today's Status</span>
            <span className="text-sm font-semibold text-text-primary capitalize">{todayStats?.status || 'Pending'}</span>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-sm text-text-secondary mb-0.5">Marked on</span>
          {todayStats?.markedAt ? (
            <span className="text-xs font-semibold text-text-primary">{todayStats.markedAt}</span>
          ) : (
            <span className="mt-1 px-3 py-1 text-[11px] font-semibold rounded-md bg-warning/10 text-warning">Pending</span>
          )}
        </div>
      </div>

      {/* Self-Fetching Calendar Component (Grid + Stats) */}
      <StudentMonthlyCalendar student={activeStudent} userRole={activeRole} />
    </div>
  );
};

export default AttendanceMobileView;
