import { createBrowserRouter } from 'react-router-dom';

import SuperAdminLogin from '@/features/auth/pages/SuperAdminLogin';
import AdminPortalLogin from '@/features/auth/pages/AdminPortalLogin';
import UserPortalLogin from '@/features/auth/pages/UserPortalLogin';
import ContactAdministrator from '@/features/auth/pages/ContactAdministrator';
import ForgotPassword from '@/features/auth/pages/ForgotPassword';
import VerifyOtp from '@/features/auth/pages/VerifyOtp';
import ResetPassword from '@/features/auth/pages/ResetPassword';
import DashboardLayout from '@/layouts/DashboardLayout';


const router = createBrowserRouter([
    {
        path: '/super-admin/login',
        element: <SuperAdminLogin />
    },
    {
        path: '/admin/login',
        element: <AdminPortalLogin />
    },
    {
        path: '/user/login',
        element: <UserPortalLogin />
    },
    {
        path: '/contact-administrator',
        element: <ContactAdministrator />
    },
    {
        path: '/forgot-password',
        element: <ForgotPassword />
    },
    {
        path: '/verify-otp',
        element: <VerifyOtp />
    },
    {
        path: '/reset-password',
        element: <ResetPassword />
    },
    {
        path: '/dashboard-layout',
        element: <DashboardLayout />
    },

])

export default router;