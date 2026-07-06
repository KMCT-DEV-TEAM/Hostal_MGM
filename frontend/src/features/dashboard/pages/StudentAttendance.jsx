import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from "@/components/ui/PageHeader";
import StudentAttendanceStatsCard from "../components/StudentAttendanceStatsCard";
import DataTable from "@/components/ui/DataTable";
import { Filter } from 'lucide-react';
import FilterAttendanceModal from '../components/FilterAttendanceModal';
import { useAuthStore } from '@/store/useAuthStore';
import attendanceService from '@/services/attendance.service';
import { showErrorToast } from '@/utils/toast';

import { formatDateReadable, formatDay } from '@/utils/formatters';
import LeaveStatusBadge from '@/features/leaves/components/badges/LeaveStatusBadge';
import AttendanceQRModal from '../components/AttendanceQRModal';

const StudentAttendance = () => {
    const pageTitle = "My Attendance";
    const pageSubtitle = "Mark and track attendance.";
    const { user } = useAuthStore();

    const [todayStats, setTodayStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({});
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1 });

    const fetchDashboardStats = useCallback(async () => {
        if (!user?.role) return;
        try {
            const res = await attendanceService.getDashboardStatsByRole(user.role);
            setTodayStats(res?.today || null);
        } catch (error) {
            console.error('Failed to load dashboard stats', error);
        }
    }, [user?.role]);

    const fetchHistory = useCallback(async () => {
        if (!user?.role) return;
        try {
            setLoading(true);
            const params = {
                page,
                limit: 10,
                ...filters
            };
            const res = await attendanceService.getAttendanceHistoryByRole(user.role, params);
            setHistory(res?.records || []);
            setPagination(res?.pagination ? {
                totalRecords: res.pagination.totalRecords,
                totalPages: res.pagination.totalPages
            } : { totalRecords: 0, totalPages: 1 });
        } catch (error) {
            showErrorToast('Failed to load attendance history', error.message);
        } finally {
            setLoading(false);
        }
    }, [user?.role, page, filters]);

    useEffect(() => {
        fetchDashboardStats();
    }, [fetchDashboardStats]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const tableHeaders = ["Date", "Day", "Time", "Status"];

    return (
        <div className="w-full h-full overflow-hidden p-4 md:p-6 flex flex-col bg-background-secondary">
            <div className="mb-6 shrink-0">
                <PageHeader title={pageTitle} subtitle={pageSubtitle} />
            </div>

            <div className="mb-6 shrink-0">
                <StudentAttendanceStatsCard
                    todayStatus={todayStats}
                    onGenerateQR={() => setIsQRModalOpen(true)}
                />
            </div>

            <DataTable

                toolbarActions={
                    <button
                        type="button"
                        onClick={() => setIsFilterModalOpen(true)}
                        className={`p-2.5 rounded-md transition-colors shadow-sm md:shadow-none flex items-center justify-center ${Object.keys(filters).length > 0 ? 'bg-primary text-white border border-primary hover:bg-primary/90' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                }
                headers={tableHeaders}
                items={history}
                loading={loading}
                canSelect={false}
                emptyText="No attendance records found."
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
                    <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-700 text-sm">
                                {formatDateReadable(r.scannedAt || r.createdAt)}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                                {formatDay(r.scannedAt || r.createdAt)}
                            </span>
                        </div>
                        <hr className="border-gray-50" />
                        <div className="flex justify-between items-center gap-2 pt-1">
                            <span className="font-medium text-gray-500 text-xs">Status:</span>
                            <LeaveStatusBadge status={r.status} />
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

            <AttendanceQRModal
                isOpen={isQRModalOpen}
                onClose={() => setIsQRModalOpen(false)}
                qrToken={user?.qrToken}
            />
        </div>
    );
};

export default StudentAttendance;