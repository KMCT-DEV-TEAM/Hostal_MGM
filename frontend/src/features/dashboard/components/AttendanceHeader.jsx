import React, { useState, useEffect, useCallback } from 'react';
import { Users, CalendarCheck, CalendarX, ScanLine, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '@/components/ui/StatsCard';
import attendanceService from '@/services/attendance.service';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';

export default function AttendanceHeader({ onStatsFetched }) {
    const [stats, setStats] = useState({
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        windowId: null,
        windowStatus: null,
        windowStartedAt: null,
        windowStartedByName: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const fetchTodayStats = useCallback(async () => {
        if (!user?.role) return;

        try {
            setIsLoading(true);
            const today = new Date().toISOString();
            const response = await attendanceService.getAdminWardenDashboardStatsByRole(user.role, { date: today });
            const data = response || {};
            const newStats = {
                totalStudents: data.totalStudents || 0,
                presentToday: data.presentToday || 0,
                absentToday: data.absentToday || 0,
                windowId: data.windowId || null,
                windowStatus: data.windowStatus || null,
                windowStartedAt: data.windowStartedAt || null,
                windowStartedByName: data.windowStartedByName || null
            };
            setStats(newStats);
            if (onStatsFetched) {
                onStatsFetched(newStats);
            }
        } catch (error) {
            showErrorToast('Failed to load attendance stats', error.message);
        } finally {
            setIsLoading(false);
        }
    }, [user?.role, onStatsFetched]);

    useEffect(() => {
        fetchTodayStats();
    }, [fetchTodayStats]);

    const handleCreateAttendance = async () => {
        if (stats.windowStatus === 'open' && stats.windowId) {
            navigate(`/dashboard/attendance/scan/${stats.windowId}`);
            return;
        }

        try {
            setIsCreating(true);
            const response = await attendanceService.createWindowByRole(user.role);
            showSuccessToast('Success', response?.message || 'Attendance window created');

            if (response?.data?._id) {
                navigate(`/dashboard/attendance/scan/${response.data._id}`);
            } else {
                fetchTodayStats();
            }
        } catch (error) {
            showErrorToast('Failed to create attendance', error.message);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Generate attendance QR codes and monitor student attendance records.
                    </p>
                </div>
                {user?.role === ROLES.WARDEN && (
                    <div className="flex flex-col items-end">
                        <button
                            onClick={handleCreateAttendance}
                            disabled={isCreating}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                            {isCreating ? 'Starting...' : (stats.windowStatus === 'open' ? 'Attendance in Progress' : "Mark Today's Attendance")}
                        </button>
                        {stats.windowStatus === 'open' && stats.windowStartedAt && (
                            <p className="text-xs text-gray-500 mt-2">
                                Started by {stats.windowStartedByName} at {new Date(stats.windowStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="lg:grid hidden  grid-cols-1 lg:grid-cols-3 gap-6">
                <StatsCard
                    label="TOTAL STUDENTS"
                    value={isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.totalStudents}
                    icon={<Users className="w-5 h-5 text-primary" />}
                    iconBg="bg-blue-50"
                    borderColor="border-t-2 border-t-primary"
                />
                <StatsCard
                    label="PRESENT TODAY"
                    value={isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.presentToday}
                    icon={<CalendarCheck className="w-5 h-5 text-success" />}
                    iconBg="bg-green-50"
                    borderColor="border-t-2 border-t-success"
                />
                <StatsCard
                    label="ABSENT TODAY"
                    value={isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.absentToday}
                    icon={<CalendarX className="w-5 h-5 text-danger" />}
                    iconBg="bg-red-50"
                    borderColor="border-t-2 border-t-warning"
                />
            </div>
        </div>
    );
}
