import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import NotificationItem from '../components/NotificationItem';
import { Loader2 } from 'lucide-react';

const NotificationsDesktopView = ({
    notifications,
    loading,
    markAsRead,
    hasMore,
    fetchingMore,
    bottomRef
}) => {
    return (
        <div className="w-full h-full p-4 md:p-6 bg-background-secondary overflow-y-auto">
            {/* Page Title */}
            <div className="mb-6">
                <PageHeader
                    title="Notifications"
                    subtitle="View and manage notifications"
                />
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 relative">
                <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    {/* <X className="w-4 h-4" /> */}
                </button>

                {/* Notifications List */}
                <div className="p-6">
                    {loading && notifications.length === 0 ? (
                        <div className="py-10 text-center text-sm text-text-secondary">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                        <div className="py-10 text-center text-sm text-text-secondary">No new notifications</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {notifications.map((item, index) => (
                                <React.Fragment key={item.id}>
                                    <NotificationItem notification={item} onMarkAsRead={markAsRead} />
                                    {/* Subtle Divider */}
                                    {index < notifications.length - 1 && (
                                        <div className="h-px bg-gray-50 mx-4" />
                                    )}
                                </React.Fragment>
                            ))}

                            {/* Infinite Scroll Target */}
                            {hasMore && (
                                <div ref={bottomRef} className="h-10 w-full flex items-center justify-center mt-4">
                                    {fetchingMore && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsDesktopView;
