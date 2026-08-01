import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { getVisitorDetails, getVisitorDetailsParent } from '@/services/visitor.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveStudent } from '@/hooks/useActiveStudent';

import Button from '@/components/ui/Button';
import CheckInModal from './CheckInModal';
import DetailCard from '@/components/ui/DetailCard';
import DetailRow from '@/components/ui/DetailRow';
import StatusBadge from '@/components/ui/StatusBadge';
import TimelineStep from '@/components/ui/TimelineStep';
import { User, Phone, Mail, FileText, CreditCard, Users, MapPin, Building, Calendar, Info, Clock, History } from 'lucide-react';
import { formatDateTimeReadable } from '@/utils/formatters';

export default function VisitorDetailsModal({
    isOpen,
    onClose,
    visitorId,
    onApprove,
    onReject,
    onDelete,
    onActive
}) {
    const [visitor, setVisitor] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCheckInOpen, setIsCheckInOpen] = useState(false);
    const { user } = useAuthStore();
    const { activeStudentId } = useActiveStudent();

    useEffect(() => {
        const fetchDetails = async () => {
            if (!isOpen || !visitorId) {
                setVisitor(null);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                let res;
                if (user?.role === 'parent') {
                    res = await getVisitorDetailsParent(visitorId, activeStudentId);
                } else {
                    res = await getVisitorDetails(visitorId);
                }
                setVisitor(res.data || res);
            } catch (err) {
                console.error("Failed to fetch visitor details:", err);
                setError("Failed to load details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [isOpen, visitorId, user?.role, activeStudentId]);

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
            <Modal isOpen={isOpen} onClose={onClose} title="Error" maxWidth="max-w-md">
                <div className="p-4 text-center text-danger font-medium">{error}</div>
            </Modal>
        );
    }

    if (!visitor) return null;

    const visitorName = visitor.visitorName || visitor.name;
    const linkedStudents = visitor.linkedStudents || visitor.students || [];
    const studentNames = linkedStudents.length > 0 ? linkedStudents.map(s => s.name).join(', ') : '';
    const subtitle = `Linked to: ${studentNames || 'N/A'}`;

    const renderFooter = () => {
        if (!visitor) return null;

        const role = user?.role;
        const status = visitor.status?.toLowerCase();

        const canApproveReject = ['super_admin', 'admin', 'mentor'].includes(role) && status === 'pending';
        const canDelete = (['super_admin', 'admin', 'mentor'].includes(role) && ['approved', 'rejected', 'active'].includes(status)) ||
            (role === 'parent' && status !== 'inactive');
        const canActive = ['super_admin', 'admin', 'parent', 'mentor'].includes(role) && status === 'inactive';

        if (!canApproveReject && !canDelete && !canActive) return null;

        return (
            <div className="flex items-center justify-end gap-3 w-full">
                {canApproveReject && (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            fullWidth={false}
                            className="border-primary! text-primary! hover:bg-primary! hover:text-white!"
                            onClick={() => {
                                onClose();
                                onReject && onReject(visitorId);
                            }}
                        >
                            Reject
                        </Button>
                        <Button
                            size="sm"
                            fullWidth={false}
                            className="!bg-primary! hover:!bg-primary! hover:!text-white!"
                            onClick={() => {
                                onClose();
                                onApprove && onApprove(visitorId);
                            }}
                        >
                            Approve
                        </Button>
                    </>
                )}

                {canDelete && (
                    <Button
                        variant="outline"
                        size="sm"
                        fullWidth={false}
                        className="border-danger! text-danger! hover:bg-danger! hover:text-white!"
                        onClick={() => {
                            onClose();
                            onDelete && onDelete(visitorId);
                        }}
                    >
                        Delete
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
                            visitor.status === 'Approved' && user?.role === 'warden' && (
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
                        <DetailRow icon={<Users size={16} />} label="Relationship" value={visitor.relationship} className="capitalize" />
                        {visitor.address && <DetailRow icon={<MapPin size={16} />} label="Address" value={visitor.address} />}
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
                                            avatarColor="text-gray-600"
                                        />
                                    );
                                })}
                            </div>
                        </DetailCard>
                    )}
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-4">
                    <DetailCard title="Quick Summary" subtitle="View the quick details">
                        <DetailRow icon={<User size={16} />} label="Full Name" value={visitorName} />
                        <DetailRow icon={<Phone size={16} />} label="Phone" value={visitor.phone} />
                        <DetailRow icon={<Users size={16} />} label="Relationship" value={visitor.relationship} className="capitalize" />
                        <DetailRow icon={<FileText size={16} />} label="ID Type" value={visitor.idProofType} />
                        <DetailRow icon={<Info size={16} />} label="Status" value={<StatusBadge status={visitor.status} />} />
                        <DetailRow icon={<Calendar size={16} />} label="Registered" value={formatDateTimeReadable(visitor.createdAt)} />
                    </DetailCard>

                    {linkedStudents.length > 0 && (
                        <DetailCard title="Linked Students" subtitle="Students associated with this visitor">
                            <div className="flex flex-col gap-3 mt-2">
                                {linkedStudents.map((student, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">{student.name}</p>
                                                    <p className="text-xs text-gray-500">{student.relationship || visitor.relationship}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {student.requestStatus && (
                                                    <StatusBadge status={student.requestStatus} />
                                                )}
                                                <div className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded shadow-sm border border-gray-100 shrink-0">
                                                    Room {student.roomNumber || 'N/A'}
                                                </div>
                                                {['super_admin', 'admin', 'mentor'].includes(user?.role) && student.requestStatus?.toLowerCase() === 'pending' && (
                                                    <Button
                                                        size="xs"
                                                        fullWidth={false}
                                                        className="!bg-primary! hover:!bg-primary! hover:!text-white! ml-2 text-[10px] px-2 py-1 h-auto"
                                                        onClick={() => {
                                                            onClose();
                                                            onApprove && onApprove(visitorId);
                                                        }}
                                                    >
                                                        Approve
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        {student.purpose && (
                                            <div className="mt-1 text-xs text-gray-600 bg-white p-2 rounded border border-gray-100">
                                                <span className="font-medium text-gray-700">Purpose: </span>{student.purpose}
                                            </div>
                                        )}
                                    </div>
                                ))}
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
        </Modal>
    );
}
