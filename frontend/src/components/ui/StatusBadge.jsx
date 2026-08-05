import React from 'react';

const getStatusConfig = (status) => {
    if (!status) return { display: '-----', variant: 'neutral' };

    const normalized = status.toLowerCase();

    // Default mapping logic
    let variant = 'neutral';

    // Success mappings
    if (['approved', 'present', 'returned', 'returned (on time)', 'available', 'active'].includes(normalized)) {
        variant = 'success';
    }
    if (['completed'].includes(normalized)) {
        variant = 'secondary'
    }

    // Fatal mappings
    else if (['blacklisted'].includes(normalized)) {
        variant = 'danger';
    }
    // Danger mappings
    else if (['rejected', 'absent', 'left', 'Inactive', 'left (pending return)', 'returned (late)', 'lost', 'Inactive'].includes(normalized)) {
        variant = 'danger';
    }
    // Warning mappings
    else if (normalized.includes('pending') || ['maintenance', 'on_leave', 'on leave', 'in Progress'].includes(normalized)) {
        variant = 'warning';
    }
    // Primary mappings
    else if (['allocated', 'checked in', 'open', 'transferred',].includes(normalized)) {
        variant = 'primary';
    }
    // Neutral mappings
    else if (['cancelled', 'scrap', 'inactive', '-----'].includes(normalized)) {
        variant = 'neutral';
    }

    return { display: status, variant };
};

const variantStyles = {
    success: 'bg-success/10 text-success border-success/30',
    danger: 'bg-danger/10 text-danger border-danger/30',
    warning: 'bg-warning/10 text-warning border-warning/30',
    primary: 'bg-primary/10 text-primary border-primary/30',
    secondary: 'bg-secondary/10 text-secondary border-secondary/40',
    neutral: 'bg-gray-100 text-gray-600 border-gray-200',
    fatal: 'bg-slate-800 text-slate-50 border-slate-900 shadow-sm',
};

const StatusBadge = ({ status, className = '', displayOverride = null }) => {
    const config = getStatusConfig(status);
    const displayStatus = displayOverride || (status && status !== '-----' ? status : '-----');
    const styleClass = variantStyles[config.variant] || variantStyles.neutral;

    return (
        <span
            className={`px-2.5 py-1 rounded-md text-xs  inline-flex items-center justify-center gap-1.5 capitalize w-fit min-w-20 ${styleClass} ${className}`}
        >
            {displayStatus}
        </span>
    );
};

export default StatusBadge;
