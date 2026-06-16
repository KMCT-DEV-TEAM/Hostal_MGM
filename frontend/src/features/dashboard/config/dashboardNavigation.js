import {
    LayoutGrid,
    Shield,
    User,
    GraduationCap,
    Users,
    Building2,
    Building,
    AlertTriangle,
    Calendar,
    CalendarX,
    UtensilsCrossed,
    BarChart2,
    KeyRound
} from 'lucide-react';

import { ROLES } from '@/constants/roles';

export const DASHBOARD_NAV = {

    [ROLES.SUPER_ADMIN]: [
        {
            section: 'MAIN',

            items: [
                {
                    icon: LayoutGrid,
                    label: 'Dashboard',
                    path: '/dashboard'
                }
            ]
        },

        {
            section: 'USER MANAGEMENT',

            items: [
                {
                    icon: Shield,
                    label: 'Admins',
                    path: '/dashboard/administrators'
                },

                {
                    icon: User,
                    label: 'Wardens',
                    path: '/dashboard/wardens'
                },

                {
                    icon: GraduationCap,
                    label: 'Students',
                    path: '/dashboard/students'
                },

                {
                    icon: Users,
                    label: 'Parents',
                    path: '/dashboard/parents'
                }
            ]
        },

        {
            section: 'ORGANIZATION',

            items: [
                {
                    icon: Building2,
                    label: 'Organizations',
                    path: '/dashboard/organizations'
                },

                {
                    icon: Building,
                    label: 'Hostels',
                    path: '/dashboard/hostels'
                }
            ]
        }
    ],


    [ROLES.ADMIN]: [
        {
            section: 'MAIN',

            items: [
                {
                    icon: LayoutGrid,
                    label: 'Dashboard',
                    path: '/dashboard'
                }
            ]
        },

        {
            section: 'USER MANAGEMENT',

            items: [
                {
                    icon: User,
                    label: 'Wardens',
                    path: '/dashboard/wardens'
                },

                {
                    icon: GraduationCap,
                    label: 'Students',
                    path: '/dashboard/students'
                },

                {
                    icon: Users,
                    label: 'Parents',
                    path: '/dashboard/parents'
                }
            ]
        },

        {
            section: 'HOSTELS',

            items: [
                {
                    icon: Building,
                    label: 'Hostels',
                    path: '/dashboard/hostels'
                }
            ]
        }
    ],


    [ROLES.WARDEN]: [
        {
            section: 'MAIN',

            items: [
                {
                    icon: LayoutGrid,
                    label: 'Dashboard',
                    path: '/dashboard'
                }
            ]
        },

        {
            section: 'STUDENT',

            items: [
                {
                    icon: GraduationCap,
                    label: 'Students',
                    path: '/dashboard/students'
                },

                {
                    icon: Users,
                    label: 'Parents',
                    path: '/dashboard/parents'
                }
            ]
        }
    ]

};