import React from 'react';
import { Pencil } from 'lucide-react';
import { formatDateReadable } from '@/utils/formatters';
import LeaveStatusBadge from '../badges/LeaveStatusBadge';

const LeaveCard = ({ data, onEdit }) => {
    // Determine if it's Home Pass or Out Pass
    const isHomePass = data.passType === 'home_pass' || data.fromDate;

    // Formatting fields
    const passTypeLabel = isHomePass ? 'HOME PASS' : 'OUT PASS';
    const title = isHomePass
        ? 'Home Leave Application'
        : (data.outPassCategory === 'in_house' ? 'In House Permission' : 'Out House Permission');

    const durationText = isHomePass
        ? (data.totalDays ? `${data.totalDays} Day${data.totalDays > 1 ? 's' : ''}` : '')
        : (data.expectedReturnTime && data.outTime ? `${data.outTime} - ${data.expectedReturnTime}` : '');

    const dateRange = isHomePass
        ? `${formatDateReadable(data.fromDate)} - ${formatDateReadable(data.toDate)}`
        : formatDateReadable(data.date);

    // Editable logic
    const isEditable = ['pending_parent', 'pending_warden'].includes(data.status);

    // Progress Bar Logic (Approvals)
    // 0: Applied, 1: Parent Approved, 2: Warden Approved
    let progressStep = 0;
    if (data.status === 'pending_warden') progressStep = 1;
    if (data.status === 'approved' || data.status === 'completed') progressStep = 2;
    if (data.status === 'rejected' || data.status === 'cancelled') progressStep = -1; // Hide or show red

    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-50 shadow-sm flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    {passTypeLabel}
                </span>
                <span className="text-[11px] font-medium text-text-secondary">
                    {durationText}
                </span>
            </div>

            {/* Title & Edit */}
            <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold text-text-primary leading-tight">
                    {title}
                </h3>
                {isEditable && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit && onEdit(data); }}
                        className="text-accent hover:text-primary transition-colors p-1 -mt-1 active:scale-95"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Description */}
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                {data.reason || "No specific reason provided for this request."}
            </p>

            {/* Divider */}
            <hr className="border-gray-50 my-1" />

            {/* Duration & Status */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Duration</span>
                    <span className="text-sm font-medium text-text-primary mt-0.5">{dateRange}</span>
                </div>
                <LeaveStatusBadge status={data.status} />
            </div>

            {/* Progress Bar */}
            {progressStep >= 0 && (
                <div className="mt-2 flex flex-col gap-2">
                    <div className="flex gap-1 h-1 w-full">
                        <div className="flex-1 rounded-full bg-success"></div>
                        <div className={`flex-1 rounded-full ${progressStep >= 1 ? 'bg-success' : 'bg-gray-100'}`}></div>
                        <div className={`flex-1 rounded-full ${progressStep >= 2 ? 'bg-success' : 'bg-gray-100'}`}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-text-secondary font-medium px-2">
                        <span>Applied</span>
                        <span>Parent</span>
                        <span>Warden</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveCard;
