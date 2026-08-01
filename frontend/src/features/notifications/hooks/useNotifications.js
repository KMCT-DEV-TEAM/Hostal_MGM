import { useEffect } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';

export const useNotifications = (studentId = null, filter = 'all') => {
    const store = useNotificationStore();

    useEffect(() => {
        store.initialize(studentId, filter);
    }, [store.initialize, studentId, filter]);

    return {
        notifications: store.notifications,
        loading: store.loading,
        fetchingMore: store.fetchingMore,
        unreadCount: store.unreadCount,
        latestNotification: store.latestNotification,
        hasMore: store.hasMore,
        clearLatestNotification: store.clearLatestNotification,
        fetchNextPage: store.fetchNextPage,
        markAsRead: store.markAsRead,
        markAllAsRead: store.markAllAsRead,
        refresh: store.fetchInitial
    };
};
