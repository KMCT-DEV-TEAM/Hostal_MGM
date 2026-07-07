import { useState, useEffect, useCallback } from 'react';
import notificationApi from '../api/notificationApi';
import { formatTimeAgo } from '@/utils/formatters';
import { getSocket } from '@/services/socket.service';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestNotification, setLatestNotification] = useState(null);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const res = await notificationApi.getMyNotifications({ limit: 50 });
            // Adapt the backend response if necessary, assuming res.data.data.notifications
            const fetchedNotifications = res?.data?.data?.notifications || [];
            console.log('fetched notification: ', res.data.data.notifications)

            // Basic mapping to ensure frontend components get the expected props
            const formattedNotifications = fetchedNotifications.map(n => ({
                id: n._id || n.id,
                event: n.event?.event || 'SYSTEM_ALERT',
                title: n.title,
                sender: n.sender?.snapshot || { name: 'System', role: 'System' },
                description: n.message || n.description,
                timeAgo: formatTimeAgo(n.createdAt),
                isRead: n.isRead,
                link: n.link
            }));

            setNotifications(formattedNotifications);
            setUnreadCount(res?.data?.unreadCount || 0);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();

        const socket = getSocket();
        
        const handleNewNotification = (newNotification) => {
            console.log("New realtime notification received:", newNotification);
            
            // Format the incoming socket notification to match the UI expectations
            const formatted = {
                id: newNotification._id || newNotification.id || Date.now().toString(),
                event: newNotification.event?.event || newNotification.event || 'SYSTEM_ALERT',
                title: newNotification.title,
                sender: newNotification.sender || newNotification.recipient?.snapshot || { name: 'System', role: 'System' },
                description: newNotification.message || newNotification.description,
                timeAgo: 'Just now',
                isRead: false
            };

            setNotifications(prev => [formatted, ...prev]);
            setUnreadCount(prev => prev + 1);
            setLatestNotification(formatted);
        };

        socket.on("notification", handleNewNotification);

        return () => {
            socket.off("notification", handleNewNotification);
        };
    }, [fetchNotifications]);

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
        latestNotification,
        clearLatestNotification: () => setLatestNotification(null),
        markAllAsRead,
        markAsRead,
        refresh: fetchNotifications
    };
};
