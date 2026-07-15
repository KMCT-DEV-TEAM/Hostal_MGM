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

    const headerVariant = useLayoutStore((state) => state.header.variant);
    const footerVisible = useLayoutStore((state) => state.footer.visible);

    return (
        <div className={`flex flex-col h-screen bg-[#F8FAFC] ${isMobile ? 'font-mobile' : 'font-sans'}`}>
            {/* Header Area */}
            {isMobile ? (
                headerVariant !== "none" && <MobileHeader />
            ) : (
                <div className="h-[82px] shrink-0">
                    <Navbar onMenuClick={() => setIsSidebarOpen(prev => !prev)} />
                </div>
            )}

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar */}
                {!isMobile && (
                    <div className="shrink-0">
                        <Sidebar isOpen={isSidebarOpen} />
                    </div>
                )}

                {/* Main Content Area */}
                <main className="flex-1 relative w-full max-w-full min-w-0 flex flex-col overflow-hidden">
                    <Outlet />
                </main>
            </div>

            {/* Footer Area */}
            {isMobile && footerVisible && <MobileFooter />}
        </div>
    );
};

export default UserLayout;
