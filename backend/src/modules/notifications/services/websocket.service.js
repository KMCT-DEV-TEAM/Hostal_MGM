import { getIo } from '../../../config/socket.js';

/**
 * Websocket Service
 * 
 * A wrapper around the core Socket.io instance to handle emitting
 * real-time events to connected clients.
 */
class WebsocketService {
    /**
     * Emits a real-time event to a specific user (assuming they join a room with their userId).
     * @param {String} userId - The target user's ID
     * @param {String} eventName - The socket event name (e.g., 'new_notification')
     * @param {Object} payload - The data to send
     */
    sendToUser(userId, eventName, payload) {
        const io = getIo();
        if (io) {
            // Converts ObjectId to string just in case
            io.to(userId.toString()).emit(eventName, payload);
        }
    }

    /**
     * Emits a real-time event to a specific room or group of users.
     * @param {String} roomName - The name of the room (e.g., 'all-wardens')
     * @param {String} eventName - The socket event name
     * @param {Object} payload - The data to send
     */
    sendToRoom(roomName, eventName, payload) {
        const io = getIo();
        if (io) {
            io.to(roomName).emit(eventName, payload);
        }
    }

    /**
     * Broadcasts a real-time event to all connected clients.
     * @param {String} eventName - The socket event name
     * @param {Object} payload - The data to send
     */
    broadcast(eventName, payload) {
        const io = getIo();
        if (io) {
            io.emit(eventName, payload);
        }
    }
}

export const websocketService = new WebsocketService();
