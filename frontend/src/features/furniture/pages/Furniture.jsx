import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';

import AdminFurniture from './AdminFurniture';
import WardenFurniture from './WardenFurniture';

export default function Furniture() {
    const { user } = useAuthStore();

    if (user?.role === ROLES.WARDEN) {
        return <WardenFurniture />;
    }

    return <AdminFurniture />;
}
