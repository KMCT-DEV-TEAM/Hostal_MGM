import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getParentDashboardStats } from '@/services/parent.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import ParentDashboardDesktopView from '../views/ParentDashboardDesktopView';
import ParentDashboardMobileView from '../views/ParentDashboardMobileView';

export default function ParentDashboard() {
    const { isMobile } = useBreakpoint();
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [period, setPeriod] = useState('This Year');
    const [radialPeriod, setRadialPeriod] = useState('This Month');
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getParentDashboardStats({ period, radialPeriod });
                setDashboardData(res?.data);
            } catch (err) {
                console.error("Failed to fetch parent stats", err);
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
    const visitors = dashboardData?.recentVisitors || [];
    const pendingParentLeaveRequests = dashboardData?.pendingParentLeaveRequests || [];

    return isMobile ? (
        <ParentDashboardMobileView
            user={user}
            period={period}
            setPeriod={setPeriod}
            radialPeriod={radialPeriod}
            setRadialPeriod={setRadialPeriod}
            dashboardData={dashboardData}
            attendanceData={attendanceData}
            radialData={radialData}
            leaveRequests={leaveRequests}
            visitors={visitors}
            pendingParentLeaveRequests={pendingParentLeaveRequests}

            onNavigate={navigate}
        />
    ) : (
        <ParentDashboardDesktopView
            user={user}
            period={period}
            setPeriod={setPeriod}
            radialPeriod={radialPeriod}
            setRadialPeriod={setRadialPeriod}
            dashboardData={dashboardData}
            attendanceData={attendanceData}
            radialData={radialData}
            leaveRequests={leaveRequests}
            visitors={visitors}
            onNavigate={navigate}
        />
    );
}
