import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function LeaveReturnBadge({ returnStatus }) {
    if (!returnStatus || returnStatus === 'pending') {
        return <span className="text-gray-400 font-semibold">-----</span>;
    }
    
    if (returnStatus === 'Returned' || returnStatus === 'returned' || returnStatus === 'on_time') {
        return (
            <span className="px-3.5 py-1.5 bg-success/10 text-success rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {returnStatus === 'on_time' ? 'On Time' : 'Returned'}
            </span>
        );
    }
    if (returnStatus === 'Not Returned' || returnStatus === 'not_returned' || returnStatus === 'late') {
        return (
            <span className="px-3.5 py-1.5 bg-danger/10 text-danger rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> {returnStatus === 'late' ? 'Late' : 'Not Returned'}
            </span>
        );
    }
    return <span className="text-gray-400 font-semibold capitalize">{returnStatus.replace('_', ' ')}</span>;
}
