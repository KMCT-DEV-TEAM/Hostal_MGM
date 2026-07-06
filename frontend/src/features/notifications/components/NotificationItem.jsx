import React from 'react';
import NotificationIcon from './NotificationIcon';

const NotificationItem = ({ event, title, sender, description, timeAgo, isRead = false }) => {
    return (
        <div className="flex gap-4 py-4 px-2 hover:bg-gray-50/80 transition-colors rounded-xl cursor-pointer">
            <NotificationIcon event={event} />
            <div className="flex-1 min-w-0 flex flex-col justify-center relative">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="text-[14px] font-bold text-text-primary leading-none">{title}</h4>
                    <span className="text-[10px] text-text-secondary whitespace-nowrap ml-2 leading-none">{timeAgo}</span>
                </div>
                <div className="text-[11px] text-text-secondary mb-2 leading-none">
                    {sender?.name} ( {sender?.role} )
                </div>
                <div className="flex justify-between items-center gap-4">
                    <p className="text-[12px] text-gray-500 truncate leading-tight">
                        {description}
                    </p>
                    {!isRead && (
                        <div className="w-1.5 h-1.5 rounded-full bg-warning shrink-0"></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationItem;
