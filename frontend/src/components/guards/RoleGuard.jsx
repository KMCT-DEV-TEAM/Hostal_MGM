import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export default function RoleGuard({ roles, children }) {
    const { user } = useAuthStore();

    if (!roles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}