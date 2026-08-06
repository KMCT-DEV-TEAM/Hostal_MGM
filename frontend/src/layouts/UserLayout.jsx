import React, { useState } from "react";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useShallow } from "zustand/react/shallow";
import Navbar from "@/features/dashboard/components/Navbar";
import Sidebar from "@/features/dashboard/components/Sidebar";
import MobileHeader from "@/components/shared/MobileHeader";
import MobileFooter from "@/components/shared/MobileFooter";
import { Outlet } from "react-router-dom";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import AttendanceQRModal from "@/features/dashboard/components/attendance/AttendanceQRModal";
import ParentBootstrap from "./ParentBootstrap";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants/roles";

const UserLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isMobile } = useBreakpoint();

    const headerVariant = useLayoutStore((state) => state.header.variant);
    const footerVisible = useLayoutStore((state) => state.footer.visible);
    const userRole = useAuthStore((state) => state.user?.role);

    return (
        <div className={`flex flex-col h-dvh bg-[#F8FAFC] ${isMobile ? 'font-mobile' : 'font-sans'}`}>


            {/* Header Area */}
            {!isMobile && (
                <div className="h-[82px] shrink-0">
                    <Navbar onMenuClick={() => setIsSidebarOpen(prev => !prev)} />
                </div>
            )}

            <div className={`flex-1 flex overflow-hidden relative ${!isMobile ? 'h-[calc(100vh-82px)]' : ''}`}>
                {/* Sidebar */}
                {!isMobile && (
                    <>
                        <div className="hidden lg:block w-[250px] shrink-0"></div>
                        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                    </>
                )}

                {/* Main Content Area */}
                <main className={`flex-1 overflow-y-auto w-full relative ${isMobile ? 'pb-24 pt-24 bg-transparent' : ''}`}>
                    {userRole === ROLES.PARENT ? <ParentBootstrap /> : <Outlet />}
                </main>
            </div>

            {/* Floating Header */}
            {isMobile && headerVariant !== "none" && (
                <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
                    <MobileHeader />
                </div>
            )}

            {/* Floating Footer */}
            {isMobile && footerVisible && (
                <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
                    <MobileFooter />
                </div>
            )}

            {/* Global Modals */}
            <AttendanceQRModal />
        </div>
    );
};

export default UserLayout;
