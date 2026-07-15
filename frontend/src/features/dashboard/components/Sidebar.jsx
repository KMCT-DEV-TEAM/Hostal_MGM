import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import LogoutModal from '@/components/ui/LogoutModal';
import ComplaintService from '@/services/complaint.service';

import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';
import { DASHBOARD_NAV } from '@/features/dashboard/config/dashboardNavigation';

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
    LogOut,
    ChevronDown
} from 'lucide-react';

// Reusable component for section headings
const NavSection = ({ title, children }) => {
    const { t } = useTranslation();
    return (
        <div className="mb-4"> {/* Increased mb-1 to mb-4 to accurately match the design spacing */}
            <h3 className="text-xs font-semibold text-gray-400 mb-2 px-3 uppercase tracking-wider">
                {t(title.toLowerCase())}
            </h3>
            <div className="space-y-0.5">
                {children}
            </div>
        </div>
    );
}

// Reusable component for individual navigation links
const NavItem = ({ icon: Icon, label, to, isDanger, onClick, badge, onClose, subItems }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const baseStyles =
        "flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm w-full ";

    if (isDanger) {
        return (
            <button
                onClick={(e) => {
                    if (onClose) onClose(e);
                    if (onClick) onClick(e);
                }}
                className={
                    baseStyles +
                    "text-red-500 hover:text-red-600 hover:bg-red-50 text-left cursor-pointer"
                }
            >
                <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-red-500" strokeWidth={1.5} />

                    <span className="capitalize">{t(label.toLowerCase())}</span>
                </div>
            </button>
        );
    }

    if (subItems && subItems.length > 0) {
        return (
            <div className="w-full">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={
                        baseStyles +
                        "text-gray-500 hover:text-gray-900 hover:bg-blue-50/50 text-left cursor-pointer"
                    }
                >
                    <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                        <span className="capitalize">{t(label.toLowerCase())}</span>
                    </div>
                    <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                            }`}
                        strokeWidth={1.5}
                    />
                </button>
                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0 pointer-events-none'
                        }`}
                >
                    <div className="space-y-1 ml-7">
                        {subItems.map((subItem) => (
                            <NavLink
                                key={subItem.path}
                                to={subItem.path}
                                end
                                onClick={onClose}
                                className={({ isActive }) =>
                                    "flex items-center pl-5 pr-3 py-2 text-sm transition-all w-full border-l-2 " +
                                    (isActive
                                        ? "text-primary bg-blue-50/50 border-primary rounded-r-md rounded-l-none"
                                        : "text-gray-500 hover:text-gray-900 hover:bg-blue-50/50 border-transparent rounded-r-lg rounded-l-none")
                                }
                            >
                                <span className="capitalize">{t(subItem.label.toLowerCase())}</span>
                            </NavLink>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <NavLink
            to={to}
            end
            onClick={onClose}
            className={({ isActive }) =>
                baseStyles +
                (isActive
                    ? "text-primary font-medium bg-blue-50/50"
                    : "text-gray-500 hover:text-gray-900 hover:bg-blue-50/50")
            }
        >
            {({ isActive }) => (
                <>
                    <div className="flex items-center gap-3">
                        <Icon
                            className={`w-5 h-5 ${isActive
                                ? "text-primary"
                                : "text-gray-400" /* Fixed undefined token text-text-secondary */
                                }`}
                            strokeWidth={1.5}
                        />
                        <span className="capitalize">{t(label.toLowerCase())}</span>
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

function Sidebar({ isOpen, setIsOpen }) {

    const { user, logout } = useAuthStore();
    const { t } = useTranslation();

    const sections = DASHBOARD_NAV[user?.role] || [];

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const navigate = useNavigate();
    const [pendingComplaints, setPendingComplaints] = useState(0);

    useEffect(() => {
        if (user?.role === 'student') {
            const fetchPendingComplaints = async () => {
                try {
                    const res = await ComplaintService.getMyComplaints();
                    const pending = (res.data || []).filter(c => c.status === 'Pending').length;
                    setPendingComplaints(pending);
                } catch (error) {
                    console.error("Failed to fetch pending complaints for sidebar:", error);
                }
            };

            fetchPendingComplaints();

            window.addEventListener('complaintsUpdated', fetchPendingComplaints);
            return () => {
                window.removeEventListener('complaintsUpdated', fetchPendingComplaints);
            };
        }
    }, [user?.role]);

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = async () => {
        await logout();
        setIsLogoutModalOpen(false);
        navigate('/');
    };
    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed top-[82px] left-0 bottom-0 w-[250px] bg-white border-r border-[#EAEAEA] flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Scrollable Main Content */}
                <div className="flex-1 py-4 px-4 overflow-y-auto max-h-[calc(100vh-160px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">


                    {sections.map((section) => (
                        <NavSection key={section.section} title={section.section}>
                            {section.items.map((item) => {
                                let badge = item.badge;
                                if (user?.role === 'student' && item.label === 'Complaints') {
                                    if (pendingComplaints > 0) {
                                        badge = { count: pendingComplaints, variant: 'danger' };
                                    } else {
                                        badge = null;
                                    }
                                }

                                return (
                                    <NavItem
                                        key={item.path}
                                        icon={item.icon}
                                        label={t(item.label.toLowerCase())}
                                        to={item.path}
                                        badge={badge}
                                        onClose={() => setIsOpen(false)}
                                        subItems={item.subItems}
                                    />
                                );
                            })}
                        </NavSection>
                    ))}

                </div>




                {/* Bottom Section */}
                <div className="py-4 px-4 border-t border-gray-100 space-y-1 bg-white">
                    <NavItem
                        icon={Settings}
                        label={t('settings')}
                        to="/dashboard/settings"
                        onClose={() => setIsOpen(false)}
                    />

                    <NavItem
                        icon={LogOut}
                        label={t('logout')}
                        isDanger
                        onClick={handleLogout}
                    />
                </div>
            </aside>

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
            />
        </>
    );
}

export default Sidebar;
