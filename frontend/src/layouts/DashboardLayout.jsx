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
        <div className="bg-[#F8F9FB] min-h-screen">
            <Navbar />

            <Sidebar
                activePage={activePage}
                setActivePage={setActivePage}
            />

            <main className="ml-64 mt-[82px] p-6">
                {renderPage()}
            </main>
        </div>
    );
};

export default DashboardLayout;