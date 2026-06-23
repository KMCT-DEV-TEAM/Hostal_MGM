import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';

import AdminComplaints from './AdminComplaints';
import StudentComplaints from './StudentComplaints';
import WardenComplaints from './WardenComplaints';

export default function Complaints() {
    const { user } = useAuthStore();

    if (user?.role === ROLES.STUDENT) {
        return <StudentComplaints />;
    }

    if (user?.role === ROLES.WARDEN) {
        return <WardenComplaints />;
    }

    return <AdminComplaints />;
}
