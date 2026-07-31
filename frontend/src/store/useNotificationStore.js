import { create } from 'zustand';
import notificationApi from '@/features/notifications/api/notificationApi';
import { formatTimeAgo } from '@/utils/formatters';
import { getSocket } from '@/services/socket.service';

const formatNotification = (n) => ({
    id: n._id || n.id,
    event: n.event?.event || n.event || 'SYSTEM_ALERT',
    title: n.title,
    sender: n.sender?.snapshot || n.recipient?.snapshot || { name: 'System', role: 'System' },
    description: n.message || n.description,
    timeAgo: formatTimeAgo(n.createdAt || new Date()),
    isRead: n.isRead || false,
    link: n.link
});

export const useNotificationStore = create((set, get) => ({
    notifications: [],
    loading: false,
    fetchingMore: false,
    unreadCount: 0,
    latestNotification: null,
    page: 1,
    hasMore: true,
    isInitialized: false,
    currentStudentId: null,
    currentFilter: 'all',

    initialize: (studentId = null, filter = 'all') => {
        if (!get().isInitialized || get().currentStudentId !== studentId || get().currentFilter !== filter) {
            set({ isInitialized: true, currentStudentId: studentId, currentFilter: filter });
            get().fetchInitial(20, studentId, filter);
            get().setupSocket();
        }
    },

    fetchInitial: async (limit = 20, studentId = null, filter = 'all') => {
        try {
            set({ loading: true });
            const params = { limit, page: 1 };
            if (studentId) params.studentId = studentId;
            if (filter === 'read') params.isRead = true;
            if (filter === 'unread') params.isRead = false;
            const res = await notificationApi.getMyNotifications(params);
            const fetched = res?.data?.data?.notifications || [];

            const formatted = fetched.map(formatNotification);

            set({
                notifications: formatted,
                unreadCount: res?.data?.unreadCount || 0,
                page: 1,
                hasMore: res?.data?.pagination?.page < res?.data?.pagination?.pages,
                loading: false
            });
        } catch (error) {
            console.error("Failed to fetch initial notifications", error);
            set({ loading: false });
        }
    },

    fetchNextPage: async (limit = 20) => {
        const { page, hasMore, fetchingMore, currentStudentId, currentFilter } = get();
        if (!hasMore || fetchingMore) return;

        try {
            set({ fetchingMore: true });
            const nextPage = page + 1;
            const params = { limit, page: nextPage };
            if (currentStudentId) params.studentId = currentStudentId;
            if (currentFilter === 'read') params.isRead = true;
            if (currentFilter === 'unread') params.isRead = false;
            const res = await notificationApi.getMyNotifications(params);
            const fetched = res?.data?.data?.notifications || [];

            const formatted = fetched.map(formatNotification);

            set(state => ({
                notifications: [...state.notifications, ...formatted],
                page: nextPage,
                hasMore: res?.data?.pagination?.page < res?.data?.pagination?.pages,
                fetchingMore: false
            }));
        } catch (error) {
            console.error("Failed to fetch next page notifications", error);
            set({ fetchingMore: false });
        }
    },

    markAsRead: async (id) => {
        try {
            const notification = get().notifications.find(n => n.id === id);
            if (!notification || notification.isRead) return;

            // Optimistic update
            set(state => ({
                notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
                unreadCount: Math.max(0, state.unreadCount - 1)
            }));
            await notificationApi.markAsRead(id);
        } catch (error) {
            console.error("Failed to mark as read", error);
            // Revert on failure
            get().fetchInitial();
        }
    },

    markAllAsRead: async () => {
        try {
            // Optimistic update
            set(state => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0
            }));
            await notificationApi.markAllAsRead();
        } catch (error) {
            console.error("Failed to mark all as read", error);
            get().fetchInitial();
        }
    },

    clearLatestNotification: () => set({ latestNotification: null }),

    setupSocket: () => {
        const socket = getSocket();

        const handleNewNotification = (newNotification) => {
            console.log("New realtime notification received:", newNotification);

            const formatted = {
                id: newNotification._id || newNotification.id || Date.now().toString(),
                event: newNotification.event?.event || newNotification.event || 'SYSTEM_ALERT',
                title: newNotification.title,
                sender: newNotification.sender || newNotification.recipient?.snapshot || { name: 'System', role: 'System' },
                description: newNotification.message || newNotification.description,
                timeAgo: 'Just now',
                isRead: false,
                link: newNotification.link
            };

            set(state => ({
                notifications: [formatted, ...state.notifications],
                unreadCount: state.unreadCount + 1,
                latestNotification: formatted
            }));
        };

        socket.on("notification", handleNewNotification);
    }
}));
