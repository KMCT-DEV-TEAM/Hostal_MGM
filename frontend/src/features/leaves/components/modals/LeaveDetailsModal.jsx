import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { formatDateReadable, formatDateTimeReadable } from '@/utils/formatters';
import leaveService from '@/services/leave.service';
import LeaveStatusBadge from '../badges/LeaveStatusBadge';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import TimelineStep from '@/components/ui/TimelineStep';

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

    useEffect(() => {
        const fetchLeaveDetails = async () => {
            if (!isOpen || !leaveId) {
                setRequest(null);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const res = await leaveService.getLeaveDetails(role, leaveId);
                setRequest(res.data || res);
            } catch (err) {
                console.error("Failed to fetch leave details:", err);
                setError("Failed to load details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaveDetails();
    }, [isOpen, leaveId, role]);

    if (!isOpen) return null;

    if (isLoading) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Loading Details..." maxWidth="max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 mt-4">
                    <div className="space-y-6">
                        <div className="h-[350px] bg-gray-100 animate-pulse rounded-xl"></div>
                        <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
                        <div className="h-[400px] bg-gray-100 animate-pulse rounded-xl"></div>
                    </div>
                    <div className="space-y-6">
                        <div className="h-48 bg-gray-100 animate-pulse rounded-xl"></div>
                        <div className="h-64 bg-gray-100 animate-pulse rounded-xl"></div>
                    </div>
                </div>
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
                    <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                        <h3 className="text-primary font-semibold text-sm mb-1">Student Information</h3>
                        <p className="text-xs text-gray-400 mb-6">Details about student</p>

                        <div className="grid grid-cols-[140px_1fr] gap-y-4 text-sm">
                            <div className="text-gray-500">Student</div>
                            <div className="flex items-center gap-3"><span className="text-gray-400">:</span> <span className="font-medium text-gray-700">{request.studentId?.name || '--'}</span></div>

                            <div className="text-gray-500">Student ID</div>
                            <div className="flex items-center gap-3"><span className="text-gray-400">:</span> <span className="font-medium text-gray-700">{request.studentId?.studentId || '--'}</span></div>


                            <div className="text-gray-500">Room No</div>
                            <div className="flex items-center gap-3"><span className="text-gray-400">:</span> <span className="font-medium text-gray-700">{request.studentId?.roomNumber || '--'}</span></div>
                        </div>
                    </div>

                    {/* Leave Information */}
                    <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                        <h3 className="text-primary font-semibold text-sm mb-1">Leave Information</h3>
                        <p className="text-xs text-gray-400 mb-6">Details about the leave requests</p>

                        <div className="grid grid-cols-[140px_1fr] gap-y-4 text-sm">
                            <div className="text-gray-500">Status</div>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400">:</span>
                                {renderBadge(getStatusLabel(request.status), getStatusColor(request.status))}
                            </div>

                            {isHomePass ? (
                                <>
                                    <div className="text-gray-500">From Date</div>
                                    <div className="flex items-center gap-3"><span className="text-gray-400">:</span> <span className="font-medium text-gray-700">{formatDateReadable(request.fromDate)}</span></div>

                                    <div className="text-gray-500">To Date</div>
                                    <div className="flex items-center gap-3"><span className="text-gray-400">:</span> <span className="font-medium text-gray-700">{formatDateReadable(request.toDate)}</span></div>
                                </>
                            ) : (
                                <>
                                    <div className="text-gray-500">Date</div>
                                    <div className="flex items-center gap-3"><span className="text-gray-400">:</span> <span className="font-medium text-gray-700">{formatDateReadable(request.date)}</span></div>

                                    <div className="text-gray-500">Outing Time</div>
                                    <div className="flex items-center gap-3"><span className="text-gray-400">:</span> <span className="font-medium text-gray-700">{request.outTime || '--'} to {request.expectedReturnTime || '--'}</span></div>
                                </>
                            )}

                            <div className="text-gray-500">{isHomePass ? 'Duration' : 'Category'}</div>
                            <div className="flex items-center gap-3"><span className="text-gray-400">:</span> <span className="font-medium text-gray-700">{duration}</span></div>

                            <div className="text-gray-500">Applied Date</div>
                            <div className="flex items-center gap-3"><span className="text-gray-400">:</span> <span className="font-medium text-gray-700">{formatDateReadable(request.createdAt)}</span></div>

                            <div className="text-gray-500">Parent approval</div>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400">:</span>
                                {renderBadge(isParentApproved ? 'Approved' : 'Pending', isParentApproved ? 'var(--color-success)' : 'var(--color-warning)')}
                            </div>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                        <h3 className="text-primary font-semibold text-sm mb-1">Reason</h3>
                        <p className="text-xs text-gray-400 mb-4">Reason for the leave</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {request.reason || 'No reason provided.'}
                        </p>
                    </div>

                    {/* Pass Progress */}
                    <div className="border border-gray-100 rounded-2xl p-6 bg-white shadow-sm relative overflow-hidden">

                        <h3 className="text-primary font-semibold text-sm mb-1">
                            {isHomePass ? 'Home Pass' : 'Out Pass'} Progress
                        </h3>
                        <p className="text-xs text-gray-400 mb-6">Track the live approval status of this request.</p>

                        <div className="relative pl-8 space-y-10 before:absolute before:top-4 before:bottom-4 before:left-[11px] before:w-0.5 before:bg-gray-200">
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
                            .filter(step => !( (request.status === 'cancelled' || request.status === 'rejected') && step.status === 'pending' ))
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
                    <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                        <h3 className="text-primary font-semibold text-sm mb-1">Quick Summery</h3>
                        <p className="text-xs text-gray-400 mb-6">Quick Summery about the leave requests</p>

                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-[130px_1fr] items-center">
                                <div className="text-gray-400 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    Student
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400">:</span>
                                    <span className="text-gray-700 font-medium">{request.studentId?.name || '--'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-[130px_1fr] items-center">
                                <div className="text-gray-400 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Status
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400">:</span>
                                    {renderBadge(getStatusLabel(request.status), getStatusColor(request.status))}
                                </div>
                            </div>

                            <div className="grid grid-cols-[130px_1fr] items-center">
                                <div className="text-gray-400 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Parent approval
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400">:</span>
                                    {renderBadge(isParentApproved ? 'Approved' : 'Pending', isParentApproved ? 'var(--color-success)' : 'var(--color-warning)')}
                                </div>
                            </div>

                            <div className="grid grid-cols-[130px_1fr] items-center">
                                <div className="text-gray-400 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    Leave Period
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400">:</span>
                                    <span className="text-gray-700 font-medium">
                                        {isHomePass ? `${formatDateReadable(request.fromDate)} - ${formatDateReadable(request.toDate)}` : formatDateReadable(request.date)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-[130px_1fr] items-center">
                                <div className="text-gray-400 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                    Return
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400">:</span>
                                    <span className="text-gray-700 font-medium">
                                        {isReturned ? (request.returnTracking?.returnStatus === 'late' ? 'Returned (Late)' : 'Returned') : '-----'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                        <h3 className="text-primary font-semibold text-sm mb-1">Recent Activity</h3>
                        <p className="text-xs text-gray-400 mb-4">Recent Activity about the {isHomePass ? 'home pass' : 'out pass'}</p>

                        <div className="relative pl-6 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-gray-200 space-y-6 mt-4">
                            {timeline.length > 0 ? (
                                [...timeline].reverse().map((t, idx) => {
                                    const config = getTimelineConfig(t.action);
                                    return (
                                        <TimelineStep
                                            key={idx}
                                            title={t.remarks || t.action.replace(/_/g, ' ')}
                                            subtitle={t.actorRole || 'System'}
                                            formattedDate={formatDateReadable(t.timestamp)}
                                            badgeLabel={config.label}
                                            badgeColor={config.color}
                                            badgeBg={config.bg}
                                            nodeColor={config.nodeColor}
                                            avatarBg={config.bg}
                                            avatarColor={config.color}
                                        />
                                    );
                                })
                            ) : (
                                <div className="border border-gray-100 rounded-lg p-3 text-center text-xs text-gray-400">
                                    No activity recorded yet.
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </Modal>
    );
}
