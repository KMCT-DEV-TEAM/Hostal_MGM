import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function LeaveReturnBadge({ returnTracking }) {
    if (!returnTracking) {
        return <span className="text-gray-400 font-semibold">-----</span>;
    }

    if (returnTracking.returnedAt) {
        const isLate = returnTracking.returnStatus === 'late';
        return (
            <span className={`px-3.5 py-1.5 ${isLate ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'} rounded-lg text-xs
             inline-flex items-center gap-1.5`}>
                {isLate ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {isLate ? 'Returned (Late)' : 'Returned (On Time)'}
            </span>
        );
    }

    if (returnTracking.leftHostelAt) {
        return (
            <span className="px-3.5 py-1.5 bg-danger/10 text-danger border border-danger/30 rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Left (Pending Return)
            </span>
        );
    }

    return <span className="text-gray-400 font-semibold">-----</span>;
}
