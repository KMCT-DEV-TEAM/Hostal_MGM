import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationIcon from './NotificationIcon';

const NotificationItem = ({ notification, onMarkAsRead }) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showToggle, setShowToggle] = useState(false);
    const textRef = useRef(null);

    useEffect(() => {
        const checkTruncation = () => {
            if (textRef.current && !isExpanded) {
                // When truncated (single line), scrollWidth will be greater than clientWidth
                setShowToggle(textRef.current.scrollWidth > textRef.current.clientWidth);
            }
        };

        checkTruncation();
        window.addEventListener('resize', checkTruncation);
        return () => window.removeEventListener('resize', checkTruncation);
    }, [notification.description, isExpanded]);

    const handleClick = (e) => {
        if (onMarkAsRead && !notification.isRead) {
            onMarkAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const toggleExpand = (e) => {
        e.stopPropagation(); // Prevent the main card click
        setIsExpanded(!isExpanded);
        if (onMarkAsRead && !notification.isRead) {
            onMarkAsRead(notification.id);
        }
    };

    return (
        <div
            onClick={handleClick}
            className="flex gap-4 py-4 px-2 hover:bg-gray-50/80 transition-colors rounded-xl cursor-pointer group"
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

                <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col flex-1 min-w-0">
                        <div
                            className={`relative text-[12px] text-gray-500 leading-tight overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-60' : 'max-h-4'
                                }`}
                        >
                            <p ref={textRef} className={isExpanded ? "whitespace-normal wrap-break-word" : "truncate"}>
                                {notification.description}
                            </p>
                        </div>

                        {showToggle && (
                            <button
                                onClick={toggleExpand}
                                className="text-[10px] text-primary hover:text-primary/80 hover:underline text-left mt-1 font-medium z-10 transition-colors"
                            >
                                {isExpanded ? 'Read less' : 'Read more'}
                            </button>
                        )}
                    </div>
                    {!notification.isRead && (
                        <div className="w-1.5 h-1.5 rounded-full bg-warning shrink-0 mt-1"></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationItem;
