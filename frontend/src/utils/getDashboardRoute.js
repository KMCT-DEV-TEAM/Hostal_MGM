import { ROLES } from '@/constants/roles';

export const getDashboardRoute = (role) => {
    switch(role) {
        case ROLES.SUPER_ADMIN:
        case ROLES.ADMIN:
        case ROLES.WARDEN:
        case ROLES.STUDENT:
        case ROLES.MAINTENANCE_STAFF:
            return '/dashboard';
        default:
            return '/user/login';
    }
};
