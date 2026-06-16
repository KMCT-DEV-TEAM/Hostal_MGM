import { ROLES } from '@/constants/roles';

export const getDashboardRoute = (role) => {
    switch(role) {
        case ROLES.SUPER_ADMIN:
        case ROLES.ADMIN:
        case ROLES.WARDEN:
            return '/dashboard';
        default:
            return '/user/login';
    }
};
