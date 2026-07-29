import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { formatDateReadable, formatDateTimeReadable } from '@/utils/formatters';
import leaveService from '@/services/leave.service';
import { useAuthStore } from '@/store/useAuthStore';
import TimelineStep from '@/components/ui/TimelineStep';
import DetailCard from '@/components/ui/DetailCard';
import DetailRow from '@/components/ui/DetailRow';
import ActivityLog from '@/components/ui/ActivityLog';
import DetailsSkeletonLoader from '@/components/ui/DetailsSkeletonLoader';
import { useActiveStudent } from '@/hooks/useActiveStudent';

const getTimelineConfig = (action) => {
    switch (action) {
        // Success / Positive
        case 'parent_approved':
        case 'admin_approved':
            return { label: 'Approved', color: 'text-green-600', bg: 'bg-green-50', nodeColor: 'bg-green-500' };
        case 'warden_marked_out':
            return { label: 'Left Hostel', color: 'text-blue-600', bg: 'bg-blue-50', nodeColor: 'bg-blue-500' };
        case 'warden_marked_returned':
        case 'returned':
            return { label: 'Returned', color: 'text-green-600', bg: 'bg-green-50', nodeColor: 'bg-green-500' };
        case 'completed':
            return { label: 'Completed', color: 'text-green-600', bg: 'bg-green-50', nodeColor: 'bg-green-500' };

        // Danger / Negative
        case 'parent_rejected':
        case 'admin_rejected':
            return { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-50', nodeColor: 'bg-red-500' };
        case 'admin_cancelled':
        case 'student_cancelled_request':
        case 'parent_cancelled_request':
        case 'cancelled':
            return { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-50', nodeColor: 'bg-red-500' };

        // Neutral / Info
        case 'created':
            return { label: 'Created', color: 'text-blue-600', bg: 'bg-blue-50', nodeColor: 'bg-blue-500' };
        case 'updated':
        case 'student_edited_leave':
        case 'parent_edited_leave':
            return { label: 'Updated', color: 'text-orange-600', bg: 'bg-orange-50', nodeColor: 'bg-orange-500' };
        case 'approval_reset':
            return { label: 'Reset', color: 'text-gray-600', bg: 'bg-gray-100', nodeColor: 'bg-gray-500' };

        default:
            return { label: 'Activity', color: 'text-gray-600', bg: 'bg-gray-100', nodeColor: 'bg-gray-400' };
    }
};

const getStatusColor = (status) => {
    switch (status) {
        case 'approved':
        case 'completed':
            return 'var(--color-success)';
        case 'pending_parent':
        case 'pending_warden':
            return 'var(--color-warning)';
        case 'rejected':
        case 'cancelled':
            return 'var(--color-danger)';
        default:
            return 'var(--color-primary)';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'pending_parent': return 'Pending Parent';
        case 'pending_warden': return 'Pending Warden';
        case 'approved': return 'Approved';
        case 'rejected': return 'Rejected';
        case 'cancelled': return 'Cancelled';
        case 'completed': return 'Completed';
        case 'returned': return 'Returned';
        default: return 'Pending';
    }
};

export default function LeaveDetailsModal({ isOpen, onClose, leaveId, userRole }) {
    const [request, setRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const storeRole = useAuthStore(s => s.user?.role);
    const role = userRole || storeRole;
    const { activeStudentId } = useActiveStudent();

    useEffect(() => {
        const fetchLeaveDetails = async () => {
            if (!isOpen || !leaveId) {
                setRequest(null);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const res = await leaveService.getLeaveDetails(role, leaveId, activeStudentId);
                setRequest(res.data || res);
            } catch (err) {
                console.error("Failed to fetch leave details:", err);
                setError("Failed to load details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaveDetails();
    }, [isOpen, leaveId, role, activeStudentId]);

    if (!isOpen) return null;

    if (isLoading) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Loading Details..." maxWidth="max-w-5xl">
                <DetailsSkeletonLoader />
            </Modal>
        );
    }

    if (error) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Error" maxWidth="max-w-md">
                <div className="p-4 text-center text-red-500 font-medium">{error}</div>
            </Modal>
        );
    }

    if (!request) return null;

    const isHomePass = request.passType === 'home_pass';
    const title = isHomePass ? 'Home Pass Details' : 'Out Pass Details';

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

    const renderBadge = (label, color) => (
        <span className="inline-flex items-center gap-2 font-medium" style={{ color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
            {label}
        </span>
    );

    const getProgressConfig = (status) => {
        if (status === 'approved' || status === 'returned' || status === 'on_time') {
            return {
                label: (status === 'returned' || status === 'on_time') ? 'Returned' : 'Approved',
                color: 'var(--color-success)',
                bg: '#ECFDF5',
                nodeColor: 'var(--color-success)',
                avatarBg: '#1E3A8A',
                avatarColor: '#FFFFFF'
            };
        } else if (status === 'rejected' || status === 'cancelled' || status === 'late' || status === 'left') {
            return {
                label: status === 'cancelled' ? 'Cancelled' : (status === 'late' ? 'Returned (Late)' : (status === 'left' ? 'Left' : 'Rejected')),
                color: '#EF4444',
                bg: '#FEF2F2',
                nodeColor: '#EF4444',
                avatarBg: '#1E3A8A',
                avatarColor: '#FFFFFF'
            };
        } else if (status === 'submitted') {
            return {
                label: 'Submitted',
                color: '#3B82F6',
                bg: '#EFF6FF',
                nodeColor: '#3B82F6',
                avatarBg: '#1E3A8A',
                avatarColor: '#FFFFFF'
            };
        }
        return {
            label: 'Pending',
            color: '#6B7280',
            bg: '#F3F4F6',
            nodeColor: '#D1D5DB',
            avatarBg: '#E5E7EB',
            avatarColor: '#6B7280'
        };
    };

    const formatProgressDate = (date) => {
        if (!date) return '-----';
        const rawDate = formatDateTimeReadable(date);
        const lastCommaIndex = rawDate.lastIndexOf(',');
        if (lastCommaIndex !== -1) {
            return rawDate.substring(0, lastCommaIndex) + ' |' + rawDate.substring(lastCommaIndex + 1);
        }
        return rawDate;
    };

    const handleApprove = async () => {
        if (!window.confirm("Are you sure you want to approve this request?")) return;
        try {
            await leaveService.approvePass(request._id, { remarks: 'Approved by Admin' });
            onClose(); // Ideally refetch here, but closing modal is ok
        } catch (err) {
            console.error(err);
            alert("Failed to approve");
        }
    };

    const handleReject = async () => {
        const remarks = window.prompt("Enter rejection remarks (required):");
        if (!remarks) return;
        try {
            await leaveService.rejectPass(request._id, { remarks });
            onClose(); // Ideally refetch here, but closing modal is ok
        } catch (err) {
            console.error(err);
            alert("Failed to reject");
        }
    };

    const handleCancel = async () => {
        const remarks = window.prompt("Enter cancellation remarks (required):");
        if (!remarks) return;
        try {
            if (role === 'super_admin') {
                await leaveService.cancelLeaveSuperAdmin(request._id, { remarks });
            } else if (role === 'admin') {
                await leaveService.cancelLeaveAdmin(request._id, { remarks });
            }
            onClose();
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || "Failed to cancel request");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            subtitle="Details about the leave request"
            maxWidth="max-w-5xl"
        >
            {request.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-start gap-3 mt-4">
                    <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="font-bold">Request Rejected</p>
                        <p className="opacity-90">{request.cancellationRequest?.remarks || request.timeline.find(t => t.action.includes('rejected'))?.remarks || 'No remarks provided.'}</p>
                    </div>
                </div>
            )}

            {request.status === 'cancelled' && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-start gap-3 mt-4">
                    <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="font-bold">Request Cancelled</p>
                        <p className="opacity-90">{request.cancellationRequest?.remarks || request.timeline.find(t => t.action.includes('cancelled'))?.remarks || 'Cancelled by user.'}</p>
                    </div>
                </div>
            )}

            <div className={`grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 ${request.status === 'rejected' || request.status === 'cancelled' ? 'mt-2' : 'mt-4'}`}>

                {/* LEFT COLUMN */}
                <div className="space-y-6">

                    {/* Student Information */}
                    <DetailCard title="Student Information" subtitle="Details about student">
                        <div className="space-y-1">
                            <DetailRow label="Student" value={request.studentId?.name || '--'} />
                            <DetailRow label="Student ID" value={request.studentId?.studentId || '--'} />
                            <DetailRow label="Room No" value={request.studentId?.roomNumber || '--'} />
                        </div>
                    </DetailCard>

                    {/* Leave Information */}
                    <DetailCard title="Leave Information" subtitle="Details about the leave requests">
                        <div className="space-y-1">
                            <DetailRow
                                label="Status"
                                value={renderBadge(getStatusLabel(request.status), getStatusColor(request.status))}
                            />
                            {isHomePass ? (
                                <>
                                    <DetailRow label="From Date" value={formatDateReadable(request.fromDate)} />
                                    <DetailRow label="To Date" value={formatDateReadable(request.toDate)} />
                                </>
                            ) : (
                                <>
                                    <DetailRow label="Date" value={formatDateReadable(request.date)} />
                                    <DetailRow label="Outing Time" value={`${request.outTime || '--'} to ${request.expectedReturnTime || '--'}`} />
                                </>
                            )}
                            <DetailRow label={isHomePass ? 'Duration' : 'Category'} value={duration} />
                            <DetailRow label="Applied Date" value={formatDateReadable(request.createdAt)} />
                            <DetailRow
                                label="Parent approval"
                                value={renderBadge(isParentApproved ? 'Approved' : 'Pending', isParentApproved ? 'var(--color-success)' : 'var(--color-warning)')}
                            />
                        </div>
                    </DetailCard>

                    {/* Reason */}
                    <DetailCard title="Reason" subtitle="Reason for the leave">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {request.reason || 'No reason provided.'}
                        </p>
                    </DetailCard>

                    {/* Pass Progress */}
                    <div className="border border-gray-100 rounded-2xl p-6 bg-white shadow-sm relative overflow-hidden">

                        <h3 className="text-primary font-semibold text-sm mb-1">
                            {isHomePass ? 'Home Pass' : 'Out Pass'} Progress
                        </h3>
                        <p className="text-xs text-gray-400 mb-6">Track the live approval status of this request.</p>

                        <div className="relative pl-8 space-y-10 before:absolute before:top-4 before:bottom-4 before:left-2.75 before:w-0.5 before:bg-gray-200">
                            {[
                                // Cancelled Step (only if cancelled)
                                request.status === 'cancelled' ? {
                                    status: 'cancelled',
                                    title: 'Request Cancelled',
                                    subtitle: 'The pass was cancelled.',
                                    date: request.timeline.find(t => t.action.includes('cancelled'))?.timestamp || request.updatedAt
                                } : null,

                                // Return Step
                                (['approved', 'completed', 'returned'].includes(request.status) || isReturned || returnStatus === 'left') ? {
                                    status: returnStatus,
                                    title: isReturned ? (returnStatus === 'late' ? 'Returned (Late)' : 'Returned to Hostel') : (returnStatus === 'left' ? 'Left Hostel' : 'Return Status pending'),
                                    subtitle: request.studentId?.name || 'Student',
                                    date: request.returnTracking?.returnedAt || request.returnTracking?.leftHostelAt || null
                                } : null,

                                // Admin Step
                                (isParentApproved || adminStatus !== 'pending') ? {
                                    status: adminStatus,
                                    title: isAdminApproved ? `Approved by ${request.adminApproval?.actorRole || 'admin'}` : (isAdminRejected ? `Rejected by ${request.adminApproval?.actorRole || 'admin'}` : 'Admin Approval pending'),
                                    subtitle: request.adminApproval?.actorName ? `${request.adminApproval.actorName} - ${request.adminApproval.actorRole || 'admin'}` : 'Admin',
                                    date: request.adminApproval?.actionAt
                                } : null,

                                // Parent Step
                                {
                                    status: parentStatus,
                                    title: isParentApproved ? 'Approved by Parent' : (isParentRejected ? 'Rejected by Parent' : 'Parent Approval pending'),
                                    subtitle: request.parentApproval?.actorName ? `${request.parentApproval.actorName} - Parent` : 'Parent',
                                    date: request.parentApproval?.actionAt
                                },

                                // Submitted Step
                                {
                                    status: 'submitted',
                                    title: 'Request submitted',
                                    subtitle: request.studentId?.name || request.studentInfo?.name || request.studentName || 'Student',
                                    date: request.createdAt
                                }
                            ]
                                .filter(Boolean)
                                .filter(step => !((request.status === 'cancelled' || request.status === 'rejected') && step.status === 'pending'))
                                .map((step, idx) => {
                                    const cfg = getProgressConfig(step.status);
                                    return (
                                        <TimelineStep
                                            key={idx}
                                            title={step.title}
                                            subtitle={step.subtitle}
                                            formattedDate={formatProgressDate(step.date)}
                                            badgeLabel={cfg.label}
                                            badgeColor={cfg.color}
                                            badgeBg={cfg.bg}
                                            nodeColor={cfg.nodeColor}
                                            avatarBg={cfg.avatarBg}
                                            avatarColor={cfg.avatarColor}
                                        />
                                    );
                                })}

                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">

                    {/* Quick Summary */}
                    <DetailCard title="Quick Summary" subtitle="Quick Summary about the leave requests">
                        <div className="space-y-1">
                            <DetailRow
                                label="Student"
                                value={request.studentId?.name || '--'}
                                icon={<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>}
                            />
                            <DetailRow
                                label="Status"
                                value={renderBadge(getStatusLabel(request.status), getStatusColor(request.status))}
                                icon={<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                            />
                            <DetailRow
                                label="Parent approval"
                                value={renderBadge(isParentApproved ? 'Approved' : 'Pending', isParentApproved ? 'var(--color-success)' : 'var(--color-warning)')}
                                icon={<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                            />
                            <DetailRow
                                label="Leave Period"
                                value={isHomePass ? `${formatDateReadable(request.fromDate)} - ${formatDateReadable(request.toDate)}` : formatDateReadable(request.date)}
                                icon={<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
                            />
                            <DetailRow
                                label="Return"
                                value={isReturned ? (request.returnTracking?.returnStatus === 'late' ? 'Returned (Late)' : 'Returned') : '-----'}
                                icon={<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>}
                            />
                        </div>
                    </DetailCard>

                    {/* Recent Activity */}
                    <DetailCard title="Recent Activity" subtitle={`Recent Activity about the ${isHomePass ? 'home pass' : 'out pass'}`}>
                        <ActivityLog
                            timeline={timeline.map(t => ({
                                action: t.remarks || t.action.replace('_', ' '),
                                timestamp: t.timestamp,
                                actorRole: t.actorRole
                            }))}
                            defaultText="No activity recorded yet."
                        />
                    </DetailCard>

                </div>

            </div>
        </Modal>
    );
}
