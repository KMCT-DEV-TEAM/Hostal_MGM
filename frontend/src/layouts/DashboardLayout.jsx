import Navbar from "@/features/dashboard/components/Navbar";
import Sidebar from "@/features/dashboard/components/Sidebar";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
    return (
        <div className="h-screen  ">
            <Navbar />

            <Sidebar />


            <main className="ml-64 mt-[82px] min-h-[calc(100vh-82px)]">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;