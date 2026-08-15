import { orchestratorService } from "../notifications/services/orchestrator.service.js";

export const triggerAnnouncementNotifications = async (announcement) => {
    try {
        // We need sender details for the notification
        await announcement.populate('createdBy', 'name role');

        const user = announcement.createdBy;
        const sender = { 
            id: user._id, 
            model: 'User', 
            snapshot: { name: user.name, role: user.role } 
        };

        const { title, message, targetType, targetOrganizations, targetHostels } = announcement;
        const notificationPromises = [];

        if (targetType === "general") {
            notificationPromises.push(orchestratorService.triggerNotification({
                eventName: 'NEW_ANNOUNCEMENT',
                target: { type: 'STUDENT', filter: {} },
                data: { title, message },
                sender
            }));
            notificationPromises.push(orchestratorService.triggerNotification({
                eventName: 'NEW_ANNOUNCEMENT',
                target: { type: 'PARENT', filter: {} },
                data: { title, message },
                sender
            }));
            notificationPromises.push(orchestratorService.triggerNotification({
                eventName: 'NEW_ANNOUNCEMENT',
                target: { type: 'USER', filter: {} },
                data: { title, message },
                sender
            }));
        } else if (targetType === "organization") {
            for (let orgId of targetOrganizations) {
                notificationPromises.push(orchestratorService.triggerNotification({
                    eventName: 'NEW_ANNOUNCEMENT',
                    target: { type: 'STUDENT', filter: { organizationId: orgId } },
                    data: { title, message },
                    sender
                }));
                notificationPromises.push(orchestratorService.triggerNotification({
                    eventName: 'NEW_ANNOUNCEMENT',
                    target: { type: 'PARENT', filter: { organizationId: orgId } },
                    data: { title, message },
                    sender
                }));
            }
        } else if (targetType === "hostel") {
            for (let hId of targetHostels) {
                notificationPromises.push(orchestratorService.triggerNotification({
                    eventName: 'NEW_ANNOUNCEMENT',
                    target: { type: 'STUDENT', filter: { hostelId: hId } },
                    data: { title, message },
                    sender
                }));
                notificationPromises.push(orchestratorService.triggerNotification({
                    eventName: 'NEW_ANNOUNCEMENT',
                    target: { type: 'PARENT', filter: { hostelId: hId } },
                    data: { title, message },
                    sender
                }));
            }
        }

        await Promise.allSettled(notificationPromises);
    } catch (error) {
        console.error("Failed to trigger announcement notifications:", error);
    }
};
