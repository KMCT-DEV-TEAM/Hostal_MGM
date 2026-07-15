import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotificationIconConfig } from '../utils/notificationIconConfig';

const MobileNotificationCard = ({ notification, onMarkAsRead }) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showToggle, setShowToggle] = useState(false);
    const textRef = useRef(null);

    useEffect(() => {
        const checkTruncation = () => {
            if (textRef.current && !isExpanded) {
                // When truncated (single line), scrollHeight might be greater than clientHeight
                // Alternatively, we can check if scrollWidth > clientWidth for single line truncation
                setShowToggle(textRef.current.scrollHeight > textRef.current.clientHeight || textRef.current.scrollWidth > textRef.current.clientWidth);
            }
        };

        checkTruncation();
        window.addEventListener('resize', checkTruncation);
        return () => window.removeEventListener('resize', checkTruncation);
    }, [notification?.description, notification?.message, isExpanded]);

    const handleClick = (e) => {
        if (onMarkAsRead && !notification.isRead) {
            onMarkAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const toggleExpand = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
        if (onMarkAsRead && !notification.isRead) {
            onMarkAsRead(notification.id);
        }
    };

    const { icon: Icon, colorClass } = getNotificationIconConfig(notification?.event);

    return (
        <div
            onClick={handleClick}
            className={`w-full bg-white rounded-[16px] p-4 flex gap-4 cursor-pointer transition-colors active:scale-[0.99] border ${
                notification.isRead ? 'border-gray-50 shadow-sm' : 'border-primary/10 shadow-md bg-blue-50/10'
            }`}
        >
            {/* Soft Square Icon */}
            <div className={`w-10 h-10 shrink-0 rounded-[12px] flex items-center justify-center bg-gray-50/80`}>
                <Icon className={`w-5 h-5 ${colorClass}`} strokeWidth={2} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="text-[14px] font-semibold text-text-primary leading-tight truncate">
                        {notification.title}
                    </h4>
                    
                    {/* Timestamp & Unread Indicator */}
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                        <span className="text-[10px] text-text-secondary whitespace-nowrap font-medium">
                            {notification.timeAgo}
                        </span>
                        {!notification.isRead && (
                            <div className="w-1.5 h-1.5 rounded-full bg-warning shrink-0"></div>
                        )}
                    </div>
                </div>

                {/* Sender Info */}
                {notification.sender?.name && (
                    <div className="text-[11px] text-primary/80 font-medium mb-1.5 leading-none">
                        {notification.sender.name}
                    </div>
                )}

                {/* Message / Description */}
                <div className="flex flex-col flex-1 min-w-0 mt-0.5">
                    <div
                        className={`relative text-[13px] text-text-secondary leading-snug overflow-hidden transition-all duration-300 ease-in-out ${
                            isExpanded ? 'max-h-60' : 'max-h-5'
                        }`}
                    >
                        <p ref={textRef} className={isExpanded ? "whitespace-normal break-words" : "truncate"}>
                            {notification?.description || notification?.message}
                        </p>
                    </div>

                    {showToggle && (
                        <button
                            onClick={toggleExpand}
                            className="text-[11px] text-primary hover:text-primary/80 hover:underline text-left mt-1.5 font-medium transition-colors w-max"
                        >
                            {isExpanded ? 'Read less' : 'Read more'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileNotificationCard;
