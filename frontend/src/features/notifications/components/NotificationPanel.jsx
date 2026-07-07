import React from 'react';
import { X, CheckCheck, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationItem from './NotificationItem';

const NotificationPanel = ({ isOpen, onClose, notifications, loading, markAllAsRead, markAsRead }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="absolute -right-20 mt-10 w-sm bg-white rounded-2xl border border-gray-100 flex flex-col z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-5 pb-3 mt-2 border-b border-gray-50 relative">
                <div className="flex items-center gap-2 text-primary">
                    <Bell className="w-4 h-4" />
                    <h3 className="text-[15px] font-semibold">Notifications</h3>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors text-[11px] font-medium"
                    >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all as read
                    </button>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-h-[450px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent pb-2">
                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">No new notifications</div>
                ) : (
                    <div className="px-3 py-2 flex flex-col gap-1">
                        {notifications.slice(0, 10).map((item, index, arr) => (
                            <React.Fragment key={item.id}>
                                    <NotificationItem notification={item} onMarkAsRead={markAsRead} />
                                {/* Divider between items, except the last one */}
                                {index < arr.length - 1 && (
                                    <div className="h-px bg-gray-50 mx-2" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-50 text-center bg-white">
                <button
                    onClick={() => {
                        navigate('/dashboard/notifications');
                        if (onClose) onClose();
                    }}
                    className="text-[12px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1 w-full"
                >
                    View All <span className="text-lg leading-none">&rarr;</span>
                </button>
            </div>
        </div>
    );
};

export default NotificationPanel;
