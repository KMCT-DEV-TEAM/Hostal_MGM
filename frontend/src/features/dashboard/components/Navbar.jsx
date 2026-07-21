import React from "react";
import { useAuthStore } from "@/store/useAuthStore";
import logo from "../../../assets/images/dashboard/logo.png"; // adjust path
import bellIcon from "../../../assets/images/dashboard/bell.png"; // adjust path
import {
    Menu,
    Search,
    User as UserIcon,
    Settings,
    LogOut,
    ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LogoutModal from '@/components/ui/LogoutModal';
import NotificationPanel from '../../notifications/components/NotificationPanel';
import LatestNotificationPopup from '../../notifications/components/LatestNotificationPopup';
import { useNotifications } from '../../notifications/hooks/useNotifications';

function Navbar({ onMenuClick }) {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);

    // Lifted notification state
    const {
        notifications,
        loading,
        unreadCount,
        latestNotification,
        clearLatestNotification,
        markAllAsRead,
        markAsRead
    } = useNotifications();

    const dropdownRef = React.useRef(null);
    const notificationRef = React.useRef(null);
    const role = user?.role?.split('_').map(word => word?.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);

    const handleLogoutClick = () => {
        setIsProfileOpen(false);
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = async () => {
        await logout();
        setIsLogoutModalOpen(false);
        navigate('/');
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-[82px] bg-white border-b border-[#D9D9D985] z-50 flex items-center px-4 md:px-6">

            {/* Left */}
            <div className="flex items-center gap-4">
                <button className="lg:hidden cursor-pointer p-1" onClick={onMenuClick}>
                    <Menu size={22} className="text-gray-600" />
                </button>

                <img
                    src={logo}
                    alt="KMCT Hostel Management"
                    className="h-[45px] w-[45px] sm:h-[63px] sm:w-[60px] object-contain cursor-pointer"
                    onClick={() => navigate('/dashboard')}
                />
            </div>

            {/* Right Section */}
            <div className="flex items-center ml-auto gap-5">


                {/* Notification */}
                <div className="relative" ref={notificationRef}>
                    <button
                        className="relative p-1 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    >
                        <img
                            src={bellIcon}
                            alt="Notifications"
                            className="w-4 h-5"
                        />
                        {/* Unread badge indicator */}
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border border-white flex items-center justify-center text-[9px] text-white font-bold">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Latest Notification Popover */}
                    {!isNotificationOpen && latestNotification && (
                        <LatestNotificationPopup
                            notification={latestNotification}
                            onClose={clearLatestNotification}
                        />
                    )}

                    <NotificationPanel
                        isOpen={isNotificationOpen}
                        onClose={() => setIsNotificationOpen(false)}
                        notifications={notifications}
                        loading={loading}
                        markAllAsRead={markAllAsRead}
                        markAsRead={markAsRead}
                    />
                </div>

                {/* Profile */}
                <div className="relative" ref={dropdownRef}>
                    <div
                        className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                                {user?.name
                                    ? user.name
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase())
                                        .slice(0, 2)
                                        .join('')
                                    : 'A'}
                            </span>
                        </div>

                        <div className="hidden md:block">
                            <p className="text-sm font-medium text-[#111827]">
                                {user?.name}
                            </p>
                            <p className="text-xs text-[#6B7280]">
                                {role}
                            </p>
                        </div>
                        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-lg border border-gray-100 py-1.5 z-50 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 md:mt-0 duration-200">


                            <button
                                onClick={() => { setIsProfileOpen(false); navigate('profile'); }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors text-left"
                            >
                                <UserIcon size={16} />
                                <span>My Profile</span>
                            </button>


                            <div className="h-px bg-gray-50 my-1.5"></div>

                            <button
                                onClick={handleLogoutClick}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                            >
                                <LogOut size={16} />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>

            </div>

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
            />
        </header>
    );
}

export default Navbar
