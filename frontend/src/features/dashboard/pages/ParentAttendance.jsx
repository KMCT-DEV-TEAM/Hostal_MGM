import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import ParentAttendanceStatsCards from "../components/ParentAttendanceStatsCards";
import DataTable from "@/components/ui/DataTable";
import { Filter } from 'lucide-react';
import FilterAttendanceModal from '../components/attendance/FilterAttendanceModal';
import { useAuthStore } from '@/store/useAuthStore';
import attendanceService from '@/services/attendance.service';
import { showErrorToast } from '@/utils/toast';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateReadable, formatDay } from '@/utils/formatters';
import LeaveStatusBadge from '@/features/leaves/components/badges/LeaveStatusBadge';
import InfoCard from '@/components/ui/InfoCard';

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
        <div className="w-full h-full overflow-y-auto md:overflow-hidden p-4 md:p-6 flex flex-col bg-background-secondary">

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
                renderRow={(r) => (
                    <>
                        <td className="p-4 text-text-secondary text-sm font-medium">
                            {formatDateReadable(r.date)}
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
                    <div>
                        <InfoCard
                            title={formatDateReadable(r.date)}
                            subtitle={formatDay(r.date)}
                            fields={[
                                { label: "Time", value: r.markedAt || '--' },
                                // { label: "Status", value: <LeaveStatusBadge status={r.status || 'pending'} /> }
                            ]}
                            status={{ text: r.status || 'pending', color: r.status === 'Present' ? 'green' : r.status === 'Absent' ? 'red' : r.status === 'On_leave' ? 'orenge' : 'default' }}

                        />
                    </div>
                )}
                page={page}
                setPage={setPage}
                limit={10}
                totalItems={pagination.totalRecords}
                totalPages={pagination.totalPages || 1}
            >
                {/* Custom Toolbar Actions */}
                <button
                    type="button"
                    onClick={() => setIsFilterModalOpen(true)}
                    className={`p-2.5 rounded-xl transition-colors shadow-sm md:shadow-none flex items-center justify-center shrink-0 ${Object.keys(filters).length > 0 ? 'bg-[#0A437A] text-white border-[#0A437A] hover:bg-[#0A437A]/90' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-10 w-10'}`}
                    title="Filter attendance"
                >
                    <Filter className="w-4 h-4" />
                </button>
            </DataTable>

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
