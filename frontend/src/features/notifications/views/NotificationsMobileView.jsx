import React from 'react';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import MobileNotificationCard from '../components/MobileNotificationCard';
import NotificationSkeleton from '../components/NotificationSkeleton';
import { Loader2 } from 'lucide-react';

const NotificationsMobileView = ({
    notifications,
    loading,
    markAsRead,
    hasMore,
    fetchingMore,
    bottomRef
}) => {

    useLayoutConfig({
        header: {
            variant: "page",
            title: "Notifications",
            showBack: true
        },
        footer: {
            visible: false
        }
    });

    return (
        <div className="w-full h-full flex flex-col">
            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {loading && notifications.length === 0 ? (
                    <NotificationSkeleton rows={5} />
                ) : notifications.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-500">No new notifications</div>
                ) : (
                    <>
                        {notifications.map((item) => (
                            <MobileNotificationCard
                                key={item.id}
                                notification={item}
                                onMarkAsRead={markAsRead}
                            />
                        ))}

                        {/* Infinite Scroll Target */}
                        {hasMore && (
                            <div ref={bottomRef} className="h-10 w-full flex items-center justify-center mt-2 shrink-0">
                                {fetchingMore && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                            </div>
                        )}

                        {/* Safe area padding at bottom */}
                        <div className="h-4 shrink-0"></div>
                    </>
                )}
            </div>
        </div>
    );
};

export default NotificationsMobileView;
