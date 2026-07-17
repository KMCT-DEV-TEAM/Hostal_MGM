import React from 'react';
import { Megaphone, Calendar, User, Target } from 'lucide-react';


const AnnouncementList = ({ announcements }) => {
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
        <div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {announcements.map((announcement) => (
                <div 
                    key={announcement._id} 
                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col h-full"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-50 p-2 rounded-lg">
                                <Megaphone className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 line-clamp-1" title={announcement.title}>
                                    {announcement.title}
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(announcement.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 text-sm text-gray-600 mb-4 line-clamp-3">
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
