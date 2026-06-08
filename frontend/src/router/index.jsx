import { createBrowserRouter } from 'react-router-dom';

import SuperAdmin from '../pages/auth/SuperAdmin';

const router = createBrowserRouter([
    {
        path: '/super-admin/login',
        element: <SuperAdmin />
    },
])

export default router;