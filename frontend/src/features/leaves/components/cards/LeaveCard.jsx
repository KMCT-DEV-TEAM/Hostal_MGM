import React from 'react';
import { Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDateReadable } from '@/utils/formatters';
import LeaveStatusBadge from '../badges/LeaveStatusBadge';
import { useAuthStore } from '@/store/useAuthStore';
import Button from '@/components/ui/Button';

const LeaveCard = ({ data, onEdit }) => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isParent = user?.role === 'parent';

    // Determine if it's Home Pass or Out Pass
    const isHomePass = data.passType === 'home_pass' || data.fromDate;

    // Formatting fields
    const passTypeLabel = isHomePass ? 'HOME PASS' : 'OUT PASS';
    const title = isHomePass
        ? 'Home Leave Application'
        : (data.outPassCategory === 'in_house' ? 'In House Permission' : 'Out House Permission');

    const durationText = isHomePass
        ? (() => {
            const days = data.totalDays || (data.fromDate && data.toDate ? Math.ceil((new Date(data.toDate) - new Date(data.fromDate)) / (1000 * 60 * 60 * 24)) : null);
            return days ? `${days} Day${days > 1 ? 's' : ''}` : '';
        })()
        : ((data.expectedReturnTime || data.expectedReturnAt) && (data.outTime || data.fromDate) ? `${formatTime(data.outTime || data.fromDate)} - ${formatTime(data.expectedReturnTime || data.expectedReturnAt)}` : '');

    const dateRange = isHomePass
        ? `${formatDateReadable(data.fromDate)} - ${formatDateReadable(data.toDate)}`
        : formatDateReadable(data.fromDate || data.date);

    // Editable logic
    const isEditable = ['pending_parent', 'pending_warden'].includes(data.status);

    // Progress Bar Logic (Approvals)
    // 0: Applied, 1: Parent Approved, 2: Warden Approved
    let progressStep = 0;
    if (data.status === 'pending_warden') progressStep = 1;
    if (data.status === 'approved' || data.status === 'completed') progressStep = 2;
    if (data.status === 'rejected' || data.status === 'cancelled') progressStep = -1; // Hide or show red

    return (
        <div
            onClick={() => navigate(`/dashboard/leaves/details/${data.id ?? data._id}`)}
            className="bg-white rounded-2xl p-5 border border-gray-50 shadow-sm flex flex-col gap-4 active:scale-[0.98] transition-transform cursor-pointer"
        >
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

            {/* Progress Bar or Action Button */}
            {isParent && data.status === 'pending_parent' ? (
                <div className="mt-3 w-full">
                    <Button
                        size='sm'
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/leaves/details/${data.id ?? data._id}`);
                        }}
                        className="rounded-xl"
                    >
                        Review & Approve
                    </Button>
                </div>
            ) : (
                !isParent && progressStep >= 0 && (
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
                )
            )}
        </div>
    );
};

export default LeaveCard;
