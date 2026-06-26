import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { formatDate, formatDateTime } from '../../utils/formatters';
import leaveService from '@/services/leave.service';
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

export default function LeaveDetailsModal({ isOpen, onClose, leaveId }) {
    const [request, setRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const role = useAuthStore(s => s.user?.role);

    useEffect(() => {
        if (isOpen && leaveId) {
            setIsLoading(true);
            setError(null);
            leaveService.getLeaveDetails(role, leaveId)
                .then(res => {
                    setRequest(res.data || res);
                })
                .catch(err => {
                    console.error("Failed to fetch leave details:", err);
                    setError("Failed to load details.");
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setRequest(null);
        }
    }, [isOpen, leaveId]);

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

    const wardenStatus = request.wardenApproval?.status || 'pending';
    const isWardenApproved = wardenStatus === 'approved';
    const isWardenRejected = wardenStatus === 'rejected';

    const returnStatus = request.returnTracking?.returnStatus || 'pending';
    const isReturned = returnStatus === 'returned';

    const renderBadge = (label, color) => (
        <span className="inline-flex items-center gap-1.5 font-bold text-[12px]" style={{ color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
            {label}
        </span>
    );

    const renderProgressStep = ({ title, subtitle, status, date, iconLabel }) => {
        let nodeColor = '#F3F4F6';
        let iconColor = '#6B7280';
        let icon = <span className="text-[10px] font-bold" style={{ color: iconColor }}>{iconLabel}</span>;
        let badgeColor = 'var(--color-warning)';
        let badgeLabel = 'Pending';

        if (status === 'approved' || status === 'returned' || status === 'submitted') {
            nodeColor = status === 'submitted' ? '#1E3A8A' : 'var(--color-success)'; // Dark blue for submitted
            badgeColor = status === 'submitted' ? '#1E3A8A' : 'var(--color-success)';
            badgeLabel = status === 'returned' ? 'Returned' : (status === 'submitted' ? 'Submitted' : 'Approved');
            icon = <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>;
        } else if (status === 'rejected' || status === 'cancelled') {
            nodeColor = 'var(--color-danger)';
            badgeColor = 'var(--color-danger)';
            badgeLabel = status === 'cancelled' ? 'Cancelled' : 'Rejected';
            icon = <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>;
        }

        return (
            <div className="relative flex items-center justify-between group">
                <div className="flex items-start gap-4 w-full">
                    <div
                        className="absolute left-[-32px] w-6 h-6 rounded-full border-2 border-white z-10 flex items-center justify-center shadow-sm bg-white"
                        style={{ backgroundColor: nodeColor }}
                    >
                        {icon}
                    </div>
                    <div className="flex-1">
                        <div className="mb-1">{renderBadge(badgeLabel, badgeColor)}</div>
                        <h4 className="text-[14px] font-bold text-gray-800">{title}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[12px] text-gray-400 font-medium uppercase tracking-wider">{subtitle}</span>
                        </div>
                    </div>
                </div>
                {date && <div className="text-[12px] text-gray-500 font-medium bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-md shadow-sm whitespace-nowrap">{formatDateTime(date)}</div>}
            </div>
        );
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

                            {/* Return Status */}
                            {renderProgressStep({
                                title: isReturned ? 'Returned to Hostel' : 'Return Status',
                                subtitle: 'Security / User',
                                status: returnStatus,
                                iconLabel: 'R'
                            })}

                            {/* Warden Approval */}
                            {renderProgressStep({
                                title: isWardenApproved ? 'Approved by Warden' : (isWardenRejected ? 'Rejected by Warden' : 'Warden Approval'),
                                subtitle: 'Warden',
                                status: wardenStatus,
                                date: request.wardenApproval?.actionAt,
                                iconLabel: 'W'
                            })}

                            {/* Parent Approval */}
                            {renderProgressStep({
                                title: isParentApproved ? 'Approved by Parent' : (isParentRejected ? 'Rejected by Parent' : 'Parent Approval'),
                                subtitle: 'Parent',
                                status: parentStatus,
                                date: request.parentApproval?.actionAt,
                                iconLabel: 'P'
                            })}

                            {/* Submitted */}
                            {renderProgressStep({
                                title: 'Request Submitted',
                                subtitle: 'Student',
                                status: 'submitted',
                                date: request.createdAt,
                                iconLabel: 'S'
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
