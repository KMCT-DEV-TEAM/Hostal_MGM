import { ROLES } from '@/constants/roles';
import DashboardOverview from '@/features/dashboard/pages/DashboardOverview';
import Administrator from '@/features/dashboard/pages/Administrator';
import WardenManagement from '@/features/dashboard/pages/WardenManagement';
import AssistantWardenManagement from '@/features/dashboard/pages/AssistantWardenManagement';
import Parents from '@/features/dashboard/pages/Parents';
import Students from '@/features/dashboard/pages/Students';
import StudentDetailView from '@/features/dashboard/components/students/StudentDetailView';
import AdminAttendance from '@/features/dashboard/pages/AdminAttendance';
// import SuperAdminAttendance from '@/features/dashboard/pages/SuperAdminAttendance';
import AttendanceScan from '@/features/dashboard/pages/AttendanceScan';
import Maintenance from '@/features/dashboard/pages/Maintenance';
import HostelManagement from '@/features/dashboard/pages/HostelManagement';
import BatchManagement from '@/features/dashboard/pages/BatchManagement';
import CourseManagement from '@/features/dashboard/pages/CourseManagement';
import DepartmentManagement from '@/features/dashboard/pages/DepartmentManagement';
import Profile from '@/features/dashboard/pages/Profile';
import Settings from '@/features/dashboard/pages/Settings';
import PasswordRequests from '@/features/dashboard/pages/PasswordRequests';
import Leaves from '@/features/leaves/pages/Leaves';
import LeaveDetails from '@/features/leaves/pages/LeaveDetails';
import Complaints from '@/features/dashboard/pages/Complaints';
import ComplaintCategories from '@/features/dashboard/pages/ComplaintCategories';
import MaintenanceStaffManagement from '@/features/dashboard/pages/MaintenanceStaffManagement';
import MaintenanceStaffTasks from '@/features/dashboard/pages/MaintenanceStaffTasks';
import MaintenanceAssignedTasks from '@/features/dashboard/pages/MaintenanceAssignedTasks';
import Logs from '@/features/dashboard/pages/Logs';
import Attendance from '@/features/dashboard/pages/Attendance';
import OrganizationManagement from '@/features/dashboard/pages/OrganizationManagement';
import Furniture from '@/features/furniture/pages/Furniture';
import FurnitureDetails from '@/features/furniture/pages/FurnitureDetails';
import NotificationsPage from '@/features/notifications/pages/NotificationsPage';
import VisitorsPage from '@/features/visitors/pages/VisitorsPage';
import VisitorHistoryPage from '@/features/visitors/pages/VisitorHistoryPage';
import VisitorDetails from '@/features/visitors/pages/VisitorDetails';
import AnnouncementManagement from '@/features/dashboard/pages/AnnouncementManagement';
import MentorsIndex from '@/features/dashboard/pages/MentorsIndex';
import Mentors from '@/features/dashboard/pages/Mentors';
export const dashboardRoutes = [

    {
        index: true,
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.ASSISTANT_WARDEN,
            ROLES.STUDENT,
            ROLES.MAINTENANCE_STAFF,
            ROLES.PARENT,
            ROLES.MENTOR
        ],
        element: DashboardOverview
    },
    {
        path: 'notifications',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.ASSISTANT_WARDEN,
            ROLES.STUDENT,
            ROLES.PARENT,
            ROLES.MENTOR
        ],
        element: NotificationsPage
    },
    {
        path: 'visitors',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.ASSISTANT_WARDEN,
            ROLES.PARENT,
            ROLES.STUDENT
        ],
        element: VisitorsPage
    },
    {
        path: 'visitors/history',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.ASSISTANT_WARDEN,
            ROLES.PARENT,
            ROLES.STUDENT
        ],
        element: VisitorHistoryPage
    },
    {
        path: 'visitors/:id',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.ASSISTANT_WARDEN,
            ROLES.PARENT,
            ROLES.STUDENT
        ],
        element: VisitorDetails
    },

    {
        path: 'administrators',
        roles: [
            ROLES.SUPER_ADMIN
        ],
        element: Administrator
    },
    {
        path: 'mentors',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN
        ],
        element: MentorsIndex
    },
    {
        path: 'mentors/:orgId',
        roles: [
            ROLES.SUPER_ADMIN
        ],
        element: Mentors
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
        path: 'assistant-wardens',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN
        ],
        element: AssistantWardenManagement
    },

    {
        path: 'parents',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.MENTOR

        ],
        element: Parents
    },

    {
        path: 'students',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.MENTOR,
            ROLES.ASSISTANT_WARDEN
        ],
        element: Students
    },

    {
        path: 'students/:id',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.ASSISTANT_WARDEN,
            ROLES.MENTOR
        ],
        element: StudentDetailView
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
        path: 'furniture',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN
            ,
            ROLES.ASSISTANT_WARDEN
        ],
        element: Furniture
    },
    {
        path: 'furniture/:id',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN
            ,
            ROLES.ASSISTANT_WARDEN
        ],
        element: FurnitureDetails
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
            ,
            ROLES.ASSISTANT_WARDEN
        ],
        element: Maintenance
    },
    {
        path: 'profile',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.ASSISTANT_WARDEN,
            ROLES.STUDENT,
            ROLES.PARENT,
            ROLES.MAINTENANCE_STAFF,
            ROLES.MENTOR
        ],
        element: Profile
    },
    {
        path: 'settings',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.ASSISTANT_WARDEN,
            ROLES.STUDENT,
            ROLES.PARENT,
            ROLES.MAINTENANCE_STAFF,
            ROLES.MENTOR
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
            ROLES.ASSISTANT_WARDEN,
            ROLES.STUDENT,
            ROLES.PARENT,
            ROLES.MENTOR
        ],
        element: Leaves
    },
    {
        path: 'leaves/details/:id',
        roles: [
            ROLES.STUDENT,
            ROLES.PARENT
        ],
        element: LeaveDetails
    },
    {
        path: 'leaves/:passType',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.ASSISTANT_WARDEN,
            ROLES.STUDENT,
            ROLES.PARENT,
            ROLES.MENTOR
        ],
        element: Leaves
    },
    {
        path: 'leaves/:passType/:hostelName',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.ASSISTANT_WARDEN,
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
            ROLES.ASSISTANT_WARDEN,
            ROLES.STUDENT
        ],
        element: Complaints
    },
    {
        path: 'complaints/:tab',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.ASSISTANT_WARDEN,
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
            ,
            ROLES.ASSISTANT_WARDEN
        ],
        element: MaintenanceStaffManagement
    },
    {
        path: 'maintenance-staff/:staffId/tasks',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN
            ,
            ROLES.ASSISTANT_WARDEN
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
        path: 'attendance',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.ASSISTANT_WARDEN,
            ROLES.STUDENT,
            ROLES.PARENT,
            ROLES.MENTOR
        ],
        element: Attendance
    },
    {
        path: 'attendance/:windowId',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.ASSISTANT_WARDEN,
            ROLES.MENTOR
        ],
        element: Attendance
    },
    {
        path: 'attendance/scan/:windowId',
        roles: [
            ROLES.WARDEN
            ,
            ROLES.ASSISTANT_WARDEN
        ],
        element: AttendanceScan
    },
    {
        path: 'logs',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN
        ],
        element: Logs
    },
    {
        path: 'tasks',
        roles: [
            ROLES.MAINTENANCE_STAFF,
            ROLES.WARDEN
            ,
            ROLES.ASSISTANT_WARDEN
        ],
        element: MaintenanceAssignedTasks
    },
    {
        path: 'announcements',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.ASSISTANT_WARDEN,
            ROLES.STUDENT,
            ROLES.PARENT,
            ROLES.MENTOR
        ],
        element: AnnouncementManagement
    },
    {
        path: 'announcements/:tab',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN,
            ROLES.ASSISTANT_WARDEN,
            ROLES.STUDENT,
            ROLES.PARENT
        ],
        element: AnnouncementManagement
    }
];