import React from "react";
import { useAuthStore } from "@/store/useAuthStore";
import logo from "../../../assets/images/dashboard/logo.png"; // adjust path
import bellIcon from "../../../assets/images/dashboard/bell.png"; // adjust path
import {
    Menu,
    Search,
} from "lucide-react";

function Navbar() {
    const { user } = useAuthStore();
    const role = user?.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return (
        <header className="fixed top-0 left-0 right-0 h-[82px] bg-white border-b border-[#D9D9D985] z-50 flex items-center px-6">

            {/* Left */}
            <div className="flex items-center gap-4">
                <button className="lg:hidden">
                    <Menu size={22} className="text-gray-600" />
                </button>

                <img
                    src={logo}
                    alt="KMCT Hostel Management"
                    className="h-[63px] w-[60px] object-contain"
                />
            </div>

            {/* Right Section */}
            <div className="flex items-center ml-auto gap-5">

                {/* Search */}
                <div className="hidden md:flex items-center w-[574px] h-[46px] rounded-md">
                    <div className="relative w-full">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
                        />

                        <input
                            type="text"
                            placeholder="Search admins, students..."
                            className="w-full h-11 pl-11 pr-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] outline-none"
                        />
                    </div>
                </div>

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
                        <span className="text-white text-sm font-semibold">{user?.name.charAt(0).toUpperCase() + user?.name.split(' ')[1].charAt(0).toUpperCase()}</span>
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