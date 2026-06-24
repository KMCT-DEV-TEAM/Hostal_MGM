import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';

import Loadable from '@/components/Loadable';
import AuthGuard from '@/components/guards/AuthGuard';
import RoleGuard from '@/components/guards/RoleGuard';

import { authRoutes } from './auth.routes';
import { dashboardRoutes } from './dashboard.routes';

const load = (importer) => Loadable(lazy(importer));

// Layouts
const LayoutDispatcher = load(() => import('@/layouts/LayoutDispatcher'));

// Pages
const ForcePasswordChange = load(() => import('@/features/auth/pages/ForcePasswordChange'));

// Reusable protected route helper
const protectedRoute = (Component, roles) => ({
    element: (
        <RoleGuard roles={roles}>
            <Component />
        </RoleGuard>
    )
});

const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/dashboard" replace />
    },

    ...authRoutes,

    {
        path: '/force-password-change',
        element: (
            <AuthGuard>
                <ForcePasswordChange />
            </AuthGuard>
        )
    },

    {
        path: '/dashboard',
        element: (
            <AuthGuard>
                <LayoutDispatcher />
            </AuthGuard>
        ),
        children: [
            ...dashboardRoutes.map(({ element, roles, ...route }) => ({
                ...route,
                ...protectedRoute(element, roles)
            })),
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