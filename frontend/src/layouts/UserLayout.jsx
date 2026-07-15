import React, { useState } from "react";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useShallow } from "zustand/react/shallow";
import Navbar from "@/features/dashboard/components/Navbar";
import Sidebar from "@/features/dashboard/components/Sidebar";
import MobileHeader from "@/components/shared/MobileHeader";
import MobileFooter from "@/components/shared/MobileFooter";
import { Outlet } from "react-router-dom";
import { useBreakpoint } from "@/hooks/useBreakpoint";

const UserLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isMobile } = useBreakpoint();

    const { showHeader, showFooter } = useLayoutStore(
        useShallow((state) => ({
            showHeader: state.showHeader,
            showFooter: state.showFooter,
        }))
    );
    return (
        <div className={`flex flex-col h-screen bg-[#F8FAFC] ${isMobile ? 'font-mobile' : 'font-sans'}`}>
            {/* Header Area */}
            {isMobile ? (
                showHeader && <MobileHeader />
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
            {isMobile && showFooter && <MobileFooter />}
        </div>
    );
};

export default UserLayout;
