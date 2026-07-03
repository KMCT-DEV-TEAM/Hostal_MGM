import React from 'react';

const getStatusStyle = (status) => {
    if (status === 'Available') return 'text-success bg-success/10 border border-success/20';
    if (status === 'Allocated') return 'text-primary bg-primary/10 border border-primary/20';
    if (status === 'Maintenance') return 'text-warning bg-warning/10 border border-warning/20';
    if (status === 'Lost') return 'text-danger bg-danger/10 border border-danger/20';
    return 'text-gray-700 bg-gray-100 border border-gray-200';
};

export default function FurnitureStatusBadge({ status, className = '' }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(status)} ${className}`}>
            {status}
        </span>
    );
}
