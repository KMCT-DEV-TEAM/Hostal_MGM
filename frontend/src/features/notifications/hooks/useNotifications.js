import { useState, useEffect } from 'react';

const MOCK_NOTIFICATIONS = [
    {
        id: '1',
        type: 'leave_approved',
        title: 'Approved leave',
        sender: { name: 'Beena K', role: 'Admin' },
        description: 'Called and discussed project requirements.client is ....',
        timeAgo: '2 hours ago',
        isRead: false,
        group: 'TODAY'
    },
    {
        id: '2',
        type: 'leave_rejected',
        title: 'Rejected leave',
        sender: { name: 'Beena K', role: 'Admin' },
        description: 'Called and discussed project requirements.client is ....',
        timeAgo: '2 hours ago',
        isRead: false,
        group: 'TODAY'
    },
    {
        id: '3',
        type: 'attendance_marked',
        title: 'Marked Attendance',
        sender: { name: 'Beena K', role: 'Admin' },
        description: 'Called and discussed project requirements.client is ....',
        timeAgo: 'Yesterday, 6:20',
        isRead: false,
        group: 'YESTERDAY'
    },
    {
        id: '4',
        type: 'leave_approved',
        title: 'parent Approved Leave',
        sender: { name: 'Satheeshan Pillai', role: 'Parent' },
        description: 'Called and discussed project requirements.client is ....',
        timeAgo: 'Yesterday, 6:20',
        isRead: false,
        group: 'YESTERDAY'
    },
    {
        id: '5',
        type: 'status_updated',
        title: 'Updated status',
        sender: { name: 'Arjun', role: 'Maintenance Staff' },
        description: 'Called and discussed project requirements.client is ....',
        timeAgo: 'Yesterday, 6:20',
        isRead: false,
        group: 'YESTERDAY'
    }
];

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call
        const timer = setTimeout(() => {
            setNotifications(MOCK_NOTIFICATIONS);
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    // Group notifications by the 'group' field
    const groupedNotifications = notifications.reduce((acc, notification) => {
        const { group } = notification;
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(notification);
        return acc;
    }, {});

    return {
        notifications,
        groupedNotifications,
        loading,
        markAllAsRead,
        markAsRead
    };
};
