import React from 'react';
import { X, CheckCheck, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationItem from './NotificationItem';
import { useNotifications } from '../hooks/useNotifications';

const NotificationPanel = ({ isOpen, onClose }) => {
    const { groupedNotifications, loading, markAllAsRead, markAsRead } = useNotifications();
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
                ) : Object.keys(groupedNotifications).length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">No new notifications</div>
                ) : (
                    Object.entries(groupedNotifications).map(([groupName, items]) => (
                        <div key={groupName} className="mb-2">
                            <div className="px-5 py-3 text-[11px] font-bold text-gray-400 tracking-wider">
                                {groupName}
                            </div>
                            <div className="px-3 flex flex-col gap-1">
                                {items.map((item, index) => (
                                    <React.Fragment key={item.id}>
                                        <div onClick={() => markAsRead(item.id)}>
                                            <NotificationItem {...item} />
                                        </div>
                                        {/* Divider between items, except the last one in the group */}
                                        {index < items.length - 1 && (
                                            <div className="h-px bg-gray-50 mx-2" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-50 text-center bg-white">
                <button
                    onClick={() => {
                        navigate('/notifications');
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
