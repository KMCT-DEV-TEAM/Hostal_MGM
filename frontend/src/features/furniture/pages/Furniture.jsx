import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import AdminFurniture from './AdminFurniture';
import WardenFurniture from './WardenFurniture';

export default function Furniture() {
    const role = useAuthStore((s) => s.user?.role);
    if (role === 'warden') {
        return <WardenFurniture />;
    }
    return <AdminFurniture />;
}
