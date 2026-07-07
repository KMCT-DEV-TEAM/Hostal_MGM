import { FileCheck, CalendarX, CalendarCheck, Clock, CheckCircle2, Info, AlertTriangle, FileX } from 'lucide-react';

/**
 * Returns the icon configuration based on the notification event string
 * @param {string} event - The event string from the backend (e.g. 'PASS_ADMIN_APPROVED')
 * @returns {Object} { icon: LucideIcon, colorClass: string, borderColorClass: string }
 */
export const getNotificationIconConfig = (event) => {
    switch (event) {
        case 'PASS_ADMIN_APPROVED':
        case 'PASS_WARDEN_APPROVED':
        case 'LEAVE_APPROVED':
            return {
                icon: FileCheck,
                colorClass: 'text-success',
                borderColorClass: 'border-success'
            };
        case 'PASS_ADMIN_REJECTED':
        case 'PASS_WARDEN_REJECTED':
        case 'LEAVE_REJECTED':
            return {
                icon: FileX,
                colorClass: 'text-danger',
                borderColorClass: 'border-danger'
            };
        case 'ATTENDANCE_MARKED':
            return {
                icon: CalendarCheck,
                colorClass: 'text-success',
                borderColorClass: 'border-success'
            };
        case 'ATTENDANCE_ABSENT':
            return {
                icon: CalendarX,
                colorClass: 'text-danger',
                borderColorClass: 'border-danger'
            };
        case 'STATUS_UPDATED':
            return {
                icon: Clock,
                colorClass: 'text-primary/70',
                borderColorClass: 'border-primary/50'
            };
        case 'SYSTEM_ALERT':
            return {
                icon: AlertTriangle,
                colorClass: 'text-warning',
                borderColorClass: 'border-warning'
            };
        default:
            return {
                icon: Info,
                colorClass: 'text-gray-400',
                borderColorClass: 'border-gray-400'
            };
    }
};
