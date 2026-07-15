import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import Forbidden from '@/components/errors/Forbidden';

export default function RoleGuard({ roles, children }) {
    const { user } = useAuthStore();

    if (!roles.includes(user.role)) {
        return <Forbidden />;
    }

    return children;
}
