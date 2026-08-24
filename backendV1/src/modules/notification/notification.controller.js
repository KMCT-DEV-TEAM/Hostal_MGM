import { notificationService } from './notification.service.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendError } from '../../utils/response.js';

export const getMyNotifications = asyncHandler(async (req, res, next) => {
    const { page, limit, isRead } = req.query;
    
    let isReadBool = undefined;
    if (isRead !== undefined) {
        isReadBool = isRead === 'true';
    }

    const result = await notificationService.getUserNotifications(req.user.id, req.user.role, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        isRead: isReadBool
    });

    res.status(200).json({
        status: 'success',
        results: result.notifications.length,
        unreadCount: result.unreadCount,
        pagination: {
            total: result.total,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            pages: Math.ceil(result.total / (parseInt(limit) || 20))
        },
        data: {
            notifications: result.notifications
        }
    });
});

export const markAsRead = asyncHandler(async (req, res, next) => {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);

    if (!notification) {
        return sendError(res, 404, 'No notification found with that ID or unauthorized');
    }

    res.status(200).json({
        status: 'success',
        data: {
            notification
        }
    });
});

export const markAllAsRead = asyncHandler(async (req, res, next) => {
    await notificationService.markAllAsRead(req.user.id, req.user.role);

    res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read'
    });
});

export const deleteNotification = asyncHandler(async (req, res, next) => {
    const notification = await notificationService.deleteNotification(req.params.id, req.user.id);

    if (!notification) {
        return sendError(res, 404, 'No notification found with that ID or unauthorized');
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

export const testBroadcast = asyncHandler(async (req, res, next) => {
    const { eventName, target, data, channels, sender } = req.body;

    if (!eventName || !target) {
        return sendError(res, 400, 'Please provide eventName and target');
    }

    const result = await notificationService.triggerBroadcast({
        eventName,
        target,
        data: data || {},
        channels,
        sender: sender || { id: req.user.id, role: req.user.role, snapshot: { name: req.user.name } }
    });

    res.status(200).json({
        status: 'success',
        message: 'Broadcast triggered successfully',
        data: result
    });
});
