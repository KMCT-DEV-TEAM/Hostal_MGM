import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';

import AdminLeaves from './AdminLeaves';
import StudentLeaves from './StudentLeaves';
import ParentLeaves from './ParentLeaves';

export default function Leaves() {
    const role = useAuthStore((s) => s.user?.role);

    if (role === ROLES.STUDENT) {
        return <StudentLeaves />;
    }

    if (role === ROLES.PARENT) {
        return <ParentLeaves />;
    }

    // Default to Admin/Warden/SuperAdmin leaves view
    return <AdminLeaves />;
}
