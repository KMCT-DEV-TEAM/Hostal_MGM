import React, { useState } from "react";
import Navbar from "@/features/dashboard/components/Navbar";
import Sidebar from "@/features/dashboard/components/Sidebar";
import { Outlet } from "react-router-dom";

const UserLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="h-screen bg-[#F8FAFC]">
            <div className="h-[82px]">
                <Navbar onMenuClick={() => setIsSidebarOpen(prev => !prev)} />
            </div>
            <div className="h-[calc(100vh-82px)] flex relative">
                <div className="hidden lg:block w-[250px] shrink-0"></div>
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                <div className="flex-1 overflow-y-auto w-full">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default UserLayout;
