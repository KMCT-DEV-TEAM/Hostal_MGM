import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import Loading from '@/components/ui/Loading';

const AuthGuard = ({ children }) => {
    const { user, loading } = useAuthStore();
    const location = useLocation();

    console.log('User:', user)

    if (loading) {
        return <Loading />;
    }

    if (!user) {
        // Redirect them to the /user/login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience
        // than dropping them off on the home page.
        return <Navigate to="/user/login" state={{ from: location }} replace />;
    }

    const isTempPassword = Boolean(user.tempPassword || user.temppass);

    if (isTempPassword && location.pathname !== '/force-password-change') {
        return <Navigate to="/force-password-change" replace />;
    }

    if (!isTempPassword && location.pathname === '/force-password-change') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default AuthGuard;
