import React, { useState } from "react";
import Navbar from "@/features/dashboard/components/Navbar";
import Sidebar from "@/features/dashboard/components/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants/roles";
import { ScanLine, Loader2 } from "lucide-react";
import attendanceService from "@/services/attendance.service";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [isCreatingAttendance, setIsCreatingAttendance] = useState(false);

    const handleFABClick = async () => {
        try {
            setIsCreatingAttendance(true);
            const today = new Date().toISOString();
            const stats = await attendanceService.getAdminWardenDashboardStatsByRole(user.role, { date: today });
            
            if (stats?.windowStatus === 'open' && stats?.windowId) {
                navigate(`/dashboard/attendance/scan/${stats.windowId}`, { state: { autoOpenScanner: true } });
                return;
            }

            const response = await attendanceService.createWindowByRole(user.role);
            showSuccessToast('Success', response?.message || 'Attendance window created');
            if (response?.data?._id) {
                navigate(`/dashboard/attendance/scan/${response.data._id}`, { state: { autoOpenScanner: true } });
            }
        } catch (error) {
            showErrorToast('Failed to access attendance', error.message);
        } finally {
            setIsCreatingAttendance(false);
        }
    };

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
                
                {/* Floating Action Button for Warden */}
                {user?.role === ROLES.WARDEN && (
                    <button
                        onClick={handleFABClick}
                        disabled={isCreatingAttendance}
                        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#0A437A] text-white rounded-full shadow-lg hover:bg-secondary transition-all focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        aria-label="Scan QR Code"
                    >
                        {isCreatingAttendance ? <Loader2 className="w-6 h-6 animate-spin" /> : <ScanLine className="w-6 h-6" />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default DashboardLayout;