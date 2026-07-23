import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import MentorOrganizations from './MentorOrganizations';
import Mentors from './Mentors';

export default function MentorsIndex() {
    const role = useAuthStore((s) => s.user?.role);

    if (role === ROLES.SUPER_ADMIN) {
        return <MentorOrganizations />;
    }

    return <Mentors />;
}
