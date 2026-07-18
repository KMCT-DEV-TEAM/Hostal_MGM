import React, { useState, useEffect } from 'react';
import studentService from '@/services/student.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';
import {
    Calendar,
    CalendarClock,
    Megaphone,
    Headset,
    TriangleAlert,
    MessageSquare
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Dropdown from '@/components/ui/Dropdown';
import { useNavigate } from 'react-router-dom';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import StudentDashboardDesktopView from '../views/StudentDashboardDesktopView';
import StudentDashboardMobileView from '../views/StudentDashboardMobileView';

export default function StudentDashboard() {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isMobile } = useBreakpoint();
    const [period, setPeriod] = useState('This Year');
    const [radialPeriod, setRadialPeriod] = useState('This Month');
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                const res = await studentService.getStudentDashboardStats({ period, radialPeriod });
                setDashboardData(res?.data);
            } catch (err) {
                console.error("Failed to fetch student stats", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [period, radialPeriod]);

    const attendanceData = dashboardData?.monthlyAttendance || [];
    const radialData = [
        { name: 'Absent', value: 100 - (dashboardData?.attendanceRate || 0), color: '#F3F4F6' },
        { name: 'Present', value: dashboardData?.attendanceRate || 0, color: '#0F6E56' }
    ];
    const leaveRequests = dashboardData?.recentLeaveRequests || [];
    const complaints = dashboardData?.recentComplaints || [];
    const recentAnnouncements = dashboardData?.recentAnnouncements || [];

    return isMobile ? (
        <StudentDashboardMobileView
            user={user}
            period={period}
            setPeriod={setPeriod}
            radialPeriod={radialPeriod}
            setRadialPeriod={setRadialPeriod}
            dashboardData={dashboardData}
            attendanceData={attendanceData}
            radialData={radialData}
            leaveRequests={leaveRequests}
            complaints={complaints}
            recentAnnouncements={recentAnnouncements}
            isLoading={isLoading}
            onNavigate={navigate}
        />
    ) : (
        <StudentDashboardDesktopView
            user={user}
            period={period}
            setPeriod={setPeriod}
            radialPeriod={radialPeriod}
            setRadialPeriod={setRadialPeriod}
            dashboardData={dashboardData}
            attendanceData={attendanceData}
            radialData={radialData}
            leaveRequests={leaveRequests}
            complaints={complaints}
            recentAnnouncements={recentAnnouncements}
            isLoading={isLoading}
            onNavigate={navigate}
        />
    );
}
