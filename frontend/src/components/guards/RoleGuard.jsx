import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '@/components/ui/Loading';

const RoleGuard = ({ requiredRoles, children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading />;
    }

    if (!user) {
        return <Navigate to="/user/login" replace />;
    }

    // Assuming user object has a `role` property.
    // Ensure that `user.role` matches one of the `requiredRoles`.
    if (!requiredRoles.includes(user.role)) {
        // You might want to create an Error page for 403 Forbidden
        // For now, redirect to dashboard root.
        return <Navigate to="/dashboard-layout" replace />;
    }

    return children;
};

export default RoleGuard;
