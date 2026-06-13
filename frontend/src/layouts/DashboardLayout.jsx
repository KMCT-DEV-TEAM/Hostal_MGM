import Navbar from "@/features/dashboard/components/Navbar";
import Sidebar from "@/features/dashboard/components/Sidebar";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
    return (
        <div className="bg-[#F8F9FB] min-h-screen">
            <Navbar />

            <Sidebar />

            <main className="ml-64 mt-[82px] p-6">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;