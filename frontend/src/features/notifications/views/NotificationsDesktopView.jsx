import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import NotificationItem from '../components/NotificationItem';
import Dropdown from '@/components/ui/Dropdown';
import { Loader2, CheckCheck, Bell } from 'lucide-react';

const NotificationsDesktopView = ({
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    hasMore,
    fetchingMore,
    bottomRef,
    isParent,
    students,
    selectedStudentId,
    setSelectedStudentId,
    filter,
    setFilter
}) => {
    const hasUnread = notifications.some(n => !n.isRead);

    const studentOptions = [
        { label: 'All Students', value: '' },
        ...(students || []).map(s => ({ label: s.name, value: s.id || s._id }))
    ];

    return (
        <div className="w-full h-full p-4 md:p-6 bg-background-secondary overflow-y-auto">
            {/* Header Area */}
            <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-primary" />
                    </div>
                    <h1 className="text-xl font-semibold text-primary">Notifications</h1>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-white rounded-[14px] p-1 flex shadow-sm border border-gray-100">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-5 text-center py-1.5 text-[13px] font-semibold rounded-[10px] transition-all duration-200 ${filter === 'all' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('read')}
                            className={`px-5 text-center py-1.5 text-[13px] font-semibold rounded-[10px] transition-all duration-200 ${filter === 'read' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Read
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-5 text-center py-1.5 text-[13px] font-semibold rounded-[10px] transition-all duration-200 ${filter === 'unread' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Unread
                        </button>
                    </div>

                    {isParent && students?.length > 0 && (
                        <Dropdown
                            options={studentOptions}
                            value={selectedStudentId}
                            onChange={setSelectedStudentId}
                            placeholder="All Students"
                            triggerClassName="px-4 py-1.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 min-w-[140px]"
                        />
                    )}

                    <button
                        onClick={markAllAsRead}
                        disabled={!hasUnread || loading}
                        className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${hasUnread && !loading ? 'text-primary hover:bg-blue-50' : 'text-gray-400 opacity-50 cursor-not-allowed'}`}
                    >
                        <CheckCheck className="w-4 h-4" />
                        Mark all as read
                    </button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 relative">
                {/* Drop the dummy absolute button */}

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
