import {
    LayoutGrid,
    ShieldUser,
    UserRoundCheck,
    GraduationCap,
    Users,
    Building2,
    Building,
    AlertTriangle,
    Calendar,
    CalendarX,
    UtensilsCrossed,
    BarChart2,
    KeyRound,
    BookOpen,
    Layers,
    Tags,
    Wrench
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
                    icon: ShieldUser,
                    label: 'Admins',
                    path: '/dashboard/administrators'
                },

                {
                    icon: UserRoundCheck,
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
        },

        {
            section: 'ACADEMICS',

            items: [
                {
                    icon: Building2,
                    label: 'Departments',
                    path: '/dashboard/departments'
                },
                {
                    icon: Layers,
                    label: 'Batches',
                    path: '/dashboard/batches'
                },
                {
                    icon: BookOpen,
                    label: 'Courses',
                    path: '/dashboard/courses'
                }
            ]
        },

        {
            section: 'CATEGORIES',

            items: [
                {
                    icon: Tags,
                    label: 'Complaint Category',
                    path: '/dashboard/complaint-categories'
                }
            ]
        },

        {
            section: 'OPERATIONS',

            items: [
                {
                    icon: AlertTriangle,
                    label: 'Complaints',
                    path: '/dashboard/complaints',
                    subItems: [
                        { label: 'Complaints', path: '/dashboard/complaints' },
                        { label: 'Maintenance Staff', path: '/dashboard/maintenance-staff' }
                    ],
                    badge: { count: 12, variant: 'danger' }
                },
                {
                    icon: Calendar,
                    label: 'Attendance',
                    path: '/dashboard/attendance'
                },
                {
                    icon: CalendarX,
                    label: 'Leave Requests',
                    path: '/dashboard/leaves',

                    subItems: [
                        { label: 'Home Pass', path: '/dashboard/leaves/home-pass' },
                        { label: 'Out Pass', path: '/dashboard/leaves/outpass' }
                    ],
                    badge: { count: 7, variant: 'warning' }

                },
                {
                    icon: UtensilsCrossed,
                    label: 'Mess Management',
                    path: '/dashboard/mess-management'
                },

            ]
        },

        {
            section: 'REPORTS',
            items: [
                {
                    icon: BarChart2,
                    label: 'Reports',
                    path: '/dashboard/reports'
                }
            ]
        },

        {
            section: 'SUPPORT',
            items: [
                {
                    icon: KeyRound,
                    label: 'Password Request',
                    path: '/dashboard/password-request'
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
                    icon: UserRoundCheck,
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
        },

        {
            section: 'ACADEMICS',

            items: [
                {
                    icon: Building2,
                    label: 'Departments',
                    path: '/dashboard/departments'
                },
                {
                    icon: Layers,
                    label: 'Batches',
                    path: '/dashboard/batches'
                },
                {
                    icon: BookOpen,
                    label: 'Courses',
                    path: '/dashboard/courses'
                }
            ]
        },

        {
            section: 'OPERATIONS',

            items: [
                {
                    icon: AlertTriangle,
                    label: 'Complaints',
                    path: '/dashboard/complaints',
                    subItems: [
                        { label: 'Complaints', path: '/dashboard/complaints' },
                        { label: 'Maintenance Staff', path: '/dashboard/maintenance-staff' }
                    ],
                    badge: { count: 12, variant: 'danger' }
                },
                {
                    icon: Calendar,
                    label: 'Attendance',
                    path: '/dashboard/attendance'
                },
                {
                    icon: CalendarX,
                    label: 'Leave Requests',
                    path: '/dashboard/leaves',

                    subItems: [
                        { label: 'Home Pass', path: '/dashboard/leaves/home-pass' },
                        { label: 'Out Pass', path: '/dashboard/leaves/outpass' }
                    ],
                    badge: { count: 7, variant: 'warning' }

                },
                {
                    icon: UtensilsCrossed,
                    label: 'Mess Management',
                    path: '/dashboard/mess-management'
                },

            ]
        },

        {
            section: 'REPORTS',
            items: [
                {
                    icon: BarChart2,
                    label: 'Reports',
                    path: '/dashboard/reports'
                }
            ]
        },
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
            section: 'USER MANAGEMENT',

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
        },

        {
            section: 'OPERATIONS',

            items: [
                {
                    icon: AlertTriangle,
                    label: 'Complaints',
                    path: '/dashboard/complaints',
                    subItems: [
                        { label: 'Complaints', path: '/dashboard/complaints' },
                        { label: 'Maintenance Staff', path: '/dashboard/maintenance-staff' }
                    ],
                    badge: { count: 12, variant: 'danger' }
                },
                {
                    icon: Calendar,
                    label: 'Attendance',
                    path: '/dashboard/attendance'
                },
                {
                    icon: CalendarX,
                    label: 'Leave Requests',
                    path: '/dashboard/leaves',

                    subItems: [
                        { label: 'Home Pass', path: '/dashboard/leaves/home-pass' },
                        { label: 'Out Pass', path: '/dashboard/leaves/outpass' }
                    ],
                    badge: { count: 7, variant: 'warning' }

                },
                {
                    icon: UtensilsCrossed,
                    label: 'Mess Management',
                    path: '/dashboard/mess-management'
                },

            ]
        },

        {
            section: 'REPORTS',
            items: [
                {
                    icon: BarChart2,
                    label: 'Reports',
                    path: '/dashboard/reports'
                }
            ]
        },
    ],

    [ROLES.STUDENT]: [
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
            section: 'OPERATIONS',
            items: [
                {
                    icon: AlertTriangle,
                    label: 'Complaints',
                    path: '/dashboard/complaints',
                    badge: { count: 12, variant: 'danger' }
                },
                {
                    icon: Calendar,
                    label: 'Attendance',
                    path: '/dashboard/attendance'
                },
                {
                    icon: CalendarX,
                    label: 'Leave Requests',
                    path: '/dashboard/leaves',
                    subItems: [
                        { label: 'Home Pass', path: '/dashboard/leaves/home-pass' },
                        { label: 'Out Pass', path: '/dashboard/leaves/outpass' }
                    ],
                    badge: { count: 7, variant: 'warning' }
                },
                {
                    icon: UtensilsCrossed,
                    label: 'Mess Management',
                    path: '/dashboard/mess-management'
                }
            ]
        }
    ],

    [ROLES.PARENT]: [
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
            section: 'OPERATIONS',
            items: [
                {
                    icon: AlertTriangle,
                    label: 'Complaints',
                    path: '/dashboard/complaints'
                },
                {
                    icon: Calendar,
                    label: 'Attendance',
                    path: '/dashboard/attendance'
                },
                {
                    icon: CalendarX,
                    label: 'Leave Requests',
                    path: '/dashboard/leaves',
                    subItems: [
                        { label: 'Home Pass', path: '/dashboard/leaves/home-pass' },
                        { label: 'Out Pass', path: '/dashboard/leaves/outpass' }
                    ]
                }
            ]
        }
    ]

};