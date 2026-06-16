import { ROLES } from '@/constants/roles';

export const DASHBOARD_ROUTES = [

    {
        index: true,

        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN
        ],

        component: 'dashboard'
    },

    {
        path: 'administrators',

        roles: [
            ROLES.SUPER_ADMIN
        ],

        component: 'administrators'
    },

    {
        path: 'organizations',

        roles: [
            ROLES.SUPER_ADMIN
        ],

        component: 'organizations'
    },

    {
        path: 'wardens',

        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN
        ],

        component: 'wardens'
    },

    {
        path: 'students',

        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN
        ],

        component: 'students'
    },

    {
        path: 'parents',

        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.WARDEN
        ],

        component: 'parents'
    },

    {
        path: 'maintenance',

        roles: [
            ROLES.WARDEN
        ],

        component: 'maintenance'
    }

];