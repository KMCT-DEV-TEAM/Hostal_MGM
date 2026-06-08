import { createBrowserRouter } from 'react-router-dom';

import SuperAdmin from '../pages/auth/SuperAdminLogin';
import AdminLogin from '../pages/auth/AdminLogin';

const router = createBrowserRouter([
    {
        path: '/super-admin/login',
        element: <SuperAdmin />
    },
    {
        path: '/admin/login',
        element: <AdminLogin />
    },
])

export default router;