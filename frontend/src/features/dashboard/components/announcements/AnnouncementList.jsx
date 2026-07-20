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
        <div className="p-3 md:p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {announcements.map((announcement) => (
                <AnnouncementCard key={announcement._id} announcement={announcement} />
            ))}
        </div>
    );
};

export default AnnouncementList;
