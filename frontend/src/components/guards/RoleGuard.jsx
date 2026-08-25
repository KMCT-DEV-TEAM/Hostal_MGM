import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import Forbidden from '@/components/errors/Forbidden';

export default function RoleGuard({ roles = [], children }) {
    const { user } = useAuthStore();

    const userRole = (user?.role || '').toLowerCase();
    const normalizedAllowedRoles = roles.map(r => String(r).toLowerCase());

    if (!userRole || !normalizedAllowedRoles.includes(userRole)) {
        return <Forbidden />;
    }

    return children;
}
