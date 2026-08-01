import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import NotificationsDesktopView from '../views/NotificationsDesktopView';
import NotificationsMobileView from '../views/NotificationsMobileView';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import { useState } from 'react';

const NotificationsPage = () => {
    const { user } = useAuthStore();
    const students = user?.role === ROLES.PARENT ? user.students || [] : [];
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [filter, setFilter] = useState('all');

    const { 
        notifications, 
        loading, 
        markAsRead, 
        markAllAsRead,
        fetchNextPage, 
        hasMore, 
        fetchingMore 
    } = useNotifications(selectedStudentId === '' ? null : selectedStudentId, filter);

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
        bottomRef,
        isParent: user?.role === ROLES.PARENT,
        students,
        selectedStudentId,
        setSelectedStudentId,
        filter,
        setFilter
    };

    return isMobile ? (
        <NotificationsMobileView {...viewProps} />
    ) : (
        <NotificationsDesktopView {...viewProps} />
    );
};

export default NotificationsPage;
