import React from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationIcon from './NotificationIcon';

const NotificationItem = ({ notification, onMarkAsRead }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onMarkAsRead && !notification.isRead) {
            onMarkAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    return (
        <div 
            onClick={handleClick}
            className="flex gap-4 py-4 px-2 hover:bg-gray-50/80 transition-colors rounded-xl cursor-pointer"
        >
            <NotificationIcon event={notification.event} />
            <div className="flex-1 min-w-0 flex flex-col justify-center relative">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="text-[14px] font-bold text-text-primary leading-none">{notification.title}</h4>
                    <span className="text-[10px] text-text-secondary whitespace-nowrap ml-2 leading-none">{notification.timeAgo}</span>
                </div>
                <div className="text-[11px] text-text-secondary mb-2 leading-none">
                    {notification.sender?.name} ( {notification.sender?.role} )
                </div>
                <div className="flex justify-between items-center gap-4">
                    <p className="text-[12px] text-gray-500 truncate leading-tight">
                        {notification.description}
                    </p>
                    {!notification.isRead && (
                        <div className="w-1.5 h-1.5 rounded-full bg-warning shrink-0"></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationItem;
