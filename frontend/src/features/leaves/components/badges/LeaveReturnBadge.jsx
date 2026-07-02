import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function LeaveReturnBadge({ returnTracking }) {
    if (!returnTracking || !returnTracking.returnStatus) {
        return (
            <span className="text-gray-400 font-semibold w-[160px] inline-block text-center">
                -----
            </span>
        );
    }

    switch (returnTracking.returnStatus) {
        case 'pending':
            return (
                <span className="px-3 py-1.5 bg-warning/10 text-warning border border-warning/30 rounded-md text-xs inline-flex items-center justify-center gap-1.5 w-[160px]">
                    <Clock className="w-3.5 h-3.5" />
                    Pending Return
                </span>
            );

        case 'on_time':
            return (
                <span className="px-3 py-1.5 bg-success/10 text-success border border-success/30 rounded-md text-xs inline-flex items-center justify-center gap-1.5 w-[160px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Returned (On Time)
                </span>
            );

        case 'late':
            return (
                <span className="px-3 py-1.5 bg-danger/10 text-danger border border-danger/30 rounded-md text-xs inline-flex items-center justify-center gap-1.5 w-[160px]">
                    <XCircle className="w-3.5 h-3.5" />
                    Returned (Late)
                </span>
            );

        default:
            return (
                <span className="text-gray-400 font-semibold w-[160px] inline-block text-center">
                    -----
                </span>
            );
    }
}