import Administrator from "@/features/dashboard/components/Administrator";
import Maintainance from "@/features/dashboard/components/Maintainance";
import Navbar from "@/features/dashboard/components/Navbar";
import Sidebar from "@/features/dashboard/components/Sidebar";
import SuperAdminDashboard from "@/features/dashboard/pages/SuperAdminDashboard";
import { useState } from "react";

const DashboardLayout = () => {
    const [activePage, setActivePage] = useState("dashboard");


    const renderPage = () => {
        switch (activePage) {
            case "administrator":
                return <Administrator />;
            case "maintenance":
                return <Maintainance />;
            default:
                return <SuperAdminDashboard />;
        }
    };

    return (
        <div className="h-screen overflow-hidden ">
            <Navbar />

            <Sidebar
                activePage={activePage}
                setActivePage={setActivePage}
            />

            <main className="ml-64 mt-[82px] h-[calc(100vh-82px)] overflow-y-auto">
                {renderPage()}
            </main>
        </div>
    );
};

export default DashboardLayout;