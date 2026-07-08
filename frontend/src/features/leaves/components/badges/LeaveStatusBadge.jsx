import React from 'react';
import StatusBadge from '@/components/ui/StatusBadge';

export default function LeaveStatusBadge({ status, className = '' }) {
    if (!status || status === '-----') {
        return <StatusBadge status="-----" className={className} />;
    }

    const normalizedStatus = status.toLowerCase();
    let mappedStatus = status;
    let displayStatus = status;

    // Formatting for display
    if (normalizedStatus === 'pending_admin') { mappedStatus = 'pending'; displayStatus = 'Pending Admin'; }
    else if (normalizedStatus === 'pending_parent') { mappedStatus = 'pending'; displayStatus = 'Pending Parent'; }
    else if (normalizedStatus === 'pending_warden') { mappedStatus = 'pending'; displayStatus = 'Pending Warden'; }
    else if (normalizedStatus.includes('pending')) { mappedStatus = 'pending'; displayStatus = 'Pending'; }
    else if (['left', 'not returned', 'left (pending return)'].includes(normalizedStatus)) {
        mappedStatus = 'left (pending return)';
        displayStatus = 'Left (Pending Return)';
    }

    return (
        <StatusBadge 
            status={mappedStatus} 
            displayOverride={displayStatus} 
            className={`w-[160px] ${className}`} 
        />
    );
}
