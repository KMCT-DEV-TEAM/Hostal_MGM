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
    BarChart2,
    KeyRound,
    Settings,
    LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Reusable component for the section headings
const NavSection = ({ title, children }) => (
    <div className="mb-2">
        <h3 className="text-xs font-semibold text-gray-400 tracking-wider mb-3 px-3 uppercase">
            {title}
        </h3>
        <div className="space-y-1">
            {children}
        </div>
    </div>
);

// Reusable component for individual navigation links
const NavItem = ({ icon: Icon, label, to, isDanger, onClick }) => {
    // Default styles for items
    let baseStyles = "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ";

    if (isDanger) {
        return (
            <button
                onClick={onClick}
                className={baseStyles + "text-red-500 hover:text-red-600 hover:bg-red-50 w-full text-left"}
            >
                <Icon className="w-5 h-5 text-red-500" strokeWidth={1.5} />
                <span>{label}</span>
            </button>
        );
    }

    return (
        <NavLink
            to={to}
            end
            className={({ isActive }) =>
                baseStyles + (isActive
                    ? "text-[#0A467F] font-medium bg-blue-50/50"
                    : "text-gray-500 hover:text-gray-900 hover:bg-blue-50/50")
            }
        >
            {({ isActive }) => (
                <>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#0A467F]' : 'text-text-secondary'}`} strokeWidth={1.5} />
                    <span>{label}</span>
                </>
            )}
        </NavLink>
    );
};

function Sidebar() {
    const { logout } = useAuth();

    return (
        <aside className="fixed top-[82px] left-0 w-64 h-[calc(100vh-82px)] bg-white border-r">

            {/* Scrollable Main Content */}
            <div className="flex-1  py-4 px-4 overflow-y-auto max-h-[calc(100vh-160px)]">

                <NavSection title="Main">
                    <NavItem icon={LayoutGrid} label="Dashboard" to="/dashboard" />
                </NavSection>

                <NavSection title="User Management">
                    <NavItem icon={Shield} label="Admins" to="/dashboard/administrators" />
                    <NavItem icon={User} label="Wardens" to="/dashboard/wardens" />
                    <NavItem icon={GraduationCap} label="Students" to="/dashboard/students" />
                    <NavItem icon={Users} label="Parents" to="/dashboard/parents" />
                </NavSection>

                <NavSection title="Organizations">
                    <NavItem icon={Building2} label="All Organizations" to="/dashboard/organizations" />
                    <NavItem icon={Building} label="All Hostels" to="/dashboard/hostels" />
                </NavSection>

                <NavSection title="Reports">
                    <NavItem icon={BarChart2} label="System reports" to="/dashboard/reports" />
                </NavSection>

                <NavSection title="Support">
                    <NavItem icon={KeyRound} label="Password Requests" to="/dashboard/password-requests" />
                </NavSection>

            </div>

            {/* Bottom Sticky Section for Settings & Logout */}
            <div className="py-4 px-4 border-t border-gray-100 mt-auto space-y-1">
                <NavItem icon={Settings} label="Settings" to="/dashboard/settings" />
                <NavItem icon={LogOut} label="Logout" isDanger={true} onClick={logout} />
            </div>

        </aside>
    );
}

export default Sidebar;
