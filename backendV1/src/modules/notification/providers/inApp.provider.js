import { getIo } from '../../../config/socket.js';

export class InAppProvider {
    /**
     * Sends an in-app notification via WebSockets.
     */
    async send(payload, recipientDetails) {
        if (!recipientDetails.id && !recipientDetails.userId) {
            throw new Error('user id is required for in-app notifications');
        }

        const userId = (recipientDetails.id || recipientDetails.userId).toString();
        const io = getIo();

        if (io) {
            io.to(userId).emit("notification", {
                ...payload,
                timestamp: new Date()
            });
            console.log(`[InAppProvider] Emitted realtime socket event to room ${userId}`);
        }

        return { status: 'DELIVERED', channel: 'in-app', timestamp: new Date() };
    }
}
