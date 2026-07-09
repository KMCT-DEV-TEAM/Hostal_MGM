import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationItem from './NotificationItem';

const LatestNotificationPopup = ({ notification, onClose }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    // Auto-close after 8 seconds, but pause if hovered
    useEffect(() => {
        if (!notification || isHovered) return;
        
        const timer = setTimeout(() => {
            onClose();
        }, 8000);
        
        return () => clearTimeout(timer);
    }, [notification, onClose, isHovered]);

    if (!notification) return null;

    return (
        <div 
            className="absolute top-12 right-0 w-[350px] bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col z-[60] animate-in slide-in-from-top-2 fade-in duration-300"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 bg-white rounded-t-xl">
                <span className="text-sm font-semibold text-gray-800">Latest Notification</span>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">now</span>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-2 cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                <NotificationItem notification={notification} />
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-50 text-center bg-white rounded-b-xl">
                <button
                    onClick={() => {
                        navigate('/dashboard/notifications');
                        onClose();
                    }}
                    className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1 w-full"
                >
                    View all notifications <span className="text-lg leading-none">&rsaquo;</span>
                </button>
            </div>
            
            {/* Pointer arrow for popover pointing to the bell */}
            <div className="absolute -top-2 right-[25px] w-4 h-4 bg-white border-t border-l border-gray-100 transform rotate-45 z-0"></div>
        </div>
    );
};

export default LatestNotificationPopup;
