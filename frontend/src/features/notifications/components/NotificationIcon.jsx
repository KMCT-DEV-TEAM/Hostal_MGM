import React from 'react';
import { FileCheck, CalendarX, CalendarCheck, Clock } from 'lucide-react';

const NotificationIcon = ({ type }) => {
    switch (type) {
        case 'leave_approved':
            return (
                <div className="w-8 h-8 rounded-full border border-success flex items-center justify-center shrink-0">
                    <FileCheck className="w-4 h-4 text-success" strokeWidth={2} />
                </div>
            );
        case 'leave_rejected':
            return (
                <div className="w-8 h-8 rounded-full border border-danger flex items-center justify-center shrink-0">
                    <CalendarX className="w-4 h-4 text-danger" strokeWidth={2} />
                </div>
            );
        case 'attendance_marked':
            return (
                <div className="w-8 h-8 rounded-full border border-success flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-4 h-4 text-success" strokeWidth={2} />
                </div>
            );
        case 'status_updated':
            return (
                <div className="w-8 h-8 rounded-full border border-primary/50 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-primary/70" strokeWidth={2} />
                </div>
            );
        default:
            return (
                <div className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center shrink-0">
                    <FileCheck className="w-4 h-4 text-gray-400" strokeWidth={2} />
                </div>
            );
    }
};

export default NotificationIcon;
