import React from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import NotificationItem from '../components/NotificationItem';
import { useNotifications } from '../hooks/useNotifications';

const NotificationsPage = () => {
    const { groupedNotifications, loading, markAllAsRead, markAsRead } = useNotifications();

    // Tab state (visual only for now as requested)
    const [activeTab, setActiveTab] = React.useState('All');

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
                {/* Top close button mimicking the image (optional, often close isn't needed on a full page but it's in the design) */}
                <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    {/* <X className="w-4 h-4" /> */}
                </button>

                {/* Card Header */}


                {/* Notifications List */}
                <div className="p-6">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-gray-500">Loading notifications...</div>
                    ) : Object.keys(groupedNotifications).length === 0 ? (
                        <div className="py-10 text-center text-sm text-gray-500">No new notifications</div>
                    ) : (
                        Object.entries(groupedNotifications).map(([groupName, items]) => (
                            <div key={groupName} className="mb-6 last:mb-0">
                                <div className="text-xs font-bold text-gray-400 tracking-wider mb-4 uppercase">
                                    {groupName}
                                </div>
                                <div className="flex flex-col gap-2">
                                    {items.map((item, index) => (
                                        <React.Fragment key={item.id}>
                                            <div onClick={() => markAsRead(item.id)}>
                                                <NotificationItem {...item} />
                                            </div>
                                            {/* Subtle Divider */}
                                            {index < items.length - 1 && (
                                                <div className="h-px bg-gray-50 mx-4" />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
