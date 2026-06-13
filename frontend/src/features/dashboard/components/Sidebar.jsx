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
    <div className="mb-1">
        <h3 className="text-xs font-semibold text-gray-400 mb-2 px-3 uppercase">
            {title}
        </h3>
        <div className="space-y-0.5">
            {children}
        </div>
    </div>
);

// Reusable component for individual navigation links
const NavItem = ({
    icon: Icon,
    label,
    page,
    activePage,
    setActivePage,
    isDanger,
}) => {
    const isActive = activePage === page;

    let textStyles = "text-[#777777] hover:bg-blue-50";
    let iconStyles = "text-[#777777]";

    if (isDanger) {
        textStyles = "text-[#EF4444] hover:text-red-600 hover:bg-red-50";
        iconStyles = "text-[#EF4444]";
    } else if (isActive) {
        textStyles = "text-[#0A467F] font-medium";
        iconStyles = "text-[#0A467F]";
    }

    return (
        <div
            onClick={() => page && setActivePage(page)}
            className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-colors text-sm ${textStyles}`}
        >
            <Icon className={`w-5 h-5 ${iconStyles}`} strokeWidth={1.5} />
            <span>{label}</span>
        </div>
    );
};

function Sidebar({ activePage, setActivePage }) {
    return (
        <aside className="fixed top-[82px] left-0 bottom-0 w-64 bg-white border-r border-[#EAEAEA]">


            {/* Scrollable Main Content */}
            <div className="py-4 px-4">



                <NavSection title="Main">
                    <NavItem
                        icon={LayoutGrid}
                        label="Dashboard"
                        page="dashboard"
                        activePage={activePage}
                        setActivePage={setActivePage}
                    />
                </NavSection>

                <NavSection title="User Management">
                    <NavItem
                        icon={Shield}
                        label="Admins"
                        page="administrator"
                        activePage={activePage}
                        setActivePage={setActivePage}
                    />

                    <NavItem
                        icon={User}
                        label="Wardens"
                        page="wardens"
                        activePage={activePage}
                        setActivePage={setActivePage}
                    />

                    <NavItem
                        icon={GraduationCap}
                        label="Students"
                        page="students"
                        activePage={activePage}
                        setActivePage={setActivePage}
                    />

                    <NavItem
                        icon={Users}
                        label="Parents"
                        page="parents"
                        activePage={activePage}
                        setActivePage={setActivePage}
                    />
                </NavSection>

                <NavSection title="Organizations">
                    <NavItem
                        icon={Building2}
                        label="All Organizations"
                        page="organizations"
                        activePage={activePage}
                        setActivePage={setActivePage}
                    />

                    <NavItem
                        icon={Building}
                        label="All Hostels"
                        page="hostels"
                        activePage={activePage}
                        setActivePage={setActivePage}
                    />
                </NavSection>

                <NavSection title="Reports">
                    <NavItem
                        icon={BarChart2}
                        label="System Reports"
                        page="reports"
                        activePage={activePage}
                        setActivePage={setActivePage}
                    />
                </NavSection>

                <NavSection title="Support">
                    <NavItem
                        icon={KeyRound}
                        label="Password Requests"
                        page="passwordRequests"
                        activePage={activePage}
                        setActivePage={setActivePage}
                    />
                </NavSection>

            </div>

            {/* Bottom Sticky Section for Settings & Logout */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-4 px-4">
                <NavItem
                    icon={Settings}
                    label="Settings"
                    page="settings"
                    activePage={activePage}
                    setActivePage={setActivePage}
                />

                <NavItem
                    icon={LogOut}
                    label="Logout"
                    isDanger
                />
            </div>

        </aside>
    );
}

export default Sidebar