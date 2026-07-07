import React from 'react';

const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === 'available') return 'text-success bg-success/10 border border-success/20';
    if (s === 'allocated') return 'text-primary bg-primary/10 border border-primary/20';
    if (s === 'maintenance') return 'text-warning bg-warning/10 border border-warning/20';
    if (s === 'lost') return 'text-danger bg-danger/10 border border-danger/20';
    if (s === 'scrap') return 'text-gray-500 bg-gray-100 border border-gray-300';
    return 'text-gray-700 bg-gray-100 border border-gray-200';
};

export default function FurnitureStatusBadge({ status, className = '' }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusStyle(status)} ${className}`}>
            {status}
        </span>
    );
}
