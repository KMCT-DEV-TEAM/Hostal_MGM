import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';

import Loadable from '@/components/Loadable';
import GuestGuard from '@/components/guards/GuestGuard';
import AuthGuard from '@/components/guards/AuthGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { ROLES } from '@/constants/roles';

import Wardenmanagement from '@/features/dashboard/components/Wardenmanagement';
import Parents from '@/features/dashboard/components/Parents';
import Students from '@/features/dashboard/components/Students';
import Organizationmanagement from '@/features/dashboard/components/Organizationmanagement';

// Helper for lazy + Loadable
const load = (importer) => Loadable(lazy(importer));

// Layouts
const DashboardLayout = load(() => import('@/layouts/DashboardLayout'));

// Auth Pages
const SuperAdminLogin = load(() => import('@/features/auth/pages/SuperAdminLogin'));
const AdminPortalLogin = load(() => import('@/features/auth/pages/AdminPortalLogin'));
const UserPortalLogin = load(() => import('@/features/auth/pages/UserPortalLogin'));
const ContactAdministrator = load(() => import('@/features/auth/pages/ContactAdministrator'));
const ForgotPassword = load(() => import('@/features/auth/pages/ForgotPassword'));
const VerifyOtp = load(() => import('@/features/auth/pages/VerifyOtp'));
const ResetPassword = load(() => import('@/features/auth/pages/ResetPassword'));

// Dashboard Pages
const DashboardOverview = load(() => import('@/features/dashboard/pages/DashboardOverview'));
const Administrator = load(() => import('@/features/dashboard/components/Administrator'));
const Maintainance = load(() => import('@/features/dashboard/components/Maintainance'));
// const Hostels = load(() => import('@/features/dashboard/components/Hostels').catch(() => {
//     return { default: () => <div className="p-6 text-center text-gray-500">Hostels under construction</div> };
// }));

// Reusable route helper
const guestRoute = (path, Component) => ({
    path,
    element: (
        <GuestGuard>
            <Component />
        </GuestGuard>
    )
});

const authRoutes = [
    ['/super-admin/login', SuperAdminLogin],
    ['/admin/login', AdminPortalLogin],
    ['/user/login', UserPortalLogin],
    ['/contact-administrator', ContactAdministrator],
    ['/forgot-password', ForgotPassword],
    ['/verify-otp', VerifyOtp],
    ['/reset-password', ResetPassword]
].map(([path, Component]) =>
    guestRoute(path, Component)
);

const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/dashboard" replace />
    },

    ...authRoutes,

    {
        path: '/dashboard',
        element: (
            <AuthGuard>
                <DashboardLayout />
            </AuthGuard>
        ),
        children: [
            {
                index: true,
                element: (
                    <RoleGuard roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN]}>
                        <DashboardOverview />
                    </RoleGuard>
                )
            },
            {
                path: 'administrators',
                element: (
                    <RoleGuard roles={[ROLES.SUPER_ADMIN]}>
                        <Administrator />
                    </RoleGuard>
                )
            },
            {
                path: 'wardens',
                element: (
                    <RoleGuard roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
                        <Wardenmanagement />
                    </RoleGuard>
                )
            },
            {
                path: 'parents',
                element: (
                    <RoleGuard roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN]}>
                        <Parents />
                    </RoleGuard>
                )
            },
            {
                path: 'students',
                element: (
                    <RoleGuard roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WARDEN]}>
                        <Students />
                    </RoleGuard>
                )
            },
            {
                path: 'organizations',
                element: (
                    <RoleGuard roles={[ROLES.SUPER_ADMIN]}>
                        <Organizationmanagement />
                    </RoleGuard>
                )
            },
            // {
            //     path: 'hostels',
            //     element: (
            //         <RoleGuard roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
            //             <Hostels />
            //         </RoleGuard>
            //     )
            // },
            {
                path: 'maintenance',
                element: (
                    <RoleGuard roles={[ROLES.WARDEN]}>
                        <Maintainance />
                    </RoleGuard>
                )
            },
            {
                path: '*',
                element: (
                    <div className="p-6 text-center text-gray-500">
                        Page under construction
                    </div>
                )
            }
        ]
    },

    {
        path: '*',
        element: <div className="p-10 text-center text-2xl">404 Not Found</div>
    }
]);

export default router;