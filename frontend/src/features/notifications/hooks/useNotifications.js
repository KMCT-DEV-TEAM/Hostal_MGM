import { useState, useEffect } from 'react';
import notificationApi from '../api/notificationApi';
import { formatTimeAgo } from '../utils/formatDate';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await notificationApi.getMyNotifications({ limit: 50 });
            // Adapt the backend response if necessary, assuming res.data.data.notifications
            const fetchedNotifications = res?.data?.data?.notifications || [];
            
            // Basic mapping to ensure frontend components get the expected props
            const formattedNotifications = fetchedNotifications.map(n => ({
                id: n._id || n.id,
                event: n.event?.event || 'SYSTEM_ALERT',
                title: n.title,
                sender: n.recipient?.snapshot || { name: 'System', role: 'System' },
                description: n.message || n.description,
                timeAgo: formatTimeAgo(n.createdAt),
                isRead: n.isRead
            }));

            setNotifications(formattedNotifications);
            setUnreadCount(res?.data?.unreadCount || 0);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAllAsRead = async () => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            
            await notificationApi.markAllAsRead();
        } catch (error) {
            console.error("Failed to mark all as read", error);
            // Revert on failure by refetching
            fetchNotifications();
        }
    };

    const markAsRead = async (id) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            
            await notificationApi.markAsRead(id);
        } catch (error) {
            console.error("Failed to mark as read", error);
            fetchNotifications(); // Revert
        }
    };

    return {
        notifications,
        loading,
        unreadCount,
        markAllAsRead,
        markAsRead,
        refresh: fetchNotifications
    };
};
