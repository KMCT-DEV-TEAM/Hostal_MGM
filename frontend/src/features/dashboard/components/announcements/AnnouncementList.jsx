import React from 'react';
import {
    Megaphone,
    Wifi,
    WifiOff,
    CalendarCheck,
    UtensilsCrossed,
    AlertTriangle,
    CheckCircle,
    Bell,
    User,
    Target,
    DoorOpen
} from 'lucide-react';

import { formatTimeAgoShort } from '@/utils/formatters';

const getIconAndStyle = (title) => {
    const t = (title || '').toLowerCase();
    if (t.includes('wifi') || t.includes('internet') || t.includes('network')) {
        return {
            Icon: t.includes('down') || t.includes('maintenance') ? WifiOff : Wifi,
            bg: 'bg-[#F4EBE6]',
            text: 'text-[#A05E3C]'
        };
    }
    if (t.includes('hostel') || t.includes('inspection') || t.includes('calendar') || t.includes('event')) {
        return {
            Icon: DoorOpen,
            bg: 'bg-[#FCF2F2]',
            text: 'text-[#E27676]'
        };
    }
    if (t.includes('menu') || t.includes('food') || t.includes('mess')) {
        return {
            Icon: UtensilsCrossed,
            bg: 'bg-[#F0F5FA]',
            text: 'text-[#628AC4]'
        };
    }
    if (t.includes('alert') || t.includes('warning') || t.includes('important') || t.includes('urgent')) {
        return {
            Icon: AlertTriangle,
            bg: 'bg-yellow-50',
            text: 'text-yellow-600'
        };
    }
    if (t.includes('success') || t.includes('resolved') || t.includes('completed')) {
        return {
            Icon: CheckCircle,
            bg: 'bg-green-50',
            text: 'text-green-600'
        };
    }
    return {
        Icon: Megaphone,
        bg: 'bg-gray-50',
        text: 'text-gray-500'
    };
};

export const AnnouncementCard = ({ announcement, className = "" }) => {
    const { Icon, bg, text } = getIconAndStyle(announcement.title);
    return (
        <div 
            className={`bg-white rounded-[20px] md:border md:border-gray-100 shadow-[0_2px_12px_rgb(0,0,0,0.03)] md:shadow-sm md:hover:shadow-md transition-all p-[18px] flex gap-[16px] h-full ${className}`}
        >
            <div className={`w-[52px] h-[52px] shrink-0 flex items-center justify-center rounded-[16px] ${bg}`}>
                <Icon className={`w-6 h-6 ${text}`} strokeWidth={1.25} />
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-[16px] text-[#2C3238] leading-tight truncate" title={announcement.title}>
                        {announcement.title}
                    </h3>
                    <span className="text-[12px] text-[#9CA3AF] font-medium whitespace-nowrap shrink-0">
                        {formatTimeAgoShort(announcement.createdAt)}
                    </span>
                </div>
                
                <p className="text-[14px] text-[#6B7280] leading-[1.6] line-clamp-3 mt-1.5 flex-1 pr-1">
                    {announcement.message}
                </p>
                
                {/* Desktop only footer for additional details */}
                <div className="hidden md:flex mt-auto pt-3 border-t border-gray-50 items-center justify-between text-[11px] text-gray-500">
                    <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span className="capitalize">{announcement.createdBy?.name || 'Admin'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md font-medium">
                        <Target className="w-3.5 h-3.5" />
                        <span className="capitalize">{announcement.targetType}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

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
