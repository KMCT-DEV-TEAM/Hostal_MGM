import Notification from './notification.model.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * @desc    Get all notifications for the current user
 * @route   GET /api/v1/notifications
 * @access  Private
 */
export const getMyNotifications = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { recipient: req.user.id };

    if (req.query.isRead !== undefined) {
        query.isRead = req.query.isRead === 'true';
    }

    const notifications = await Notification.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });

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
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: req.user.id },
        { isRead: true },
        { new: true, runValidators: true }
    );

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
    await Notification.updateMany(
        { recipient: req.user.id, isRead: false },
        { isRead: true }
    );

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
    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        recipient: req.user.id
    });

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

    const notification = await Notification.create({
        recipient,
        title,
        message,
        type,
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
