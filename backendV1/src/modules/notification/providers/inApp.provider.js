import { getIo } from '../../../config/socket.js';

export class InAppProvider {
    /**
     * Sends an in-app notification via WebSockets.
     */
    async send(payload, recipientDetails) {
        if (!recipientDetails.id && !recipientDetails.userId) {
            console.error('[Notification DEBUG - InApp] Missing user ID in recipientDetails:', recipientDetails);
            throw new Error('user id is required for in-app notifications');
        }

        const userId = (recipientDetails.id || recipientDetails.userId).toString();
        const io = getIo();

        if (io) {
            console.log(`[Notification DEBUG - InApp] 🚀 Emitting realtime socket event 'notification' to room [${userId}]`, {
                title: payload.title,
                message: payload.message,
                data: payload.data
            });

            io.to(userId).emit("notification", {
                ...payload,
                timestamp: new Date()
            });
        } else {
            console.warn(`[Notification DEBUG - InApp] ⚠️ Socket.io is NOT initialized! Realtime socket emit skipped for user [${userId}]`);
        }

        return { status: 'DELIVERED', channel: 'in-app', timestamp: new Date() };
    }
}
