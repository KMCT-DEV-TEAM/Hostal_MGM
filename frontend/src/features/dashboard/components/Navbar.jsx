import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import logo from "../../../assets/images/dashboard/logo.png"; // adjust path
import bellIcon from "../../../assets/images/dashboard/bell.png"; // adjust path
import {
    Menu,
    Search,
    UserCircle,
    LogOut,
    ChevronDown
} from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';
import LogoutModal from '@/components/ui/LogoutModal';

function Navbar({ onMenuClick }) {
    const { t } = useTranslation();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);

    const role = user?.role ? user.role.split('_').map(word => word?.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

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
                    className="h-[45px] w-[45px] sm:h-[63px] sm:w-[60px] object-contain"
                />
            </div>

            {/* Right Section */}
            <div className="flex items-center ml-auto gap-5">
                

                {/* Notification */}
                <button className="relative">
                    <img
                        src={bellIcon}
                        alt="Notifications"
                        className="w-4 h-5"
                    />

                </button>

                {/* Profile */}
                <div className="relative" ref={profileRef}>
                    <div 
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 pr-3 rounded-full transition-colors"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                        <div className="w-9 h-9 rounded-full bg-[#0A437A] flex items-center justify-center">
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
                            <p className="text-sm font-semibold text-[#111827]">
                                {user?.name}
                            </p>
                            <p className="text-xs font-medium text-[#6B7280]">
                                {role}
                            </p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-500 hidden md:block" />
                    </div>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <Link 
                                to="/dashboard/profile"
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/50 hover:text-[#0A437A] transition-colors"
                            >
                                <UserCircle className="w-4 h-4" />
                                {t('my_profile')}
                            </Link>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button 
                                onClick={handleLogoutClick}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                {t('logout')}
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