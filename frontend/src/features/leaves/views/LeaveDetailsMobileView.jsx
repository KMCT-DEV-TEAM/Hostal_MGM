import React from 'react';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { formatDateReadable, formatDateTimeReadable } from '@/utils/formatters';
import LeaveStatusBadge from '../components/badges/LeaveStatusBadge';
import TimelineStep from '@/components/ui/TimelineStep';
import { CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function LeaveDetailsMobileView({ request, onBack, userRole, onActionClick }) {
    useLayoutConfig({
        header: {
            variant: "page",
            title: "Leave Details",
            showBack: true
        },
        footer: {
            visible: false
        }
    });

    const isHomePass = request.passType === 'home_pass';

    // Calculate duration
    let duration = '-----';
    if (isHomePass && request.totalDays) {
        duration = `${request.totalDays} Days`;
    } else if (!isHomePass) {
        duration = request.outPassCategory === 'in_house' ? 'In House' : 'Out House';
    }

    // Timeline data
    const timeline = request.timeline || [];

    // Derived states for progress
    const parentStatus = request.parentApproval?.status || 'pending';
    const isParentApproved = parentStatus === 'approved';
    const isParentRejected = parentStatus === 'rejected';

    const adminStatus = request.adminApproval?.status || 'pending';
    const isAdminApproved = adminStatus === 'approved';
    const isAdminRejected = adminStatus === 'rejected';

    let returnStatus = 'pending';
    let isReturned = false;

    if (request.returnTracking?.returnedAt) {
        isReturned = true;
        returnStatus = request.returnTracking.returnStatus === 'late' ? 'late' : 'on_time';
    } else if (request.returnTracking?.leftHostelAt) {
        returnStatus = 'left';
    }

    const renderProgressStep = ({ title, subtitle, status, date }) => {
        let nodeColor = '#D1D5DB'; // gray-300
        let badgeColor = '#6B7280'; // gray-500
        let badgeBg = '#F3F4F6'; // gray-100
        let badgeLabel = 'Pending';
        let avatarBg = '#E5E7EB';
        let avatarColor = '#6B7280';

        if (status === 'approved' || status === 'returned' || status === 'on_time') {
            nodeColor = 'var(--color-success)';
            badgeColor = 'var(--color-success)';
            badgeBg = '#ECFDF5';
            badgeLabel = (status === 'returned' || status === 'on_time') ? 'Returned' : 'Approved';
            avatarBg = '#1E3A8A';
            avatarColor = '#FFFFFF';
        } else if (status === 'rejected' || status === 'cancelled' || status === 'late' || status === 'left') {
            nodeColor = '#EF4444';
            badgeColor = '#EF4444';
            badgeBg = '#FEF2F2';
            badgeLabel = status === 'cancelled' ? 'Cancelled' : (status === 'late' ? 'Returned (Late)' : (status === 'left' ? 'Left' : 'Rejected'));
            avatarBg = '#1E3A8A';
            avatarColor = '#FFFFFF';
        } else if (status === 'submitted') {
            nodeColor = '#3B82F6';
            badgeColor = '#3B82F6';
            badgeBg = '#EFF6FF';
            badgeLabel = 'Submitted';
            avatarBg = '#1E3A8A';
            avatarColor = '#FFFFFF';
        }

        let formattedDate = '-----';
        if (date) {
            const rawDate = formatDateTimeReadable(date);
            const lastCommaIndex = rawDate.lastIndexOf(',');
            if (lastCommaIndex !== -1) {
                formattedDate = rawDate.substring(0, lastCommaIndex) + ' |' + rawDate.substring(lastCommaIndex + 1);
            } else {
                formattedDate = rawDate;
            }
        }

        return (
            <div className="pb-4">
                <TimelineStep
                    title={title}
                    subtitle={subtitle}
                    status={status}
                    formattedDate={formattedDate}
                    badgeLabel={badgeLabel}
                    badgeColor={badgeColor}
                    badgeBg={badgeBg}
                    nodeColor={nodeColor}
                    avatarBg={avatarBg}
                    avatarColor={avatarColor}
                />
            </div>
        );
    };

    return (
        <div className="w-full h-full p-4 overflow-y-auto bg-background-secondary space-y-4">

            {/* Status Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {isHomePass ? 'Home Pass Status' : 'Out Pass Status'}
                        </span>
                        <LeaveStatusBadge status={request.status} />
                    </div>
                    {request.status === 'approved' && (
                        <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-success" strokeWidth={1.5} />
                        </div>
                    )}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                    {request.status === 'approved'
                        ? `Your leave request was processed and approved by the Warden on ${formatDateReadable(request.adminApproval?.actionAt || request.updatedAt)}.`
                        : request.status.includes('pending')
                            ? "Your leave request is currently being processed."
                            : request.status === 'rejected'
                                ? `Your leave request was rejected. Reason: ${request.adminApproval?.remarks || request.parentApproval?.remarks || 'Not specified'}`
                                : `Current status of your request is ${request.status}.`}
                </p>
            </div>

            {/* Duration Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex flex-col gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Duration</span>
                    <span className="text-base font-semibold text-gray-800 mt-1">{duration}</span>
                </div>
                <hr className="border-gray-50" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col border-r border-gray-50 pr-4">
                        <span className="text-[10px] text-gray-400 font-medium">From</span>
                        <span className="text-sm font-medium text-gray-800 mt-1">
                            {isHomePass ? formatDateReadable(request.fromDate) : formatDateReadable(request.date)}
                        </span>
                    </div>
                    <div className="flex flex-col pl-2">
                        <span className="text-[10px] text-gray-400 font-medium">{isHomePass ? 'To' : 'Return By'}</span>
                        <span className="text-sm font-medium text-gray-800 mt-1">
                            {isHomePass ? formatDateReadable(request.toDate) : (request.expectedReturnTime || '--')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Type & Applied Card */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</span>
                    <span className="text-sm font-semibold text-gray-800 mt-1">
                        {isHomePass ? 'Home pass' : (request.outPassCategory === 'in_house' ? 'In House' : 'Out House')}
                    </span>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Applied</span>
                    <span className="text-sm font-semibold text-gray-800 mt-1">
                        {formatDateReadable(request.createdAt)}
                    </span>
                </div>
            </div>

            {/* Reason Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reason For Leave</span>
                <p className="text-sm text-gray-500 leading-relaxed">
                    "{request.reason || 'No specific reason provided.'}"
                </p>
            </div>

            {/* Progress Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex flex-col overflow-hidden">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                    {isHomePass ? 'Home Pass' : 'Out Pass'} Progress
                </span>

                <div className="relative pl-8 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-gray-100">

                    {/* Return Status */}
                    {renderProgressStep({
                        title: isReturned ? 'Returned to Hostel' : (returnStatus === 'left' ? 'Left Hostel' : 'Return Status pending'),
                        subtitle: request.studentId?.name || 'Student',
                        status: returnStatus,
                    })}

                    {/* Admin Approval */}
                    {renderProgressStep({
                        title: isAdminApproved ? `Approved by ${request.adminApproval?.actorRole || 'admin'}` : (isAdminRejected ? `Rejected by ${request.adminApproval?.actorRole || 'admin'}` : 'Warden Approval'),
                        subtitle: request.adminApproval?.actorName ? `${request.adminApproval.actorName} - ${request.adminApproval.actorRole || 'admin'}` : 'Warden',
                        status: adminStatus,
                        date: request.adminApproval?.actionAt,
                    })}

                    {/* Parent Approval */}
                    {renderProgressStep({
                        title: isParentApproved ? 'Approved by Parent' : (isParentRejected ? 'Rejected by Parent' : 'Parent Approval'),
                        subtitle: request.parentApproval?.actorName ? `${request.parentApproval.actorName} - Parent` : 'Parent',
                        status: parentStatus,
                        date: request.parentApproval?.actionAt,
                    })}

                    {/* Submitted */}
                    {renderProgressStep({
                        title: 'Submitted Request',
                        subtitle: request.studentId?.name || 'Student',
                        status: 'submitted',
                        date: request.createdAt,
                    })}

                </div>
            </div>

            {userRole === 'parent' && request.status === 'pending_parent' && (
                <div className="flex gap-3 z-10 py-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="border border-primary text-primary font-semibold"
                        onClick={() => onActionClick('rejected')}
                    >
                        Reject
                    </Button>
                    <Button
                        variant="primary"
                        size='sm'
                        onClick={() => onActionClick('approved')}
                    >
                        Approve
                    </Button>
                </div>
            )}
        </div>
    );
}
