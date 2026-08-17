import { prisma } from '../../config/prisma.js';

export const createLogDb = async (data) => {
    console.log("Stub: createLogDb called with data:", data);
    try {
        await prisma.activityLog.create({
            data: {
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                userId: data.user,
                userRole: data.userRole || "unknown",
                details: data.details,
                status: data.status === "success" ? "SUCCESS" : (data.status === "error" ? "ERROR" : "WARNING")
            }
        });
    } catch (err) {
        console.error("Failed to create log:", err.message);
    }
};
