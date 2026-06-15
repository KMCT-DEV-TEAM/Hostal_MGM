import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '@/components/ui/Loading';

const GuestGuard = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading />;
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default GuestGuard;
