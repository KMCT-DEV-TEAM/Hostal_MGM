import { ROLES } from '@/constants/roles';

import DashboardOverview from '@/features/dashboard/pages/DashboardOverview';
import Administrator from '@/features/dashboard/pages/Administrator';
import WardenManagement from '@/features/dashboard/pages/WardenManagement';
import Parents from '@/features/dashboard/pages/Parents';
import Students from '@/features/dashboard/pages/Students';
import OrganizationManagement from '@/features/dashboard/pages/OrganizationManagement';
import Maintenance from '@/features/dashboard/pages/Maintenance';
import HostelManagement from '@/features/dashboard/pages/HostelManagement';
import BatchManagement from '@/features/dashboard/pages/BatchManagement';
import CourseManagement from '@/features/dashboard/pages/CourseManagement';
import DepartmentManagement from '@/features/dashboard/pages/DepartmentManagement';
import Profile from '@/features/dashboard/pages/Profile';
import Settings from '@/features/dashboard/pages/Settings';
import PasswordRequests from '@/features/dashboard/pages/PasswordRequests';
import Leaves from '@/features/leaves/pages/Leaves';
import Complaints from '@/features/dashboard/pages/Complaints';
import ComplaintCategories from '@/features/dashboard/pages/ComplaintCategories';
import MaintenanceStaffManagement from '@/features/dashboard/pages/MaintenanceStaffManagement';
import MaintenanceStaffTasks from '@/features/dashboard/pages/MaintenanceStaffTasks';
import MaintenanceAssignedTasks from '@/features/dashboard/pages/MaintenanceAssignedTasks';
import Logs from '@/features/dashboard/pages/Logs';

export const dashboardRoutes = [

    {
        index: true,
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.STUDENT,
            ROLES.MAINTENANCE_STAFF
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
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN
        ],
        element: OrganizationManagement
    },
    {
        path: 'hostels',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN
        ],
        element: HostelManagement
    },

    {
        path: 'batches',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN
        ],
        element: BatchManagement
    },

    {
        path: 'courses',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN
        ],
        element: CourseManagement
    },

    {
        path: 'departments',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN
        ],
        element: DepartmentManagement
    },

    {
        path: 'maintenance',
        roles: [
            ROLES.WARDEN
        ],
        element: Maintenance
    },
    {
        path: 'profile',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN
        ],
        element: Profile
    },
    {
        path: 'settings',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN
        ],
        element: Settings
    },
    {
        path: 'password-request',
        roles: [
            ROLES.SUPER_ADMIN
        ],
        element: PasswordRequests
    },
    {

        path: 'leaves',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.STUDENT,
            ROLES.PARENT
        ],
        element: Leaves
    },
    {
        path: 'leaves/:passType',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.STUDENT,
            ROLES.PARENT
        ],
        element: Leaves
    },
    {
        path: 'leaves/:passType/:hostelName',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.STUDENT,
            ROLES.PARENT
        ],
        element: Leaves
    },
    {
        path: 'complaints',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.STUDENT
        ],
        element: Complaints
    },
    {
        path: 'maintenance-staff',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN
        ],
        element: MaintenanceStaffManagement
    },
    {
        path: 'maintenance-staff/:staffId/tasks',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN
        ],
        element: MaintenanceStaffTasks
    },
    {
        path: 'complaint-categories',
        roles: [
            ROLES.SUPER_ADMIN
        ],
        element: ComplaintCategories
    },
    {
        path: 'logs',
        roles: [
            ROLES.SUPER_ADMIN
        ],
        element: Logs
    },
    {
        path: 'tasks',
        roles: [
            ROLES.MAINTENANCE_STAFF,
            ROLES.WARDEN
        ],
        element: MaintenanceAssignedTasks
    }
];