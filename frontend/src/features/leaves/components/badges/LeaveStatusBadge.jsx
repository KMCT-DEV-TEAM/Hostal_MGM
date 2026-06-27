import React from 'react';
import { Check, X } from 'lucide-react';

export default function LeaveStatusBadge({ status, className = '' }) {
    if (!status) return <span className="text-gray-400 font-semibold">-----</span>;

    const normalizedStatus = status.toLowerCase();

    // Map the status string to standard displays
    let displayStatus = status;
    if (normalizedStatus.includes('pending')) displayStatus = 'Pending';
    if (normalizedStatus === 'approved') displayStatus = 'Approved';
    if (normalizedStatus === 'rejected') displayStatus = 'Rejected';
    if (normalizedStatus === 'cancelled') displayStatus = 'Cancelled';

    // For return status
    if (normalizedStatus === 'left' || normalizedStatus === 'not returned') displayStatus = 'Left Hostel';
    if (normalizedStatus === 'returned') displayStatus = 'Returned';
    if (normalizedStatus === '-----') return <span className={`text-gray-400 font-semibold ${className}`}>-----</span>;

    // Define colors
    let bgClass = '';
    let textClass = '';
    let borderClass = 'border';
    let icon = null;

    if (displayStatus === 'Approved' || displayStatus === 'Returned') {
        bgClass = 'bg-success/10';
        textClass = 'text-success';
        borderClass = 'border border-success/30';
        if (displayStatus === 'Returned') icon = <Check className="w-3.5 h-3.5 stroke-[2.5]" />;
    } else if (displayStatus === 'Rejected' || displayStatus === 'Left Hostel') {
        bgClass = 'bg-danger/10';
        textClass = 'text-danger';
        borderClass = 'border border-danger/30';
        if (displayStatus === 'Left Hostel') icon = <X className="w-3.5 h-3.5 stroke-[2.5]" />;
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
