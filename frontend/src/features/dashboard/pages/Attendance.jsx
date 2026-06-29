import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';

import AdminAttendance from './AdminAttendance';
import WardenAttendance from './WardenAttendance';
import StudentAttendance from './StudentAttendance';
import ParentAttendance from './ParentAttendance';

export default function Attendance() {
    const { user } = useAuthStore();

    if (user?.role === ROLES.STUDENT) {
        return <StudentAttendance />;
    }

    if (user?.role === ROLES.PARENT) {
        return <ParentAttendance />;
    }

    if (user?.role === ROLES.WARDEN) {
        return <WardenAttendance />;
    }

    return <AdminAttendance />;
}
