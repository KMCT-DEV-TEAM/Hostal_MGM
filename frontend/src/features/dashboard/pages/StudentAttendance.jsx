import React, { useState, useEffect, useCallback } from 'react';
<<<<<<< HEAD
import PageHeader from "@/components/ui/PageHeader";
import StudentAttendanceStatsCard from "../components/StudentAttendanceStatsCard";
import DataTable from "@/components/ui/DataTable";
import { Filter } from 'lucide-react';
import FilterAttendanceModal from '../components/attendance/FilterAttendanceModal';
=======
import FilterAttendanceModal from '../components/FilterAttendanceModal';
>>>>>>> 70cbe1840ffcda2fdf64db66a46fd9e0ec19b9c1
import { useAuthStore } from '@/store/useAuthStore';
import attendanceService from '@/services/attendance.service';
import { showErrorToast } from '@/utils/toast';
<<<<<<< HEAD

import { formatDateReadable, formatDay } from '@/utils/formatters';
import LeaveStatusBadge from '@/features/leaves/components/badges/LeaveStatusBadge';
import AttendanceQRModal from '../components/attendance/AttendanceQRModal';
=======
import AttendanceQRModal from '../components/AttendanceQRModal';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import StudentAttendanceDesktopView from '../views/StudentAttendanceDesktopView';
import StudentAttendanceMobileView from '../views/StudentAttendanceMobileView';
>>>>>>> 70cbe1840ffcda2fdf64db66a46fd9e0ec19b9c1

const StudentAttendanceContainer = () => {
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
            console.log('fetchDashboardStats response:', res);
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

    const { isMobile } = useBreakpoint();

    useEffect(() => {
        if (!isMobile) {
            fetchHistory();
        }
    }, [fetchHistory, isMobile]);

    const viewProps = {
        pageTitle,
        pageSubtitle,
        todayStats,
        history,
        loading,
        page,
        setPage,
        filters,
        pagination,
        setIsFilterModalOpen,
        setIsQRModalOpen
    };

    return (

        <>
            {isMobile ? (
                <StudentAttendanceMobileView {...viewProps} />
            ) : (
                <StudentAttendanceDesktopView {...viewProps} />
            )}

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
        </>
    );
};

export default StudentAttendanceContainer;