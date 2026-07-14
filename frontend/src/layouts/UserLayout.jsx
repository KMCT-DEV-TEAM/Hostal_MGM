import React, { useState } from "react";
import Navbar from "@/features/dashboard/components/Navbar";
import Sidebar from "@/features/dashboard/components/Sidebar";
import MobileHeader from "@/components/shared/MobileHeader";
import MobileFooter from "@/components/shared/MobileFooter";
import { Outlet } from "react-router-dom";
import { useBreakpoint } from "@/hooks/useBreakpoint";

const UserLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isMobile } = useBreakpoint();

    return (
        <div className="flex flex-col h-screen bg-[#F8FAFC]">
            {/* Header Area */}
            {isMobile ? (
                <MobileHeader />
            ) : (
                <div className="h-[82px] shrink-0">
                    <Navbar onMenuClick={() => setIsSidebarOpen(prev => !prev)} />
                </div>
            )}

            {/* Main Body Area */}
            <div className={`flex-1 flex overflow-hidden relative ${!isMobile ? 'h-[calc(100vh-82px)]' : ''}`}>
                {!isMobile && (
                    <>
                        <div className="hidden lg:block w-[250px] shrink-0"></div>
                        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                    </>
                )}
                
                {/* 
                  The Outlet is exactly here in both cases!
                  This preserves its state completely on resize.
                */}
                <main className="flex-1 overflow-y-auto w-full relative">
                    <Outlet />
                </main>
            </div>

            {/* Footer Area */}
            {isMobile && <MobileFooter />}
        </div>
    );
};

export default UserLayout;
