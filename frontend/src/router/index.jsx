import { createBrowserRouter } from 'react-router-dom';

import SuperAdminLogin from '@/pages/auth/SuperAdminLogin';
import AdminPortalLogin from '@/pages/auth/AdminPortalLogin';
import UserPortalLogin from '@/pages/auth/UserPortalLogin';
import ContactAdministrator from '@/pages/auth/ContactAdministrator';

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
    }
])

export default router;