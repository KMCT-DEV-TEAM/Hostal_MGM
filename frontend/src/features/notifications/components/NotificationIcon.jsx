import React from 'react';
import { getNotificationIconConfig } from '../utils/notificationIconConfig';

const NotificationIcon = ({ event }) => {
    // We expect the 'event' string here, e.g. 'PASS_ADMIN_APPROVED'
    const { icon: Icon, colorClass, borderColorClass } = getNotificationIconConfig(event);

    return (
        <div className={`w-8 h-8 rounded-full border ${borderColorClass} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${colorClass}`} strokeWidth={2} />
        </div>
    );
};

export default NotificationIcon;
