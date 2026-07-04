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
    if (normalizedStatus === 'present') displayStatus = 'Present';
    if (normalizedStatus === 'absent') displayStatus = 'Absent';
    if (normalizedStatus === '-----') return <span className={`text-gray-400 font-semibold ${className}`}>-----</span>;

    // Define colors
    let bgClass = '';
    let textClass = '';
    let borderClass = 'border';
    let icon = null;

    if (displayStatus === 'Approved' || displayStatus === 'Returned' || displayStatus === 'Returned (On Time)' || displayStatus === 'Present') {
        bgClass = 'bg-success/10';
        textClass = 'text-success';
        borderClass = 'border border-success/30';
    } else if (displayStatus === 'Rejected' || displayStatus === 'Left Hostel' || displayStatus === 'Left (Pending Return)' || displayStatus === 'Returned (Late)' || displayStatus === 'Absent') {
        bgClass = 'bg-danger/10';
        textClass = 'text-danger';
        borderClass = 'border border-danger/30';
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
        <span className={`px-3 py-1.5 rounded-md text-xs border inline-flex items-center justify-center gap-1.5 w-[160px] ${bgClass} ${textClass} ${borderClass} ${className}`}>
            {icon} {displayStatus}
        </span>
    );
}
