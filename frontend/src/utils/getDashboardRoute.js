export const getDashboardRoute = (role) => {
    switch(role) {
        case 'SUPER_ADMIN':
            return '/dashboard';
        case 'ADMIN':
            return '/dashboard';
        case 'WARDEN':
            return '/dashboard';
        default:
            return '/user/login';
    }
};
