import { useEffect } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';

export const useNotifications = () => {
    const store = useNotificationStore();

    useEffect(() => {
        store.initialize();
    }, [store.initialize]);

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
