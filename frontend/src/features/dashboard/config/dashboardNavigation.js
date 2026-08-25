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
    BookOpen,
    Layers,
    Tags,
    Wrench,
    ClipboardList,
    Armchair,
    Megaphone
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
                },
                {
                    icon: Megaphone,
                    label: 'Announcements',
                    path: '/dashboard/announcements',
                    subItems: [
                        { label: 'Announcement', path: '/dashboard/announcements/latest' },
                        { label: 'History', path: '/dashboard/announcements/history' }
                    ]
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
                    icon: UserRoundCheck,
                    label: 'Assistant Wardens',
                    path: '/dashboard/assistant-wardens'
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
                },

                {
                    icon: ShieldUser, // We can reuse ShieldUser or Users
                    label: 'Mentors',
                    path: '/dashboard/mentors'
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
                    icon: Armchair,
                    label: 'Furniture',
                    path: '/dashboard/furniture'
                },
                {
                    icon: Users,
                    label: 'Visitors Management',
                    path: '/dashboard/visitors',
                    subItems: [
                        { label: 'Visitors', path: '/dashboard/visitors' },
                        { label: 'Visitors History', path: '/dashboard/visitors/history' }
                    ]
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
                    icon: ClipboardList,
                    label: 'Logs',
                    path: '/dashboard/logs'
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
                },
                {
                    icon: Megaphone,
                    label: 'Announcements',
                    path: '/dashboard/announcements'
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
                    icon: UserRoundCheck,
                    label: 'Assistant Wardens',
                    path: '/dashboard/assistant-wardens'
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
                },

                {
                    icon: ShieldUser,
                    label: 'Mentors',
                    path: '/dashboard/mentors'
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
                    icon: Armchair,
                    label: 'Furniture',
                    path: '/dashboard/furniture'
                },
                {
                    icon: Users,
                    label: 'Visitors Management',
                    path: '/dashboard/visitors',
                    subItems: [
                        { label: 'Visitors', path: '/dashboard/visitors' },
                        { label: 'Visitors History', path: '/dashboard/visitors/history' }
                    ]
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
                    icon: ClipboardList,
                    label: 'Logs',
                    path: '/dashboard/logs'
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
                },
                {
                    icon: Megaphone,
                    label: 'Announcements',
                    path: '/dashboard/announcements'
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
                    icon: Wrench,
                    label: 'Assigned Tasks',
                    path: '/dashboard/tasks'
                },
                {
                    icon: Calendar,
                    label: 'Attendance',
                    path: '/dashboard/attendance'
                },
                {
                    icon: Armchair,
                    label: 'Furniture',
                    path: '/dashboard/furniture'
                },
                {
                    icon: Users,
                    label: 'Visitors Management',
                    path: '/dashboard/visitors',
                    subItems: [
                        { label: 'Visitors', path: '/dashboard/visitors' },
                        { label: 'Visitors History', path: '/dashboard/visitors/history' }
                    ]
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

    [ROLES.ASSISTANT_WARDEN]: [
        {
            section: 'MAIN',

            items: [
                {
                    icon: LayoutGrid,
                    label: 'Dashboard',
                    path: '/dashboard'
                },
                {
                    icon: Megaphone,
                    label: 'Announcements',
                    path: '/dashboard/announcements'
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
                }
            ]
        },

        {
            section: 'OPERATIONS',

            items: [
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
                },
                {
                    icon: Megaphone,
                    label: 'Announcements',
                    path: '/dashboard/announcements'
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
                    icon: Users,
                    label: 'Visitors Management',
                    path: '/dashboard/visitors',
                    subItems: [
                        { label: 'Visitors', path: '/dashboard/visitors' },
                        { label: 'Visitors History', path: '/dashboard/visitors/history' }
                    ]
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
                },
                {
                    icon: Megaphone,
                    label: 'Announcements',
                    path: '/dashboard/announcements'
                }
            ]
        },
        {
            section: 'OPERATIONS',
            items: [
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
                },
                {
                    icon: Users,
                    label: 'Visitors Management',
                    path: '/dashboard/visitors',
                    subItems: [
                        { label: 'Visitors', path: '/dashboard/visitors' },
                        { label: 'Visitors History', path: '/dashboard/visitors/history' }
                    ]
                }
            ]
        }
    ],

    [ROLES.MAINTENANCE_STAFF]: [
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
                    label: 'Assigned Tasks',
                    path: '/dashboard/tasks'
                }
            ]
        }
    ],

    [ROLES.MENTOR]: [
        {
            section: 'MAIN',
            items: [
                {
                    icon: LayoutGrid,
                    label: 'Dashboard',
                    path: '/dashboard'
                },
                {
                    icon: Megaphone,
                    label: 'Announcements',
                    path: '/dashboard/announcements'
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
            section: 'ACADEMICS',

            items: [

                {
                    icon: Layers,
                    label: 'Assigned Batches',
                    path: '/dashboard/assigned-batches'
                }

            ]
        },
        {
            section: 'OPERATIONS',
            items: [
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
                    icon: Users,
                    label: 'Visitors Management',
                    path: '/dashboard/visitors',
                    subItems: [
                        { label: 'Visitors', path: '/dashboard/visitors' },
                        { label: 'Visitors History', path: '/dashboard/visitors/history' }
                    ]
                },
            ]
        }
    ]

};