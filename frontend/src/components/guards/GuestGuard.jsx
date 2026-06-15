import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import Loading from '@/components/ui/Loading';

function GuestGuard({ children }) {
    const { authenticated, loading } = useAuthStore();

    if (loading) {
        return <Loading />;
    }

    if (authenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default GuestGuard;
