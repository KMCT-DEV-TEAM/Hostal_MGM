import React from 'react';
import Modal from '@/components/ui/Modal';
import { formatDate } from '../../utils/formatters';

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

export default function LeaveDetailsModal({ isOpen, onClose, request }) {
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
    const isSubmitted = true;
    const isParentApproved = timeline.some(t => t.action === 'parent_approved') || request.status === 'pending_warden' || request.status === 'approved' || request.status === 'completed';
    const isWardenApproved = timeline.some(t => t.action === 'warden_approved') || request.status === 'approved' || request.status === 'completed';
    const isReturned = request.returnTracking?.returnStatus === 'returned';

    const renderBadge = (label, color) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-sm" style={{ color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
            {label}
        </span>
    );

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
                    <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                        <h3 className="text-primary font-semibold text-sm mb-1">{isHomePass ? 'Home Pass' : 'Out Pass'} Progress</h3>
                        <p className="text-xs text-gray-400 mb-8">Track the approval status of this {isHomePass ? 'home pass' : 'out pass'} request.</p>

                        <div className="relative pl-4 space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">

                            {/* Return Status */}
                            <div className="relative flex items-center justify-between group">
                                <div className="flex items-start gap-4">
                                    <div className="absolute left-[-16px] w-3.5 h-3.5 rounded-full border-2 border-white z-10" style={{ backgroundColor: isReturned ? 'var(--color-success)' : (request.status === 'approved' ? 'var(--color-warning)' : '#D1D5DB') }}></div>
                                    <div>
                                        <div className="mb-1">{renderBadge(isReturned ? 'Returned' : 'Pending', isReturned ? 'var(--color-success)' : 'var(--color-warning)')}</div>
                                        <h4 className="text-sm font-medium text-gray-700">Return Status {isReturned ? 'Completed' : 'pending'}</h4>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 font-bold">U</div>
                                            <span className="text-xs text-gray-400">User</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Warden Approval */}
                            <div className="relative flex items-center justify-between group">
                                <div className="flex items-start gap-4">
                                    <div className="absolute left-[-16px] w-3.5 h-3.5 rounded-full border-2 border-white z-10" style={{ backgroundColor: isWardenApproved ? 'var(--color-success)' : '#D1D5DB' }}></div>
                                    <div>
                                        <div className="mb-1">{renderBadge(isWardenApproved ? 'Approved' : 'Pending', isWardenApproved ? 'var(--color-success)' : 'var(--color-warning)')}</div>
                                        <h4 className="text-sm font-medium text-gray-700">{isWardenApproved ? 'Approved by warden' : 'Warden Approval'}</h4>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[9px] text-white font-bold">W</div>
                                            <span className="text-xs text-gray-400">Warden</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Parent Approval */}
                            <div className="relative flex items-center justify-between group">
                                <div className="flex items-start gap-4">
                                    <div className="absolute left-[-16px] w-3.5 h-3.5 rounded-full border-2 border-white z-10" style={{ backgroundColor: isParentApproved ? 'var(--color-success)' : '#D1D5DB' }}></div>
                                    <div>
                                        <div className="mb-1">{renderBadge(isParentApproved ? 'Approved' : 'Pending', isParentApproved ? 'var(--color-success)' : 'var(--color-warning)')}</div>
                                        <h4 className="text-sm font-medium text-gray-700">{isParentApproved ? 'Approved by Parent' : 'Parent Approval'}</h4>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[9px] text-white font-bold">P</div>
                                            <span className="text-xs text-gray-400">Parent</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submitted */}
                            <div className="relative flex items-center justify-between group">
                                <div className="flex items-start gap-4">
                                    <div className="absolute left-[-16px] w-3.5 h-3.5 rounded-full border-2 border-white z-10" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                                    <div>
                                        <div className="mb-1">{renderBadge('Submitted', 'var(--color-primary)')}</div>
                                        <h4 className="text-sm font-medium text-gray-700">Request submitted</h4>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[9px] text-white font-bold">S</div>
                                            <span className="text-xs text-gray-400">Student</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[10px] text-gray-400">{formatDate(request.createdAt)}</div>
                            </div>

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
