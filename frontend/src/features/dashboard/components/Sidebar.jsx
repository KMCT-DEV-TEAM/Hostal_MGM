import React from 'react';
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
const NavItem = ({ icon: Icon, label, isActive, isDanger }) => {
    // Default styles for inactive items
    let textStyles = "text-gray-500 hover:text-gray-900 hover:bg-blue-50/50";
    let iconStyles = "text-[#777777]";

    // Override styles if the item is active
    if (isActive) {
        textStyles = "text-[#0A467F] font-medium";
        iconStyles = "text-[#0A467F]";
    }
    // Override styles if the item is a danger action (like Logout)
    else if (isDanger) {
        textStyles = "text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors";
        iconStyles = "text-red-500";
    }

    return (
        <div className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-colors text-sm ${textStyles}`}>
            <Icon className={`w-5 h-5 ${iconStyles}`} strokeWidth={1.5} />
            <span>{label}</span>
        </div>
    );
};

function Sidebar() {
    return (
        <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col font-sans fixed">

            {/* Scrollable Main Content */}
            <div className="flex-1  py-4 px-4">

                <NavSection title="Main">
                    <NavItem icon={LayoutGrid} label="Dashboard" />
                </NavSection>

                <NavSection title="User Management">
                    {/* Active State Example */}
                    <NavItem icon={Shield} label="Admins" isActive={true} />
                    <NavItem icon={User} label="Wardens" />
                    <NavItem icon={GraduationCap} label="Students" />
                    <NavItem icon={Users} label="Parents" />
                </NavSection>

                <NavSection title="Organizations">
                    <NavItem icon={Building2} label="All Organizations" />
                    <NavItem icon={Building} label="All Hostels" />
                </NavSection>

                <NavSection title="Reports">
                    <NavItem icon={BarChart2} label="System reports" />
                </NavSection>

                <NavSection title="Support">
                    <NavItem icon={KeyRound} label="Password Requests" />
                </NavSection>

            </div>

            {/* Bottom Sticky Section for Settings & Logout */}
            <div className="py-4 px-4 border-t border-gray-100 mt-auto space-y-1">
                <NavItem icon={Settings} label="Settings" />
                <NavItem icon={LogOut} label="Logout" isDanger={true} />
            </div>

        </aside>
    );
}

export default Sidebar