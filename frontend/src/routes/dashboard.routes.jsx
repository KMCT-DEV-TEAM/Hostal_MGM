import { ROLES } from '@/constants/roles';

import DashboardOverview from '@/features/dashboard/pages/DashboardOverview';
import Administrator from '@/features/dashboard/pages/Administrator';
import WardenManagement from '@/features/dashboard/pages/WardenManagement';
import Parents from '@/features/dashboard/pages/Parents';
import Students from '@/features/dashboard/pages/Students';
import OrganizationManagement from '@/features/dashboard/pages/OrganizationManagement';
import Maintenance from '@/features/dashboard/pages/Maintenance';
import HostelManagement from '@/features/dashboard/pages/HostelManagement';

export const dashboardRoutes = [

    {
        index: true,
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN
        ],
        element: DashboardOverview
    },

    {
        path: 'administrators',
        roles: [
            ROLES.SUPER_ADMIN
        ],
        element: Administrator
    },

    {
        path: 'wardens',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN
        ],
        element: WardenManagement
    },

    {
        path: 'parents',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN
        ],
        element: Parents
    },

    {
        path: 'students',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN
        ],
        element: Students
    },

    {
        path: 'organizations',
        roles: [
            ROLES.SUPER_ADMIN
        ],
        element: OrganizationManagement
    },
    {
        path: 'hostels',
        roles: [
            ROLES.SUPER_ADMIN
        ],
        element: HostelManagement
    },

    {
        path: 'maintenance',
        roles: [
            ROLES.WARDEN
        ],
        element: Maintenance
    }

];