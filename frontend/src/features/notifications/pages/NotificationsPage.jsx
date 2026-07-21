import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import NotificationsDesktopView from '../views/NotificationsDesktopView';
import NotificationsMobileView from '../views/NotificationsMobileView';

const NotificationsPage = () => {
    const { 
        notifications, 
        loading, 
        markAsRead, 
        markAllAsRead,
        fetchNextPage, 
        hasMore, 
        fetchingMore 
    } = useNotifications();

    const { isMobile } = useBreakpoint();

    const bottomRef = useIntersectionObserver(
        () => {
            if (hasMore && !fetchingMore) {
                fetchNextPage();
            }
        },
        { rootMargin: '100px', threshold: 0.1 }
    );

    const viewProps = {
        notifications,
        loading,
        markAsRead,
        markAllAsRead,
        hasMore,
        fetchingMore,
        bottomRef
    };

    return isMobile ? (
        <NotificationsMobileView {...viewProps} />
    ) : (
        <NotificationsDesktopView {...viewProps} />
    );
};

export default NotificationsPage;
