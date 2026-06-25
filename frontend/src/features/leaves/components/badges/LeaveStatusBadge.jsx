import React from 'react';

export default function LeaveStatusBadge({ status }) {
    if (!status) return <span className="text-gray-400 font-semibold">-----</span>;

    let displayStatus = status;
    let bgClass = 'bg-gray-100';
    let textClass = 'text-gray-600';

    switch (status) {
        case 'pending_parent':
            displayStatus = 'Pending Parent';
            bgClass = 'bg-warning/10';
            textClass = 'text-warning';
            break;
        case 'pending_warden':
            displayStatus = 'Pending Warden';
            bgClass = 'bg-blue-100';
            textClass = 'text-blue-700';
            break;
        case 'approved':
        case 'Approved':
            displayStatus = 'Approved';
            bgClass = 'bg-success/10';
            textClass = 'text-success';
            break;
        case 'rejected':
        case 'Rejected':
            displayStatus = 'Rejected';
            bgClass = 'bg-danger/10';
            textClass = 'text-danger';
            break;
        case 'cancelled':
            displayStatus = 'Cancelled';
            bgClass = 'bg-gray-200';
            textClass = 'text-gray-600';
            break;
        case 'returned':
            displayStatus = 'Returned';
            bgClass = 'bg-emerald-100';
            textClass = 'text-emerald-700';
            break;
        case 'completed':
            displayStatus = 'Completed';
            bgClass = 'bg-purple-100';
            textClass = 'text-purple-700';
            break;
        default:
            displayStatus = typeof status === 'string' ? status.charAt(0).toUpperCase() + status.slice(1) : status;
            if (typeof status === 'string' && status.toLowerCase().includes('pending')) {
                bgClass = 'bg-warning/10';
                textClass = 'text-warning';
            }
            break;
    }

    return (
        <span className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${bgClass} ${textClass}`}>
            {displayStatus}
        </span>
    );
}
