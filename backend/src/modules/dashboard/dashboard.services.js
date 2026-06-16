import asyncHandler from "../../utils/asyncHandler.js";
import { getAdminStats, getSuperAdminStats } from "./dashboard.controller.js";



const getDashboardStats = asyncHandler(async (req, res, next) => {
    const roleHandlers = {
        super_admin: getSuperAdminStats,
        admin: getAdminStats,
    };
    const handler = roleHandlers[req.user?.role];

    if (!handler) {
        return res.status(403).json({
            success: false,
            message: "Unauthorized role"
        });
    }

    return handler(req, res, next);
});

export { getDashboardStats };