import React from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants/roles";
import DashboardLayout from "./DashboardLayout";
import UserLayout from "./UserLayout";

const LayoutDispatcher = () => {
    const role = useAuthStore(s => s.user?.role);

    const isConsumer =
        role === ROLES.STUDENT ||
        role === ROLES.PARENT;

    // Student and Parent routing (Responsive logic is inside UserLayout)
    if (isConsumer) {
        return <UserLayout />;
    }

    // Default to DashboardLayout for Admin, Super Admin, and Warden
    return <DashboardLayout />;
};

export default LayoutDispatcher;
