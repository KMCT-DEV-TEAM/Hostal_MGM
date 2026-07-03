import { notificationRepository } from './notification.repository.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { orchestratorService } from './services/orchestrator.service.js';
/**
 * @desc    Get all notifications for the current user
 * @route   GET /api/v1/notifications
 * @access  Private
 */
export const getMyNotifications = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    let isRead = undefined;
    if (req.query.isRead !== undefined) {
        isRead = req.query.isRead === 'true';
    }

    // Assuming the authenticated user is always of model 'User' for these endpoints
    const { notifications, total, unreadCount } = await notificationRepository.findUserNotifications(
        req.user.id, 
        'User', 
        { skip, limit, isRead }
    );

    res.status(200).json({
        status: 'success',
        results: notifications.length,
        unreadCount,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        },
        data: {
            notifications
        }
    });
});

/**
 * @desc    Mark a notification as read
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res, next) => {
    const notification = await notificationRepository.markAsRead(req.params.id, req.user.id);

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

/**
 * @desc    Mark all notifications as read for current user
 * @route   PATCH /api/v1/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = asyncHandler(async (req, res, next) => {
    await notificationRepository.markAllAsRead(req.user.id, 'User');

    res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read'
    });
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, res, next) => {
    const notification = await notificationRepository.archiveNotification(req.params.id, req.user.id);

    if (!notification) {
        return sendError(res, 404, 'No notification found with that ID or unauthorized');
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

/**
 * @desc    Create a notification (Admin / System internal use)
 * @route   POST /api/v1/notifications
 * @access  Private/Admin
 */
export const createNotification = asyncHandler(async (req, res, next) => {
    const { recipient, title, message, type, link, metadata } = req.body;

    if (!recipient || !title || !message) {
        return sendError(res, 400, 'Please provide recipient, title, and message');
    }

    const notification = await notificationRepository.createNotification({
        recipient: {
            id: recipient,
            model: 'User' // Defaulting to User for legacy support
        },
        event: {
            event: 'SYSTEM_ALERT',
            category: 'SYSTEM',
            priority: 'NORMAL',
            type: type || 'info'
        },
        title,
        message,
        link,
        metadata
    });

    res.status(201).json({
        status: 'success',
        data: {
            notification
        }
    });
});

/**
 * @desc    Test trigger a notification broadcast
 * @route   POST /api/notifications/broadcast
 * @access  Private/Admin
 */
export const testBroadcast = asyncHandler(async (req, res, next) => {
    const { eventName, target, data, channels, sender } = req.body;

    if (!eventName || !target) {
        return sendError(res, 400, 'Please provide eventName and target');
    }

    const result = await orchestratorService.triggerNotification({
        eventName,
        target,
        data: data || {},
        channels,
        sender
    });

    res.status(200).json({
        status: 'success',
        message: 'Broadcast triggered successfully',
        data: result
    });
});

/**
 * @desc    Test endpoint matching specific payload structure
 * @route   POST /api/notifications/test
 * @access  Private/Admin
 */
export const testNotification = asyncHandler(async (req, res, next) => {
    const { event, recipients, data, sender } = req.body;

    if (!event || !recipients || !Array.isArray(recipients)) {
        return sendError(res, 400, 'Please provide event and a recipients array');
    }

    const results = [];
    for (const target of recipients) {
        try {
            const result = await orchestratorService.triggerNotification({
                eventName: event,
                target,
                data: data || {},
                channels: ['in-app', 'push', 'email'], // Request all; orchestrator will discard unsupported
                sender
            });
            results.push({ target, status: 'success', result });
        } catch (error) {
            results.push({ target, status: 'error', error: error.message });
        }
    }

    res.status(200).json({
        status: 'success',
        message: 'Test notification triggered',
        data: results
    });
});

