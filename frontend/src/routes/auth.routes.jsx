import { lazy } from 'react';
import Loadable from '@/components/Loadable';
import GuestGuard from '@/components/guards/GuestGuard';

const load = (importer) => Loadable(lazy(importer));

const SuperAdminLogin = load(() => import('@/features/auth/pages/SuperAdminLogin'));
const AdminPortalLogin = load(() => import('@/features/auth/pages/AdminPortalLogin'));
const UserPortalLogin = load(() => import('@/features/auth/pages/UserPortalLogin'));
const ContactAdministrator = load(() => import('@/features/auth/pages/ContactAdministrator'));
const ForgotPassword = load(() => import('@/features/auth/pages/ForgotPassword'));
const VerifyOtp = load(() => import('@/features/auth/pages/VerifyOtp'));
const ResetPassword = load(() => import('@/features/auth/pages/ResetPassword'));
const MaintenanceStaffLogin = load(() => import('@/features/auth/pages/MaintenanceStaffLogin'));

export const guestRoute = (path, Component) => ({
    path,
    element: (
        <GuestGuard>
            <Component />
        </GuestGuard>
    )
});

export const authRoutes = [
    ['/super-admin/login', SuperAdminLogin],
    ['/admin/login', AdminPortalLogin],
    ['/user/login', UserPortalLogin],
    ['/contact-administrator', ContactAdministrator],
    ['/forgot-password', ForgotPassword],
    ['/verify-otp', VerifyOtp],
    ['/reset-password', ResetPassword],
    ['/m-user/login', MaintenanceStaffLogin]
].map(([path, Component]) => guestRoute(path, Component));
