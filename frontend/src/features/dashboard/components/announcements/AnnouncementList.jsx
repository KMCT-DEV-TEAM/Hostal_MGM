import React from 'react';
import { Megaphone, Calendar, User, Target } from 'lucide-react';


const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

const AnnouncementList = ({ announcements, onAnnouncementClick }) => {
    if (!announcements?.length) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Megaphone className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-600">No Announcements Found</p>
                <p className="text-sm">Check back later for updates.</p>
            </div>
        );
    }

    return (
        <div className="py-4 md:p-4 flex flex-col gap-4">
            {announcements.map((announcement) => (
                <div 
                    key={announcement._id} 
                    onClick={() => onAnnouncementClick && onAnnouncementClick(announcement)}
                    className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col h-full transition-all ${
                        onAnnouncementClick ? 'cursor-pointer hover:shadow-md hover:border-primary/30' : 'hover:shadow-md'
                    }`}
                >
                    <div className="flex justify-between items-start mb-3 gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="bg-blue-50 p-2 rounded-lg flex-shrink-0 mt-0.5">
                                <Megaphone className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-900 truncate" title={announcement.title}>
                                    {announcement.title}
                                </h3>
                                <div className="flex flex-col text-xs text-gray-500 mt-0.5">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{formatDate(announcement.createdAt)}</span>
                                    </div>
                                    {announcement.status === 'scheduled' && announcement.scheduledAt && (
                                        <div className="text-orange-600 mt-0.5 truncate">
                                            Scheduled: {formatDate(announcement.scheduledAt)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {announcement.status && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                                announcement.status === 'active' ? 'bg-green-100 text-green-700' :
                                announcement.status === 'scheduled' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                                {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex-1 text-sm text-gray-600 mb-4 line-clamp-3 break-all">
                        {announcement.message}
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span className="capitalize">{announcement.createdBy?.name || 'Admin'} ({announcement.creatorRole?.replace('_', ' ')})</span>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                            <Target className="w-3 h-3" />
                            <span className="capitalize">{announcement.targetType}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AnnouncementList;
