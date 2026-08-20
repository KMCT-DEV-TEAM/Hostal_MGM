import { prisma } from '../../config/prisma.js';
import { orchestratorService } from '../notifications/services/orchestrator.service.js';

export const triggerAnnouncementNotifications = async (announcementId) => {
    try {
        const announcement = await prisma.announcement.findUnique({
            where: { id: announcementId },
            include: {
                createdBy: { select: { id: true, name: true, role: true } },
                organizations: true,
                hostels: true
            }
        });

        if (!announcement) return;

        const sender = { 
            id: announcement.createdBy.id, 
            model: 'User', 
            snapshot: { name: announcement.createdBy.name, role: announcement.createdBy.role } 
        };

        const { title, message, targetType, organizations, hostels } = announcement;
        const notificationPromises = [];

        if (targetType === "GENERAL") {
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
        } else if (targetType === "ORGANIZATION") {
            for (let org of organizations) {
                notificationPromises.push(orchestratorService.triggerNotification({
                    eventName: 'NEW_ANNOUNCEMENT',
                    target: { type: 'STUDENT', filter: { organizationId: org.organizationId } },
                    data: { title, message },
                    sender
                }));
                notificationPromises.push(orchestratorService.triggerNotification({
                    eventName: 'NEW_ANNOUNCEMENT',
                    target: { type: 'PARENT', filter: { organizationId: org.organizationId } },
                    data: { title, message },
                    sender
                }));
            }
        } else if (targetType === "HOSTEL") {
            for (let h of hostels) {
                notificationPromises.push(orchestratorService.triggerNotification({
                    eventName: 'NEW_ANNOUNCEMENT',
                    target: { type: 'STUDENT', filter: { hostelId: h.hostelId } },
                    data: { title, message },
                    sender
                }));
                notificationPromises.push(orchestratorService.triggerNotification({
                    eventName: 'NEW_ANNOUNCEMENT',
                    target: { type: 'PARENT', filter: { hostelId: h.hostelId } },
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
