import { useState } from "react";
import Sidebar from "../features/dashboard/components/Sidebar";
import Navbar from "../features/dashboard/components/Navbar";
import SuperAdminDashboard from "../features/dashboard/pages/SuperAdminDashboard";
import Administrator from "../features/dashboard/components/Administrator";
import Maintenance from "../features/dashboard/components/Maintainance";

const DashboardLayout = () => {
    const [activePage, setActivePage] = useState("dashboard");

    const renderPage = () => {
        switch (activePage) {
            case "administrator":
                return <Administrator />;

            case "maintenance":
                return <Maintenance />;

            default:
                return <SuperAdminDashboard />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <Sidebar />
            <Navbar />

            {/* Main Content */}
            <main className="ml-64 mt-[82px] p-6">
                {renderPage()}
            </main>
        </div>
    );
};

export default DashboardLayout;