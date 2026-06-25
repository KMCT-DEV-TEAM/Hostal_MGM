import React from 'react';

export default function LeaveStatusBadge({ status }) {
    const bgClass = status === 'Approved' ? 'bg-success/10' : status === 'Rejected' ? 'bg-danger/10' : 'bg-warning/10';
    const textClass = status === 'Approved' ? 'text-success' : status === 'Rejected' ? 'text-danger' : 'text-warning';
    
    // Fallback for missing status
    if (!status) return <span className="text-gray-400 font-semibold">-----</span>;

    // Handle lowercase statuses gracefully
    const displayStatus = typeof status === 'string' 
        ? status.charAt(0).toUpperCase() + status.slice(1) 
        : status;

    return (
        <span className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${bgClass} ${textClass}`}>
            {displayStatus}
        </span>
    );
}
