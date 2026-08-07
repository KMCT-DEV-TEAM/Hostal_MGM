import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, FileEdit, TriangleAlert, Users } from 'lucide-react';

const MobileFooter = () => {
    const { user } = useAuthStore();
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', icon: Home, end: true },
        { path: '/dashboard/attendance', icon: Calendar },
        {
            path: '/dashboard/leaves/requests', // Point directly to the default tab
            icon: FileEdit,
            // Custom match: remain active for any leaves sub-route (requests or history)
            isActive: () => location.pathname.startsWith('/dashboard/leaves')
        },
        user?.role === ROLES.PARENT
            ? {
                path: '/dashboard/visitors',
                icon: Users,
            }
            : {
                path: '/dashboard/complaints',
                icon: TriangleAlert,
            }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 py-4 px-4 pointer-events-none">
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-accent" />
            <div className="relative z-10 bg-white rounded-[32px] p-2 flex items-center justify-between shadow-sm border border-gray-50 pointer-events-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;

                    // Determine if the item is active
                    // Use custom isActive function if provided, otherwise fallback to React Router's internal match
                    const isCustomActive = item.isActive ? item.isActive() : null;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive: isRouterActive }) => {
                                const active = isCustomActive !== null ? isCustomActive : isRouterActive;
                                return `relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${active
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-text-secondary hover:text-gray-600 hover:bg-gray-50'
                                    }`;
                            }}
                        >
                            {({ isActive: isRouterActive }) => {
                                const active = isCustomActive !== null ? isCustomActive : isRouterActive;
                                return <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2 : 1.5} />;
                            }}
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileFooter;
