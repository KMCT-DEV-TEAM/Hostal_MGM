import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import { getVisitorDetails, getVisitorDetailsParent, approveVisitRequest, rejectVisitRequest, unassignVisitor, blacklistVisitor, removeBlacklistVisitor } from '@/services/visitor.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveStudent } from '@/hooks/useActiveStudent';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { ROLES } from '@/constants/roles';

import Button from '@/components/ui/Button';
import CheckInModal from './CheckInModal';
import AssignStudentModal from './AssignStudentModal';
import DetailCard from '@/components/ui/DetailCard';
import DetailRow from '@/components/ui/DetailRow';
import StatusBadge from '@/components/ui/StatusBadge';
import LinkedStudentCard from '../LinkedStudentCard';
import TimelineStep from '@/components/ui/TimelineStep';
import { User, Phone, Mail, FileText, CreditCard, Users, MapPin, Building, Calendar, Info, Clock, History, AlertCircle } from 'lucide-react';
import { formatDateTimeReadable } from '@/utils/formatters';

export default function VisitorDetailsModal({
    isOpen,
    onClose,
    visitorId,
    onApprove,
    onReject,
    onActive
}) {
    const [visitor, setVisitor] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCheckInOpen, setIsCheckInOpen] = useState(false);

    // Approval/Rejection state
    const [approvingRequestId, setApprovingRequestId] = useState(null);
    const [rejectingRequestId, setRejectingRequestId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [unassigningStudentId, setUnassigningStudentId] = useState(null);
    const [isAssignOpen, setIsAssignOpen] = useState(false);

    const [isActionLoading, setIsActionLoading] = useState(false);

    const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false);
    const [blacklistReason, setBlacklistReason] = useState('');
    const [isRemoveBlacklistModalOpen, setIsRemoveBlacklistModalOpen] = useState(false);
    const [removeBlacklistReason, setRemoveBlacklistReason] = useState('');

    const { user } = useAuthStore();
    const { activeStudentId } = useActiveStudent();

    const fetchDetails = useCallback(async (isBackground = false) => {
        if (!isOpen || !visitorId) {
            setVisitor(null);
            return;
        }

        if (!isBackground) {
            setIsLoading(true);
        }
        setError(null);

        try {
            let res;
            if (user?.role === ROLES.PARENT) {
                res = await getVisitorDetailsParent(visitorId, activeStudentId);
            } else {
                res = await getVisitorDetails(visitorId);
            }
            setVisitor(res.data || res);
        } catch (err) {
            console.error("Failed to fetch visitor details:", err);
            const serverMessage = err?.response?.data?.message || "Failed to load details.";
            setError(serverMessage);
        } finally {
            if (!isBackground) {
                setIsLoading(false);
            }
        }
    }, [isOpen, visitorId, user?.role, activeStudentId]);

    useEffect(() => {
        fetchDetails(false);
    }, [fetchDetails]);

    const handleApproveRequestSubmit = async () => {
        if (!approvingRequestId) return;
        setIsActionLoading(true);
        try {
            await approveVisitRequest(approvingRequestId);
            showSuccessToast("Visit request approved successfully.");
            setApprovingRequestId(null);
            fetchDetails(true); // background refresh
        } catch (err) {
            console.error("Approve failed:", err);
            showErrorToast(err?.response?.data?.message || "Failed to approve request");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRejectRequestSubmit = async () => {
        if (!rejectReason.trim()) {
            showErrorToast("Rejection reason is required");
            return;
        }
        setIsActionLoading(true);
        try {
            await rejectVisitRequest(rejectingRequestId, rejectReason);
            showSuccessToast("Visit request rejected successfully.");
            setRejectingRequestId(null);
            setRejectReason('');
            fetchDetails(true); // background refresh
        } catch (err) {
            console.error("Reject failed:", err);
            showErrorToast(err?.response?.data?.message || "Failed to reject request");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleUnassignSubmit = async () => {
        if (!unassigningStudentId) return;
        setIsActionLoading(true);
        try {
            await unassignVisitor(unassigningStudentId, visitorId);
            showSuccessToast("Student unassigned successfully.");
            setUnassigningStudentId(null);
            fetchDetails(true);
        } catch (err) {
            console.error("Unassign failed:", err);
            showErrorToast(err?.response?.data?.message || "Failed to unassign student");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleBlacklistSubmit = async () => {
        if (!blacklistReason.trim() || blacklistReason.length < 3) {
            showErrorToast("Reason is required and must be at least 3 characters.");
            return;
        }
        setIsActionLoading(true);
        try {
            await blacklistVisitor(visitorId, blacklistReason);
            showSuccessToast("Visitor blacklisted successfully.");
            setIsBlacklistModalOpen(false);
            setBlacklistReason('');
            fetchDetails(true);
        } catch (err) {
            console.error("Blacklist failed:", err);
            showErrorToast(err?.response?.data?.message || "Failed to blacklist visitor");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRemoveBlacklistSubmit = async () => {
        setIsActionLoading(true);
        try {
            await removeBlacklistVisitor(visitorId, removeBlacklistReason);
            showSuccessToast("Blacklist removed successfully.");
            setIsRemoveBlacklistModalOpen(false);
            setRemoveBlacklistReason('');
            fetchDetails(true);
        } catch (err) {
            console.error("Remove blacklist failed:", err);
            showErrorToast(err?.response?.data?.message || "Failed to remove blacklist");
        } finally {
            setIsActionLoading(false);
        }
    };

    if (!isOpen) return null;

    if (isLoading) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Loading Details..." maxWidth="max-w-5xl">
                <div className="min-h-[90vh] bg-gray-100 animate-pulse rounded-xl mt-4"></div>
            </Modal>
        );
    }

    if (error) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Access Restricted" maxWidth="max-w-md">
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center">
                        <AlertCircle size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Unable to Load Visitor</h3>
                        <p className="text-[14px] text-text-secondary leading-relaxed">
                            {error}
                        </p>
                    </div>
                    <Button
                        onClick={onClose}
                        size='sm'
                        className="mt-4 !bg-primary! hover:!bg-primary! hover:!text-white! px-8"
                        fullWidth={false}
                    >
                        Close
                    </Button>
                </div>
            </Modal>
        );
    }

    if (!visitor) return null;

    const visitorName = visitor.visitorName || visitor.name;
    const linkedStudents = visitor.visitRequests?.map(req => ({
        ...req.student,
        id: req.id,
        studentId: req.studentId,
        relationship: req.relationship,
        requestStatus: req.status,
        date: req.createdAt,
        purpose: req.purpose,
        remarks: req.remarks
    })) || visitor.linkedStudents || visitor.students || [];
    const studentNames = linkedStudents.length > 0 ? linkedStudents.map(s => s.name).join(', ') : '';
    const subtitle = `Linked to: ${studentNames || 'N/A'}`;

    const renderFooter = () => {
        if (!visitor) return null;

        const role = user?.role;
        const status = visitor.status?.toLowerCase();

        const canBlacklist = role === ROLES.SUPER_ADMIN && status !== 'blacklisted' && status !== 'deleted';
        const canRemoveBlacklist = role === ROLES.SUPER_ADMIN && status === 'blacklisted';
        const canActive = ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PARENT, ROLES.MENTOR].includes(role) && status === 'inactive');

        if (!canBlacklist && !canRemoveBlacklist && !canActive) return null;

        return (
            <div className="flex items-center justify-end gap-3 w-full">

                {canBlacklist && (
                    <Button
                        variant="outline"
                        size="sm"
                        fullWidth={false}
                        className="border-danger! text-danger! hover:bg-danger! hover:text-white!"
                        onClick={() => setIsBlacklistModalOpen(true)}
                    >
                        Blacklist
                    </Button>
                )}

                {canRemoveBlacklist && (
                    <Button
                        variant="outline"
                        size="sm"
                        fullWidth={false}
                        className="border-success! text-success! hover:bg-success! hover:text-white!"
                        onClick={() => setIsRemoveBlacklistModalOpen(true)}
                    >
                        Remove Blacklist
                    </Button>
                )}

                {canActive && (
                    <Button
                        variant="outline"
                        size="sm"
                        fullWidth={false}
                        className="border-success! text-success! hover:bg-success! hover:text-white!"
                        onClick={() => {
                            onClose();
                            onActive && onActive(visitorId);
                        }}
                    >
                        Active
                    </Button>
                )}
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={visitorName}
            subtitle={subtitle}
            avatar={visitorName}
            maxWidth="max-w-5xl"
            footer={renderFooter()}
        >
            <div className="mt-6 grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">
                {/* Left Column */}
                <div className="flex flex-col gap-4">
                    <DetailCard
                        title="Visitor Information"
                        subtitle="Basic personal details"
                        headerAction={
                            visitor.status === 'Active' && user?.role === ROLES.WARDEN && (
                                <Button
                                    size="sm"
                                    fullWidth={false}
                                    onClick={() => setIsCheckInOpen(true)}
                                >
                                    Check In
                                </Button>
                            )
                        }
                    >
                        <DetailRow icon={<User size={16} />} label="Full Name" value={visitorName} />
                        <DetailRow icon={<Phone size={16} />} label="Phone" value={visitor.phone} />
                        {visitor.email && <DetailRow icon={<Mail size={16} />} label="Email" value={visitor.email} />}
                        {visitor.address && <DetailRow icon={<MapPin size={16} />} label="Address" value={visitor.address} />}
                    </DetailCard>

                    <DetailCard
                        title="Linked Students"
                        subtitle="Students associated with this visitor"
                        headerAction={
                            user?.role === ROLES.PARENT && visitor.status !== 'Blacklisted' && (
                                <Button size="sm" variant="outline" fullWidth={false} onClick={() => setIsAssignOpen(true)} className="px-2 py-1 h-auto text-xs border-primary text-primary hover:bg-primary hover:text-white">
                                    + Assign
                                </Button>
                            )
                        }
                    >
                        <div className="flex flex-col gap-3 mt-2">
                            {linkedStudents.length > 0 ? (
                                linkedStudents.map((student, idx) => (
                                    <LinkedStudentCard
                                        key={idx}
                                        student={student}
                                        visitor={visitor}
                                        userRole={user?.role}
                                        onApprove={setApprovingRequestId}
                                        onReject={setRejectingRequestId}
                                        onUnassign={setUnassigningStudentId}
                                    />
                                ))
                            ) : (
                                <div className="text-sm text-text-secondary italic text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    No students assigned to this visitor.
                                </div>
                            )}
                        </div>
                    </DetailCard>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-4">
                    <DetailCard title="Quick Summary" subtitle="View the quick details">
                        <DetailRow icon={<User size={16} />} label="Full Name" value={visitorName} />
                        <DetailRow icon={<Phone size={16} />} label="Phone" value={visitor.phone} />
                        <DetailRow icon={<FileText size={16} />} label="ID Type" value={visitor.idProofType} />
                        <DetailRow icon={<Info size={16} />} label="Status" value={<StatusBadge status={visitor.status} />} />
                        <DetailRow icon={<Calendar size={16} />} label="Registered" value={formatDateTimeReadable(visitor.createdAt)} />
                    </DetailCard>

                    <DetailCard title="Identity Details" subtitle="Provided ID proofs">
                        <DetailRow icon={<FileText size={16} />} label="ID Type" value={visitor.idProofType} />
                        <DetailRow icon={<CreditCard size={16} />} label="ID Number" value={visitor.idProofNumber} />
                        {visitor.organization && visitor.organization.name && (
                            <DetailRow icon={<Building size={16} />} label="Organization" value={visitor.organization.name} />
                        )}
                    </DetailCard>

                    <DetailCard title="Status & Timestamps" subtitle="Registration status log">
                        <DetailRow icon={<Calendar size={16} />} label="Registered" value={formatDateTimeReadable(visitor.createdAt)} />
                        <DetailRow icon={<Info size={16} />} label="Status" value={<StatusBadge status={visitor.status} />} />
                        {visitor.approvedBy && (
                            <DetailRow icon={<User size={16} />} label="Approved By" value={visitor.approvedBy.name} />
                        )}
                        {visitor.approvedAt && (
                            <DetailRow icon={<Clock size={16} />} label="Approved At" value={formatDateTimeReadable(visitor.approvedAt)} />
                        )}
                        {visitor.rejectedBy && (
                            <DetailRow icon={<User size={16} />} label="Rejected By" value={visitor.rejectedBy.name} />
                        )}
                        {visitor.rejectionReason && (
                            <DetailRow icon={<Info size={16} />} label="Reason" value={visitor.rejectionReason} />
                        )}
                    </DetailCard>

                    {visitor.timeline && visitor.timeline.length > 0 && (
                        <DetailCard title="Timeline" subtitle="Activity log">
                            <div className="relative pl-8 mt-4 space-y-10 before:absolute before:top-4 before:bottom-4 before:left-[11px] before:w-0.5 before:bg-gray-200">
                                {visitor.timeline.map((item, index) => {
                                    const actionText = item.action || 'Updated';
                                    const badgeBg = actionText === 'Approved' ? 'bg-success/10' : actionText === 'Rejected' ? 'bg-danger/10' : 'bg-primary/10';
                                    const badgeColor = actionText === 'Approved' ? 'text-success' : actionText === 'Rejected' ? 'text-danger' : 'text-primary';
                                    const nodeColor = actionText === 'Approved' ? 'bg-success' : actionText === 'Rejected' ? 'bg-danger' : 'bg-primary';

                                    return (
                                        <TimelineStep
                                            key={index}
                                            title={item.remarks || actionText}
                                            subtitle={`${item.performedBy || 'System'} - ${item.role || 'System'}`}
                                            formattedDate={formatDateTimeReadable(item.createdAt)}
                                            badgeLabel={actionText.toUpperCase()}
                                            badgeBg={badgeBg}
                                            badgeColor={badgeColor}
                                            nodeColor={nodeColor}
                                            avatarBg="bg-gray-100"
                                            avatarColor="text-text-secondary"
                                        />
                                    );
                                })}
                            </div>
                        </DetailCard>
                    )}
                </div>
            </div>

            <CheckInModal
                isOpen={isCheckInOpen}
                onClose={() => setIsCheckInOpen(false)}
                onSuccess={() => {
                    setIsCheckInOpen(false);
                    onClose();
                }}
                prefilledVisitor={visitor}
            />

            {/* Approval Modal */}
            <Modal
                isOpen={!!approvingRequestId}
                onClose={() => setApprovingRequestId(null)}
                title="Approve Visit Request"
                maxWidth="max-w-md"
                footer={
                    <div className="flex items-center justify-end gap-3 w-full">
                        <Button
                            variant="outline"
                            size="sm"
                            fullWidth={false}
                            className="border-gray-200! text-text-secondary! hover:bg-gray-50!"
                            onClick={() => setApprovingRequestId(null)}
                            disabled={isActionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            fullWidth={false}
                            className="!bg-primary! hover:!bg-primary! hover:!text-white!"
                            onClick={handleApproveRequestSubmit}
                            isLoading={isActionLoading}
                        >
                            Confirm Approval
                        </Button>
                    </div>
                }
            >
                <div className="pt-2 pb-4">
                    <p className="text-[13px] text-text-secondary">
                        Are you sure you want to approve this visit request? The parent and student will be notified.
                    </p>
                </div>
            </Modal>

            {/* Rejection Modal */}
            <Modal
                isOpen={!!rejectingRequestId}
                onClose={() => {
                    setRejectingRequestId(null);
                    setRejectReason('');
                }}
                title="Reject Visit Request"
                maxWidth="max-w-md"
                footer={
                    <div className="flex items-center justify-end gap-3 w-full">
                        <Button
                            variant="outline"
                            size="sm"
                            fullWidth={false}
                            className="border-gray-200! text-text-secondary! hover:bg-gray-50!"
                            onClick={() => {
                                setRejectingRequestId(null);
                                setRejectReason('');
                            }}
                            disabled={isActionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            fullWidth={false}
                            className="!bg-danger! hover:!bg-danger! hover:!text-white!"
                            onClick={handleRejectRequestSubmit}
                            isLoading={isActionLoading}
                        >
                            Confirm Rejection
                        </Button>
                    </div>
                }
            >
                <div className="pt-2 pb-4">
                    <label className="block text-[13px] font-medium text-text-primary mb-2">
                        Reason for Rejection *
                    </label>
                    <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g., Student has an exam scheduled for today."
                        rows="3"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger resize-none"
                    ></textarea>
                </div>
            </Modal>

            {/* Unassign Confirmation Modal */}
            <Modal
                isOpen={!!unassigningStudentId}
                onClose={() => setUnassigningStudentId(null)}
                title="Unassign Student"
                maxWidth="max-w-md"
                footer={
                    <div className="flex items-center justify-end gap-3 w-full">
                        <Button
                            variant="outline"
                            size="sm"
                            fullWidth={false}
                            className="border-gray-200! text-text-secondary! hover:bg-gray-50!"
                            onClick={() => setUnassigningStudentId(null)}
                            disabled={isActionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            fullWidth={false}
                            className="!bg-danger! hover:!bg-danger! hover:!text-white!"
                            onClick={handleUnassignSubmit}
                            isLoading={isActionLoading}
                        >
                            Confirm Unassign
                        </Button>
                    </div>
                }
            >
                <div className="pt-2 pb-4">
                    <p className="text-[13px] text-text-secondary">
                        Are you sure you want to unassign this student from the visitor? This will cancel any active link, but historical records will remain.
                    </p>
                </div>
            </Modal>

            <AssignStudentModal
                isOpen={isAssignOpen}
                onClose={() => setIsAssignOpen(false)}
                visitor={visitor}
                visitorId={visitorId}
                onSuccess={() => {
                    setIsAssignOpen(false);
                    fetchDetails(true);
                }}
            />

            {/* Blacklist Modal */}
            <Modal
                isOpen={isBlacklistModalOpen}
                onClose={() => {
                    setIsBlacklistModalOpen(false);
                    setBlacklistReason('');
                }}
                title="Blacklist Visitor"
                maxWidth="max-w-md"
                footer={
                    <div className="flex items-center justify-end gap-3 w-full">
                        <Button
                            variant="outline"
                            size="sm"
                            fullWidth={false}
                            className="border-gray-200! text-text-secondary! hover:bg-gray-50!"
                            onClick={() => {
                                setIsBlacklistModalOpen(false);
                                setBlacklistReason('');
                            }}
                            disabled={isActionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            fullWidth={false}
                            className="!bg-danger! hover:!bg-danger! hover:!text-white!"
                            onClick={handleBlacklistSubmit}
                            isLoading={isActionLoading}
                        >
                            Confirm Blacklist
                        </Button>
                    </div>
                }
            >
                <div className="pt-2 pb-4">
                    <p className="text-[13px] text-text-secondary mb-4">
                        Are you sure you want to blacklist this visitor? This will immediately cancel all pending and approved visits.
                    </p>
                    <label className="block text-[13px] font-medium text-text-primary mb-2">
                        Reason for Blacklisting *
                    </label>
                    <textarea
                        value={blacklistReason}
                        onChange={(e) => setBlacklistReason(e.target.value)}
                        placeholder="e.g., Security violation at main gate"
                        rows="3"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger resize-none"
                    ></textarea>
                </div>
            </Modal>

            {/* Remove Blacklist Modal */}
            <Modal
                isOpen={isRemoveBlacklistModalOpen}
                onClose={() => {
                    setIsRemoveBlacklistModalOpen(false);
                    setRemoveBlacklistReason('');
                }}
                title="Remove Blacklist"
                maxWidth="max-w-md"
                footer={
                    <div className="flex items-center justify-end gap-3 w-full">
                        <Button
                            variant="outline"
                            size="sm"
                            fullWidth={false}
                            className="border-gray-200! text-text-secondary! hover:bg-gray-50!"
                            onClick={() => {
                                setIsRemoveBlacklistModalOpen(false);
                                setRemoveBlacklistReason('');
                            }}
                            disabled={isActionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            fullWidth={false}
                            className="!bg-success! hover:!bg-success! hover:!text-white!"
                            onClick={handleRemoveBlacklistSubmit}
                            isLoading={isActionLoading}
                        >
                            Remove Blacklist
                        </Button>
                    </div>
                }
            >
                <div className="pt-2 pb-4">
                    <p className="text-[13px] text-text-secondary mb-4">
                        Are you sure you want to remove the blacklist status for this visitor? Their status will be set to Inactive.
                    </p>
                    <label className="block text-[13px] font-medium text-text-primary mb-2">
                        Reason (Optional)
                    </label>
                    <textarea
                        value={removeBlacklistReason}
                        onChange={(e) => setRemoveBlacklistReason(e.target.value)}
                        placeholder="e.g., Cleared by security"
                        rows="3"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-success/20 focus:border-success resize-none"
                    ></textarea>
                </div>
            </Modal>
        </Modal>
    );
}
