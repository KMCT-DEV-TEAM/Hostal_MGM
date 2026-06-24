import React from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants/roles";
import DashboardLayout from "./DashboardLayout";
import UserLayout from "./UserLayout";

const LayoutDispatcher = () => {
    const role = useAuthStore(s => s.user?.role);

    // If the role is Student or Parent, use the UserLayout
    if (role === ROLES.STUDENT || role === ROLES.PARENT) {
        return <UserLayout />;
    }

    // Default to DashboardLayout for Admin, Super Admin, and Warden
    return <DashboardLayout />;
};

export default LayoutDispatcher;
