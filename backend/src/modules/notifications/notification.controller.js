import { notificationRepository } from './notification.repository.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { orchestratorService } from './services/orchestrator.service.js';

/**
 * Helper to determine the Mongoose model for a given user role
 */
const getModelForRole = (role) => {
    const normalizedRole = (role || '').toLowerCase();
    if (normalizedRole === 'student') return 'Student';
    if (normalizedRole === 'parent') return 'Parent';
    return 'User';
};
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

    const userModel = getModelForRole(req.user.role);

    const { notifications, total, unreadCount } = await notificationRepository.findUserNotifications(
        req.user.id,
        userModel,
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
    const userModel = getModelForRole(req.user.role);
    await notificationRepository.markAllAsRead(req.user.id, userModel);

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
 * @desc    Get notifications scoped to a specific student in V2 M:N architecture
 * @route   GET /api/v2/students/:studentId/notifications
 * @access  Private
 */
export const getMyNotificationsV2 = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const studentId = req.params.studentId;

    let isRead = undefined;
    if (req.query.isRead !== undefined) {
        isRead = req.query.isRead === 'true';
    }

    const userModel = getModelForRole(req.user.role);

    // The repository method usually fetches by recipient ID. 
    // We will fetch and then filter by metadata.studentId.
    // However, if the repository supports a filter param, we can pass it, but
    // let's just do a direct mongoose query here for the V2 endpoint to guarantee correct filtering.
    const { default: Notification } = await import('./notification.model.js');
    
    const query = {
        'recipient.id': req.user.id,
        'recipient.model': userModel,
        'metadata.studentId': studentId
    };

    if (isRead !== undefined) {
        query.isRead = isRead;
    }

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Notification.countDocuments(query),
        Notification.countDocuments({ ...query, isRead: false })
    ]);

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

