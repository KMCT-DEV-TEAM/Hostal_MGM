import React, { useState } from 'react';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { formatDateReadable, formatDateTimeReadable } from '@/utils/formatters';
import { CheckCircle2, Clock } from 'lucide-react';

export default function ComplaintDetailsMobileView({ complaint, onBack }) {
    const [showAllActivities, setShowAllActivities] = useState(false);

    useLayoutConfig({
        header: {
            variant: "page",
            title: "Complaint Details",
            showBack: true,
            onBack: onBack
        },
        footer: {
            visible: false
        }
    });

    if (!complaint) return null;

    const renderProgressStep = (update, index, isLast) => {
        const { status, message, date, by } = update;

        let nodeColor = 'bg-gray-400';
        let ringColor = 'ring-gray-400/20';

        if (status === 'Resolved' || status === 'Completed') {
            nodeColor = 'bg-[#10B981]'; // emerald-500
            ringColor = 'ring-[#10B981]/25';
        } else if (status === 'Rejected' || status === 'Incomplete') {
            nodeColor = 'bg-danger';
            ringColor = 'ring-danger/25';
        } else if (status === 'In progress') {
            nodeColor = 'bg-[#3B82F6]'; // blue-500
            ringColor = 'ring-[#3B82F6]/25';
        } else if (status === 'Pending') {
            nodeColor = 'bg-[#8B5CF6]'; // purple-500
            ringColor = 'ring-[#8B5CF6]/25';
        }

        let formattedDate = '-----';
        if (date) {
            const dateObj = new Date(date);
            const today = new Date();
            const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear();

            const timeString = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            if (isToday) {
                formattedDate = `Today | ${timeString}`;
            } else {
                const dateString = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                formattedDate = `${dateString} | ${timeString}`;
            }
        }

        return (
            <div className={`relative flex items-start justify-between group ${isLast ? '' : 'pb-10'}`} key={index}>
                <div className="flex items-start gap-4 w-full">
                    {/* Node on the timeline */}
                    <div
                        className={`absolute left-[-16.5px] top-1.5 w-[9px] h-[9px] rounded-full ring-[4px] z-10 ${nodeColor} ${ringColor}`}
                    ></div>

                    <div className="flex-1 space-y-0.5">
                        {/* Title */}
                        <h4 className="text-[13px] font-medium text-gray-500 leading-snug">{message}</h4>

                        {/* Date */}
                        <div className="text-[11px] text-gray-400 font-medium whitespace-nowrap mt-1">
                            {formattedDate}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const isResolved = complaint.status === 'Resolved';
    const isPending = complaint.status === 'Pending';
    const isInProgress = complaint.status === 'In progress';
    const isRejected = complaint.status === 'Rejected' || complaint.status === 'Incomplete';

    let statusBg = 'bg-gray-100';
    let statusText = 'text-gray-600';
    let statusDot = 'bg-gray-500';

    if (isResolved) {
        statusBg = 'bg-success/10';
        statusText = 'text-success';
        statusDot = 'bg-success';
    } else if (isRejected) {
        statusBg = 'bg-danger/10';
        statusText = 'text-danger';
        statusDot = 'bg-danger';
    } else if (isInProgress) {
        statusBg = 'bg-primary/10';
        statusText = 'text-primary';
        statusDot = 'bg-primary';
    } else if (isPending) {
        statusBg = 'bg-warning/10';
        statusText = 'text-warning';
        statusDot = 'bg-warning';
    }

    return (
        <div className="w-full p-4 space-y-4">

            {/* Status Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Complaint Status
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`}></span>
                            <span className={`text-[12px] font-semibold ${statusText}`}>{complaint.status || 'Pending'}</span>
                        </div>
                    </div>
                    {isResolved && (
                        <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-success" strokeWidth={1.5} />
                        </div>
                    )}
                    {(isInProgress || isPending) && (
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${statusBg}`}>
                            <Clock className={`w-6 h-6 ${statusText}`} strokeWidth={1.5} />
                        </div>
                    )}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mt-2">
                    {isResolved
                        ? `Your complaint request was processed and resolved on ${formatDateReadable(complaint.updatedAt)}.`
                        : isInProgress
                            ? "Your complaint is currently being worked on by our maintenance team."
                            : isRejected
                                ? `Your complaint was marked as incomplete or rejected. Remarks: ${complaint.adminRemarks || 'Not specified'}`
                                : `Your complaint has been received and is waiting to be assigned.`}
                </p>
            </div>

            {/* Category & Date Card */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</span>
                    <span className="text-sm font-semibold text-gray-800 mt-1 truncate">
                        {complaint.category?.name || complaint.category || 'N/A'}
                    </span>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</span>
                    <span className="text-sm font-semibold text-gray-800 mt-1">
                        {formatDateReadable(complaint.createdAt || complaint.date)}
                    </span>
                </div>
            </div>

            {/* Issue Description Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Issue Description</span>
                <p className="text-sm text-gray-500 leading-relaxed">
                    {complaint.description || 'No specific description provided.'}
                </p>
            </div>



            {/* Progress Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex flex-col overflow-hidden">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                    Complaint Progress
                </span>

                <div className="relative pl-6 space-y-0 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-gray-100">
                    {complaint.timeline && complaint.timeline.length > 0 ? (
                        <>
                            {(showAllActivities ? [...complaint.timeline].reverse() : [...complaint.timeline].reverse().slice(0, 4)).map((update, idx, arr) =>
                                renderProgressStep(update, idx, idx === arr.length - 1)
                            )}
                            {complaint.timeline.length > 4 && (
                                <button
                                    onClick={() => setShowAllActivities(!showAllActivities)}
                                    className="text-primary text-[13px] font-medium cursor-pointer w-full text-center mt-6 block"
                                >
                                    {showAllActivities ? 'View less' : 'Read more'}
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="text-[13px] text-gray-400 italic">No progress logs available.</div>
                    )}
                </div>
            </div>

            {/* Safe padding */}
            <div className="h-4"></div>
        </div>
    );
}
