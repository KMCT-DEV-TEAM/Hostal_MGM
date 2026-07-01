import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ParentAttendanceStatsCards from "../components/ParentAttendanceStatsCards";
import DataTable from "@/components/ui/DataTable";
import { Filter } from 'lucide-react';
import FilterAttendanceModal from '../components/FilterAttendanceModal';
import { useAuthStore } from '@/store/useAuthStore';
import attendanceService from '@/services/attendance.service';
import { showErrorToast } from '@/utils/toast';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate, formatDay } from '@/features/leaves/utils/formatters';
import LeaveStatusBadge from '@/features/leaves/components/badges/LeaveStatusBadge';

const ParentAttendance = () => {
    const pageTitle = "Attendance";
    const pageSubtitle = "Track your child's attendance records and view attendance history.";
    const { user } = useAuthStore();

    const [todayStats, setTodayStats] = useState(null);
    const [summary, setSummary] = useState(null);
    const [studentInfo, setStudentInfo] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    // Pagination and Filtering
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({});
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1 });

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const fetchDashboard = useCallback(async () => {
        try {
            const res = await attendanceService.getDashboardStatsByRole(user.role);
            // console.log('This is response: ', res)
            setTodayStats(res?.today || null);
            setSummary(res?.summary);
            setStudentInfo(res?.studentInfo || null);
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        }
    }, [user.role]);

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: 10,
                ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
                ...filters
            };
            const res = await attendanceService.getAttendanceHistoryByRole(user.role, params);
            setHistory(res?.records);
            setPagination(res?.pagination ? {
                totalRecords: res.pagination.totalRecords,
                totalPages: res.pagination.totalPages
            } : { totalRecords: 0, totalPages: 1 });
        } catch (error) {
            showErrorToast('Failed to load attendance history', error.message);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearchQuery, filters, user.role]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const tableHeaders = ["Date", "Day", "Time ", "Status"];

    return (
        <div className="w-full h-full overflow-hidden p-4 md:p-6 flex flex-col bg-background-secondary">

            <PageHeader
                title={pageTitle}
                subtitle={pageSubtitle}
            />

            <div className="mb-6 shrink-0 mt-4">
                <ParentAttendanceStatsCards
                    studentInfo={studentInfo}
                    todayStatus={todayStats}
                    summary={summary}
                />
            </div>

            <DataTable
                headers={tableHeaders}
                items={history}
                loading={loading}
                searchPlaceholder="Search"
                searchQuery={searchQuery}
                onSearchChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                }}
                toolbarActions={
                    <button
                        type="button"
                        onClick={() => setIsFilterModalOpen(true)}
                        className={`p-2.5 rounded-md transition-colors shadow-sm md:shadow-none flex items-center justify-center ${Object.keys(filters).length > 0 ? 'bg-primary text-white border border-primary hover:bg-primary/90' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        title="Filter attendance"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                }
                renderRow={(r) => (
                    <>
                        <td className="p-4 text-text-secondary text-sm font-medium">
                            {formatDate(r.date)}
                        </td>
                        <td className="p-4 text-text-secondary text-sm">
                            {formatDay(r.date)}
                        </td>
                        <td className="p-4 text-text-secondary text-sm">
                            {r.markedAt}
                        </td>
                        <td className="p-4">
                            <LeaveStatusBadge status={r.status || 'pending'} />
                        </td>
                    </>
                )}
                renderMobileItem={(r) => (
                    <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-700 text-sm">
                                {formatDate(r.date)}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                                {formatDay(r.date)}
                            </span>
                        </div>
                        <hr className="border-gray-50" />
                        <div className="flex justify-between items-center gap-2 pt-1">
                            <span className="font-medium text-gray-500 text-xs">Status:</span>
                            <LeaveStatusBadge status={r.status || 'pending'} />
                        </div>
                    </div>
                )}
                page={page}
                setPage={setPage}
                limit={10}
                totalItems={pagination.totalRecords}
                totalPages={pagination.totalPages || 1}
            />

            <FilterAttendanceModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                filters={filters}
                onApply={(newFilters) => {
                    setFilters(newFilters);
                    setPage(1);
                    setIsFilterModalOpen(false);
                }}
                onReset={() => {
                    setFilters({});
                    setPage(1);
                    setIsFilterModalOpen(false);
                }}
            />
        </div>
    );
};

export default ParentAttendance;
