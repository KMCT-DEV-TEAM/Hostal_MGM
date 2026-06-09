import { createBrowserRouter } from 'react-router-dom';

import SuperAdminLogin from '@/pages/auth/SuperAdminLogin';
import AdminPortalLogin from '@/pages/auth/AdminPortalLogin';
import UserPortalLogin from '@/pages/auth/UserPortalLogin';
import ContactAdministrator from '@/pages/auth/ContactAdministrator';
import ForgotPassword from '@/pages/auth/ForgotPassword';

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
    }
])

export default router;