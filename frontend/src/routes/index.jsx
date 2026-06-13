import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';

import Loadable from '@/components/Loadable';
import GuestGuard from '@/components/guards/GuestGuard';
import AuthGuard from '@/components/guards/AuthGuard';

// Helper for lazy + Loadable
const load = (path) => Loadable(lazy(() => import(path)));

// Layouts
const DashboardLayout = load('@/layouts/DashboardLayout');

// Auth Pages
const SuperAdminLogin = load('@/features/auth/pages/SuperAdminLogin');
const AdminPortalLogin = load('@/features/auth/pages/AdminPortalLogin');
const UserPortalLogin = load('@/features/auth/pages/UserPortalLogin');
const ContactAdministrator = load('@/features/auth/pages/ContactAdministrator');
const ForgotPassword = load('@/features/auth/pages/ForgotPassword');
const VerifyOtp = load('@/features/auth/pages/VerifyOtp');
const ResetPassword = load('@/features/auth/pages/ResetPassword');

// Dashboard Pages
const SuperAdminDashboard = load('@/features/dashboard/pages/SuperAdminDashboard');
const Administrator = load('@/features/dashboard/components/Administrator');
const Maintainance = load('@/features/dashboard/components/Maintainance');

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
                element: <SuperAdminDashboard />
            },
            {
                path: 'administrators',
                element: <Administrator />
            },
            {
                path: 'maintenance',
                element: <Maintainance />
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