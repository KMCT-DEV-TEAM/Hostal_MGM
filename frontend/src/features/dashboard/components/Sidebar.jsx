import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutGrid,
    Shield,
    User,
    GraduationCap,
    Users,
    Building2,
    Building,
    AlertTriangle, // Added for Complaints
    Calendar,      // Added for Attendance
    CalendarX,     // Added for Leave Requests
    UtensilsCrossed, // Added for Mess Management
    BarChart2,
    KeyRound,
    Settings,
    LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

// Reusable component for section headings
const NavSection = ({ title, children }) => (
    <div className="mb-4"> {/* Increased mb-1 to mb-4 to accurately match the design spacing */}
        <h3 className="text-xs font-semibold text-gray-400 mb-2 px-3 uppercase tracking-wider">
            {title}
        </h3>
        <div className="space-y-0.5">
            {children}
        </div>
    </div>
);

// Reusable component for individual navigation links
const NavItem = ({ icon: Icon, label, to, isDanger, onClick, badge }) => {
    const baseStyles =
        "flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm w-full ";

    if (isDanger) {
        return (
            <button
                onClick={onClick}
                className={
                    baseStyles +
                    "text-red-500 hover:text-red-600 hover:bg-red-50 text-left"
                }
            >
                <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-red-500" strokeWidth={1.5} />
                    <span>{label}</span>
                </div>
            </button>
        );
    }

    return (
        <NavLink
            to={to}
            end
            className={({ isActive }) =>
                baseStyles +
                (isActive
                    ? "text-[#0A467F] font-medium bg-blue-50/50"
                    : "text-gray-500 hover:text-gray-900 hover:bg-blue-50/50")
            }
        >
            {({ isActive }) => (
                <>
                    <div className="flex items-center gap-3">
                        <Icon
                            className={`w-5 h-5 ${isActive
                                ? "text-[#0A467F]"
                                : "text-gray-400" /* Fixed undefined token text-text-secondary */
                                }`}
                            strokeWidth={1.5}
                        />
                        <span>{label}</span>
                    </div>

                    {/* Render Badge notification pill if present */}
                    {badge && (
                        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full min-w-5 h-5 flex items-center justify-center ${badge.variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                            {badge.count}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
};

function Sidebar() {
    const { logout } = useAuthStore();

    return (
        <aside className="fixed top-[82px] left-0 bottom-0 w-64 bg-white border-r border-[#EAEAEA] flex flex-col justify-between">
            {/* Scrollable Main Content */}
            <div className="flex-1 py-4 px-4 overflow-y-auto max-h-[calc(100vh-160px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <NavSection title="Main">
                    <NavItem
                        icon={LayoutGrid}
                        label="Dashboard"
                        to="/dashboard"
                    />
                </NavSection>

                <NavSection title="User Management">
                    <NavItem
                        icon={Shield}
                        label="Admins"
                        to="/dashboard/administrators"
                    />
                    <NavItem
                        icon={User}
                        label="Wardens"
                        to="/dashboard/wardens"
                    />
                    <NavItem
                        icon={GraduationCap}
                        label="Students"
                        to="/dashboard/students"
                    />
                    <NavItem
                        icon={Users}
                        label="Parents"
                        to="/dashboard/parents"
                    />
                </NavSection>

                <NavSection title="Organizations">
                    <NavItem
                        icon={Building2}
                        label="All Organizations"
                        to="/dashboard/organizations"
                    />
                    <NavItem
                        icon={Building}
                        label="All Hostels"
                        to="/dashboard/hostels"
                    />
                </NavSection>

                {/* --- FIXED: Added missing Operations section --- */}
                <NavSection title="Operations">
                    <NavItem
                        icon={AlertTriangle}
                        label="Complaints"
                        to="/dashboard/complaints"
                        badge={{ count: 12, variant: 'danger' }}
                    />
                    <NavItem
                        icon={Calendar}
                        label="Attendance"
                        to="/dashboard/attendance"
                    />
                    <NavItem
                        icon={CalendarX}
                        label="Leave Requests"
                        to="/dashboard/leave-requests"
                        badge={{ count: 7, variant: 'warning' }}
                    />
                    <NavItem
                        icon={UtensilsCrossed}
                        label="Mess Management"
                        to="/dashboard/mess-management"
                    />
                </NavSection>

                <NavSection title="Reports">
                    <NavItem
                        icon={BarChart2}
                        label="System Reports"
                        to="/dashboard/reports"
                    />
                </NavSection>

                <NavSection title="Support">
                    <NavItem
                        icon={KeyRound}
                        label="Password Requests"
                        to="/dashboard/password-requests"
                    />
                </NavSection>
            </div>

            {/* Bottom Section */}
            <div className="py-4 px-4 border-t border-gray-100 space-y-1 bg-white">
                <NavItem
                    icon={Settings}
                    label="Settings"
                    to="/dashboard/settings"
                />

                <NavItem
                    icon={LogOut}
                    label="Logout"
                    isDanger
                    onClick={logout}
                />
            </div>
        </aside>
    );
}

export default Sidebar;