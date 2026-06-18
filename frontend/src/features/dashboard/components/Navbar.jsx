import React from "react";
import { useAuthStore } from "@/store/useAuthStore";
import logo from "../../../assets/images/dashboard/logo.png"; // adjust path
import bellIcon from "../../../assets/images/dashboard/bell.png"; // adjust path
import {
    Menu,
    Search,
} from "lucide-react";

function Navbar({ onMenuClick }) {
    const { user } = useAuthStore();
    const role = user?.role.split('_').map(word => word?.charAt(0).toUpperCase() + word.slice(1)).join(' ');

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
                <div className="flex items-center gap-3 cursor-pointer">
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
                </div>

            </div>
        </header>
    );
}

export default Navbar