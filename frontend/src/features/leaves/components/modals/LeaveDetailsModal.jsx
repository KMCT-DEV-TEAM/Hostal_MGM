import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { formatDate, formatDateTime } from '../../utils/formatters';
import leaveService from '@/services/leave.service';
import LeaveStatusBadge from '../badges/LeaveStatusBadge';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';

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

    const getInitials = (name) => {
        if (!name || name === 'user' || name === 'Admin' || name === 'Parent' || name === 'Student') return name[0].toUpperCase();
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const renderProgressStep = ({ title, subtitle, status, date }) => {
        let nodeColor = '#D1D5DB'; // gray-300 for pending
        let badgeColor = '#6B7280'; // text-gray-500
        let badgeBg = '#F3F4F6'; // bg-gray-100
        let badgeLabel = 'Pending';
        let avatarBg = '#E5E7EB'; // gray-200 for pending user
        let avatarColor = '#6B7280';

        if (status === 'approved' || status === 'returned' || status === 'on_time') {
            nodeColor = 'var(--color-success)';
            badgeColor = 'var(--color-success)';
            badgeBg = '#ECFDF5'; // success-50
            badgeLabel = (status === 'returned' || status === 'on_time') ? 'Returned' : 'Approved';
            avatarBg = '#1E3A8A'; // Dark blue avatar for actors who acted
            avatarColor = '#FFFFFF';
        } else if (status === 'rejected' || status === 'cancelled' || status === 'late' || status === 'left') {
            nodeColor = '#EF4444'; // text-red-500
            badgeColor = '#EF4444';
            badgeBg = '#FEF2F2'; // bg-red-50
            badgeLabel = status === 'cancelled' ? 'Cancelled' : (status === 'late' ? 'Returned (Late)' : (status === 'left' ? 'Left' : 'Rejected'));
            avatarBg = '#1E3A8A';
            avatarColor = '#FFFFFF';
        } else if (status === 'submitted') {
            nodeColor = '#3B82F6'; // text-blue-500
            badgeColor = '#3B82F6';
            badgeBg = '#EFF6FF'; // bg-blue-50
            badgeLabel = 'Submitted';
            avatarBg = '#1E3A8A';
            avatarColor = '#FFFFFF';
        }

        // Parse subtitle to get name for avatar (e.g. "Nila Mohan - warden" -> "Nila Mohan")
        const actorName = (subtitle || '').split('-')[0].trim();

        // Fix date string (e.g. "Jul 1, 2026, 10:27 AM" -> "Jul 1, 2026 | 10:27 AM")
        let formattedDate = '-----';
        if (date) {
            const rawDate = formatDateTime(date);
            const lastCommaIndex = rawDate.lastIndexOf(',');
            if (lastCommaIndex !== -1) {
                formattedDate = rawDate.substring(0, lastCommaIndex) + ' |' + rawDate.substring(lastCommaIndex + 1);
            } else {
                formattedDate = rawDate;
            }
        }

        return (
            <div className="relative flex items-center justify-between group">
                <div className="flex items-start gap-5 w-full">
                    {/* Node on the timeline */}
                    <div
                        className="absolute left-[-24.5px] top-1.5 w-[9px] h-[9px] rounded-full ring-2 ring-white z-10"
                        style={{ backgroundColor: nodeColor }}
                    ></div>

                    <div className="flex-1 space-y-1.5">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-1.5 font-semibold text-[10px] px-2 py-0.5 rounded-sm" style={{ color: badgeColor, backgroundColor: badgeBg }}>
                            <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: badgeColor }}></span>
                            {badgeLabel}
                        </div>

                        {/* Title */}
                        <h4 className="text-[13px] font-medium text-gray-700 capitalize">{title}</h4>

                        {/* Actor info */}
                        <div className="flex items-center gap-2 mt-1">
                            <div
                                className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[8px] font-bold"
                                style={{ backgroundColor: avatarBg, color: avatarColor }}
                            >
                                {getInitials(actorName)}
                            </div>
                            <span className="text-[11px] text-gray-400 font-medium capitalize">{subtitle}</span>
                        </div>
                    </div>
                </div>

                {/* Date on the right */}
                <div className="text-[10px] text-gray-400 font-medium whitespace-nowrap self-end mb-1">
                    {formattedDate}
                </div>
            </div>
        );
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
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 mt-4">

                {/* LEFT COLUMN */}
                <div className="space-y-6">

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
                                    <div className="flex items-center gap-3"><span className="text-gray-400">:</span> <span className="font-medium text-gray-700">{formatDate(request.fromDate)}</span></div>

                                    <div className="text-gray-500">To Date</div>
                                    <div className="flex items-center gap-3"><span className="text-gray-400">:</span> <span className="font-medium text-gray-700">{formatDate(request.toDate)}</span></div>
                                </>
                            ) : (
                                <>
                                    <div className="text-gray-500">Date</div>
                                    <div className="flex items-center gap-3"><span className="text-gray-400">:</span> <span className="font-medium text-gray-700">{formatDate(request.date)}</span></div>

                                    <div className="text-gray-500">Outing Time</div>
                                    <div className="flex items-center gap-3"><span className="text-gray-400">:</span> <span className="font-medium text-gray-700">{request.outTime || '--'} to {request.expectedReturnTime || '--'}</span></div>
                                </>
                            )}

                            <div className="text-gray-500">{isHomePass ? 'Duration' : 'Category'}</div>
                            <div className="flex items-center gap-3"><span className="text-gray-400">:</span> <span className="font-medium text-gray-700">{duration}</span></div>

                            <div className="text-gray-500">Applied Date</div>
                            <div className="flex items-center gap-3"><span className="text-gray-400">:</span> <span className="font-medium text-gray-700">{formatDate(request.createdAt)}</span></div>

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
                            {console.log('modal details response: ', request)}
                            {/* Return Status */}
                            {renderProgressStep({
                                title: isReturned ? 'Returned to Hostel' : (returnStatus === 'left' ? 'Left Hostel' : 'Return Status pending'),
                                subtitle: request.studentId.name,
                                status: returnStatus,
                            })}

                            {/* Admin Approval */}
                            {renderProgressStep({
                                title: isAdminApproved ? `Approved by ${request.adminApproval?.actorRole || 'admin'}` : (isAdminRejected ? `Rejected by ${request.adminApproval?.actorRole || 'admin'}` : 'Admin Approval'),
                                subtitle: request.adminApproval?.actorName ? `${request.adminApproval.actorName} - ${request.adminApproval.actorRole || 'admin'}` : 'Admin',
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
                                title: 'Request submitted',
                                subtitle: request.studentId?.name || request.studentInfo?.name || request.studentName || 'Student',
                                status: 'submitted',
                                date: request.createdAt,
                            })}

                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">

                    {/* Quick Summary */}
                    <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                        <h3 className="text-primary font-semibold text-sm mb-1">Quick Summary</h3>
                        <p className="text-xs text-gray-400 mb-6">Quick Summary about the leave requests</p>

                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-[100px_1fr] items-center">
                                <div className="text-gray-400 flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Status
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400">:</span>
                                    {renderBadge(getStatusLabel(request.status), getStatusColor(request.status))}
                                </div>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] items-center">
                                <div className="text-gray-400 flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Parent
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400">:</span>
                                    {renderBadge(isParentApproved ? 'Approved' : 'Pending', isParentApproved ? 'var(--color-success)' : 'var(--color-warning)')}
                                </div>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] items-center">
                                <div className="text-gray-400 flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    {isHomePass ? 'From Date' : 'Date'}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400">:</span>
                                    <span className="text-gray-700 font-medium">{formatDate(isHomePass ? request.fromDate : request.date)}</span>
                                </div>
                            </div>
                            {isHomePass && (
                                <div className="grid grid-cols-[100px_1fr] items-center">
                                    <div className="text-gray-400 flex items-center gap-2">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        To Date
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-400">:</span>
                                        <span className="text-gray-700 font-medium">{formatDate(request.toDate)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                        <h3 className="text-primary font-semibold text-sm mb-1">Recent Activity</h3>
                        <p className="text-xs text-gray-400 mb-4">Recent Activity about the {isHomePass ? 'home pass' : 'out pass'}</p>

                        <div className="space-y-3">
                            {timeline.length > 0 ? (
                                [...timeline].reverse().map((t, idx) => (
                                    <div key={idx} className="border border-gray-100 rounded-lg p-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-medium text-gray-700 capitalize">{t.remarks || t.action.replace('_', ' ')}</span>
                                            <span className="text-[10px] text-gray-400">{formatDate(t.timestamp)}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 capitalize">by {t.actorRole}</div>
                                    </div>
                                ))
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
