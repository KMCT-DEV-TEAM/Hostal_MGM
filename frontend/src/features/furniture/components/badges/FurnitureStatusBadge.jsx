import React from 'react';
import StatusBadge from '@/components/ui/StatusBadge';

export default function FurnitureStatusBadge({ status, className = '' }) {
    return (
        <StatusBadge status={status} className={className} />
    );
}
