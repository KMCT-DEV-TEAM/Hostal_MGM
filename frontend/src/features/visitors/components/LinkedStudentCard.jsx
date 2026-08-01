import React from 'react';
import { User, Calendar, Check, X, DoorOpen, Copy } from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { ROLES } from '@/constants/roles';
import { formatDateReadable } from '@/utils/formatters';

export default function LinkedStudentCard({
    student,
    visitor,
    userRole,
    onApprove,
    onReject
}) {
    // Fallback date to visitor's creation date if student doesn't have a specific date
    const dateToUse = student.date || visitor?.createdAt;

    // Format date like "Aug 2, 2026"
    const formattedDate = formatDateReadable(dateToUse);

    const relationship = student.relationship || visitor?.relationship || 'N/A';

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                        <h4 className="font-semibold text-text-primary text-sm">{student.name}</h4>
                        <div className="flex items-center gap-1.5 text-text-secondary ">
                            <User size={10} />
                            <span className="text-xs">{relationship}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {student.requestStatus && (
                        <StatusBadge status={student.requestStatus} />
                    )}
                    <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-100">
                        {/* <Copy size={14} /> */}
                        {student.roomNumber || 'N/A'}
                    </div>
                </div>
            </div>

            {/* Purpose */}
            <div className="bg-background rounded-xl p-4 mt-5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    <Calendar size={12} />
                    <span>Purpose</span>
                </div>
                <p className="text-sm text-gray-700">
                    {student.purpose || 'No purpose specified'}
                </p>
            </div>

            {/* Footer */}
            <div className="flex items-end justify-between border-t border-gray-100 mt-5 pt-4">
                <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                        <Calendar size={14} />
                        <span>Date</span>
                    </div>
                    <p className="text-xs font-semibold text-text-primary">{formattedDate}</p>
                </div>

                {/* Actions */}
                {[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MENTOR].includes(userRole) && student.requestStatus?.toLowerCase() === 'pending' && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="xs"
                            fullWidth={false}
                            className="!border-success !text-success hover:!bg-success hover:!text-white px-3 py-1.5 h-auto text-xs flex items-center gap-1.5 rounded-md"
                            onClick={() => onApprove(student._id || student.id)}
                        >
                            <Check size={14} />
                            Approve
                        </Button>
                        <Button
                            variant="outline"
                            size="xs"
                            fullWidth={false}
                            className="!border-danger !text-danger hover:!bg-danger hover:!text-white px-3 py-1.5 h-auto text-xs flex items-center gap-1.5 rounded-md"
                            onClick={() => onReject(student._id || student.id)}
                        >
                            <X size={14} />
                            Reject
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
