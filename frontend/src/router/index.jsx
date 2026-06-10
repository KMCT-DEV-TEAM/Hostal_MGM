import { createBrowserRouter } from 'react-router-dom';

import SuperAdminLogin from '@/pages/auth/SuperAdminLogin';
import AdminPortalLogin from '@/pages/auth/AdminPortalLogin';
import UserPortalLogin from '@/pages/auth/UserPortalLogin';
import ContactAdministrator from '@/pages/auth/ContactAdministrator';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import VerifyOtp from '@/pages/auth/VerifyOtp';
import ResetPassword from '@/pages/auth/ResetPassword';

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
    }
])

export default router;