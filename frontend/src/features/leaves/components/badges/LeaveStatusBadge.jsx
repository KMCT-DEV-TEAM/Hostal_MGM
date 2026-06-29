import React from 'react';
import { Check, X } from 'lucide-react';

export default function LeaveStatusBadge({ status, className = '' }) {
    if (!status) return <span className="text-gray-400 font-semibold">-----</span>;

    const normalizedStatus = status.toLowerCase();

    // Map the status string to standard displays
    let displayStatus = status;
    if (normalizedStatus === 'pending_admin') displayStatus = 'Pending Admin';
    else if (normalizedStatus === 'pending_parent') displayStatus = 'Pending Parent';
    else if (normalizedStatus === 'pending_warden') displayStatus = 'Pending Warden';
    else if (normalizedStatus.includes('pending')) displayStatus = 'Pending';

    if (normalizedStatus === 'approved') displayStatus = 'Approved';
    if (normalizedStatus === 'rejected') displayStatus = 'Rejected';
    if (normalizedStatus === 'cancelled') displayStatus = 'Cancelled';

    // For return status
    if (normalizedStatus === 'left' || normalizedStatus === 'not returned' || normalizedStatus === 'left (pending return)') displayStatus = 'Left (Pending Return)';
    if (normalizedStatus === 'returned') displayStatus = 'Returned';
    if (normalizedStatus === 'returned (on time)') displayStatus = 'Returned (On Time)';
    if (normalizedStatus === 'returned (late)') displayStatus = 'Returned (Late)';
    if (normalizedStatus === '-----') return <span className={`text-gray-400 font-semibold ${className}`}>-----</span>;

    // Define colors
    let bgClass = '';
    let textClass = '';
    let borderClass = 'border';
    let icon = null;

    if (displayStatus === 'Approved' || displayStatus === 'Returned' || displayStatus === 'Returned (On Time)') {
        bgClass = 'bg-success/10';
        textClass = 'text-success';
        borderClass = 'border border-success/30';
        if (displayStatus.startsWith('Returned')) icon = <Check className="w-3.5 h-3.5 stroke-[2.5]" />;
    } else if (displayStatus === 'Rejected' || displayStatus === 'Left Hostel' || displayStatus === 'Left (Pending Return)' || displayStatus === 'Returned (Late)') {
        bgClass = 'bg-danger/10';
        textClass = 'text-danger';
        borderClass = 'border border-danger/30';
        if (displayStatus.includes('Left') || displayStatus.includes('Late')) icon = <X className="w-3.5 h-3.5 stroke-[2.5]" />;
    } else if (displayStatus === 'Cancelled') {
        bgClass = 'bg-gray-100';
        textClass = 'text-gray-600';
        borderClass = 'border border-gray-200';
    } else {
        // Pending or default
        bgClass = 'bg-warning/10';
        textClass = 'text-warning';
        borderClass = 'border border-warning/30';
    }

    return (
        <span className={`px-3.5 py-1.5 rounded-md text-xs font-bold ${borderClass} inline-flex items-center gap-1.5 ${bgClass} ${textClass} ${className}`}>
            {icon} {displayStatus}
        </span>
    );
}
