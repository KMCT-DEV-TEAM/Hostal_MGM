import { createBrowserRouter } from 'react-router-dom';

import SuperAdminLogin from '@/pages/auth/SuperAdminLogin';
import AdminPortalLogin from '@/pages/auth/AdminPortalLogin';
import UserPortalLogin from '@/pages/auth/UserPortalLogin';

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
    }
])

export default router;