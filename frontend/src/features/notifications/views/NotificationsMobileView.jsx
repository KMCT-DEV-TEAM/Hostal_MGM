import React from 'react';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import MobileNotificationCard from '../components/MobileNotificationCard';
import NotificationSkeleton from '../components/NotificationSkeleton';
import Dropdown from '@/components/ui/Dropdown';
import { Loader2, CheckCheck, Users } from 'lucide-react';

const NotificationsMobileView = ({
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    hasMore,
    fetchingMore,
    isParent,
    students,
    selectedStudentId,
    setSelectedStudentId,
    filter,
    setFilter
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

    const hasUnread = notifications.some(n => !n.isRead);

    const studentOptions = [
        { label: 'All Students', value: '' },
        ...(students || []).map(s => ({ label: s.name, value: s._id }))
    ];

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                <div className="flex flex-col gap-3 mb-1">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                        <div className="flex items-center p-1 bg-white border border-gray-200 rounded-full shrink-0">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${filter === 'all' ? 'bg-[#0A437A] text-white' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('read')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${filter === 'read' ? 'bg-[#0A437A] text-white' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Read
                            </button>
                            <button
                                onClick={() => setFilter('unread')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${filter === 'unread' ? 'bg-[#0A437A] text-white' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Unread
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex-1 min-w-[140px]">
                            {isParent && students?.length > 0 && (
                                <Dropdown
                                    options={studentOptions}
                                    value={selectedStudentId}
                                    onChange={setSelectedStudentId}
                                    placeholder="All Students"
                                    hideChevron={true}
                                    mobileIcon={<Users className="w-4 h-4 text-gray-500" />}
                                    triggerClassName="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 min-w-[120px]"
                                />
                            )}
                        </div>

                        {!loading && notifications.length > 0 && hasUnread && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors bg-blue-50/50 px-3 py-1.5 rounded-full shrink-0 ml-auto"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Mark all as read
                            </button>
                        )}
                    </div>

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
        </div>
    );
};

export default NotificationsMobileView;
