import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { getVisitDetails } from '@/services/visitor.service';
import DetailCard from '@/components/ui/DetailCard';
import DetailRow from '@/components/ui/DetailRow';
import TimelineStep from '@/components/ui/TimelineStep';
import ActivityLog from '@/components/ui/ActivityLog';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDateReadable, formatTime } from '@/utils/formatters';
import DetailsSkeletonLoader from '@/components/ui/DetailsSkeletonLoader';
import Button from '@/components/ui/Button';
import AddStudentToVisitModal from './AddStudentToVisitModal';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import { AlertCircle } from 'lucide-react';

export default function VisitDetailsModal({ isOpen, onClose, visitId, onUpdateVisit }) {
    const { user } = useAuthStore();
    const [visit, setVisit] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

    const fetchDetails = async (isBackground = false) => {
        if (!isOpen || !visitId) {
            setVisit(null);
            return;
        }

        if (!isBackground) setIsLoading(true);
        setError(null);

        try {
            const res = await getVisitDetails(visitId);
            const updatedVisit = res.data || res;
            setVisit(updatedVisit);
            
            if (isBackground && onUpdateVisit) {
                // If this is a background refresh after an action, update the parent table row
                const updatedStudentNames = updatedVisit.studentInformation?.map(s => s.studentName).join(', ');
                onUpdateVisit(visitId, { studentNames: updatedStudentNames });
            }
        } catch (err) {
            console.error("Failed to fetch visit details:", err);
            const serverMessage = err?.response?.data?.message || "Failed to load details.";
            setError(serverMessage);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [isOpen, visitId]);

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
            <Modal isOpen={isOpen} onClose={onClose} title="Access Restricted" maxWidth="max-w-md">
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center">
                        <AlertCircle size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Unable to Load Visit Details</h3>
                        <p className="text-[14px] text-text-secondary leading-relaxed">
                            {error}
                        </p>
                    </div>
                    <Button 
                        onClick={onClose}
                        className="mt-4 !bg-primary! hover:!bg-primary! hover:!text-white! px-8"
                        fullWidth={false}
                    >
                        Close
                    </Button>
                </div>
            </Modal>
        );
    }

    if (!visit) return null;

    const visitorName = visit.visitorInformation?.visitorName || 'Unknown';
    const studentNames = visit.quickSummary?.studentNames || visit.studentInformation?.[0]?.studentName || 'Unknown';
    const subtitle = `Visitor - ${studentNames}`;

    // Helper for rendering Timeline
    const renderTimeline = () => {
        let checkoutStatus = 'pending';
        let checkinStatus = 'pending';

        if (visit.quickSummary?.currentStatus === 'COMPLETED') {
            checkoutStatus = 'approved';
            checkinStatus = 'approved';
        } else if (visit.quickSummary?.currentStatus === 'CHECKED_IN') {
            checkinStatus = 'approved';
        } else if (visit.quickSummary?.currentStatus === 'PENDING') {
            checkinStatus = 'submitted';
        }

        const checkInDate = visit.visitInformation?.checkInTime;
        const checkOutDate = visit.visitInformation?.checkOutTime;



        // Filter events that belong in the visual timeline
        const visualTimelineEvents = (visit.timeline || []).filter(t => {
            const action = t.action || '';
            return action !== 'Visit Created' && action !== 'Visit Approved' && action !== 'Visit Rejected';
        });

        const hasCheckout = visualTimelineEvents.some(t => t.action?.toLowerCase().includes('check') && t.action?.toLowerCase().includes('out'));
        const hasCheckin = visualTimelineEvents.some(t => t.action?.toLowerCase().includes('check') && t.action?.toLowerCase().includes('in'));

        // Construct the steps array declaratively
        const steps = [
            // 1. Checked Out (Top placeholder if not completed)
            ...(!hasCheckout ? [{
                title: "Checked Out",
                subtitle: visit.wardenInformation?.name ? `${visit.wardenInformation.name} - Warden` : 'Warden',
                status: checkoutStatus,
                formattedDate: '--',
                badgeLabel: 'Pending',
                badgeColor: '#6B7280',
                badgeBg: '#F3F4F6',
                nodeColor: '#D1D5DB'
            }] : []),

            // 2. Map actual timeline events natively
            ...visualTimelineEvents.map(t => {
                let badgeLabel = 'Updated';
                let badgeColor = '#8B5CF6';
                let badgeBg = '#EDE9FE';
                let nodeColor = '#8B5CF6';
                let status = 'approved';

                const actionLower = (t.action || '').toLowerCase();

                if (actionLower.includes('check') && actionLower.includes('out')) {
                    badgeLabel = 'Completed';
                    badgeColor = '#3B82F6';
                    badgeBg = '#EFF6FF';
                    nodeColor = '#3B82F6';
                } else if (actionLower.includes('check') && actionLower.includes('in')) {
                    badgeLabel = 'Inside';
                    badgeColor = '#10B981';
                    badgeBg = '#D1FAE5';
                    nodeColor = '#10B981';
                }

                return {
                    title: t.action ? t.action.replace(/_/g, ' ') : 'Action',
                    subtitle: t.performedBy ? `${t.performedBy} - ${t.role || 'System'}` : 'System',
                    remarks: t.remarks,
                    status: status,
                    formattedDate: t.createdAt ? `${formatDateReadable(t.createdAt)} | ${formatTime(t.createdAt)}` : '--',
                    badgeLabel,
                    badgeColor,
                    badgeBg,
                    nodeColor
                };
            }),

            // 3. Checked In (Bottom placeholder if not checked in yet)
            ...(!hasCheckin ? [{
                title: "Checked In",
                subtitle: visit.wardenInformation?.name ? `${visit.wardenInformation.name} - Warden` : 'Warden',
                status: checkinStatus,
                formattedDate: '--',
                badgeLabel: checkinStatus === 'submitted' ? 'Waiting' : 'Pending',
                badgeColor: checkinStatus === 'submitted' ? '#F59E0B' : '#6B7280',
                badgeBg: checkinStatus === 'submitted' ? '#FEF3C7' : '#F3F4F6',
                nodeColor: '#D1D5DB'
            }] : [])
        ];

        return (
            <div className="relative pl-8 space-y-10 before:absolute before:top-4 before:bottom-4 before:left-[11px] before:w-0.5 before:bg-gray-200">
                {steps.map((step, idx) => (
                    <TimelineStep
                        key={idx}
                        title={step.title}
                        subtitle={step.subtitle}
                        status={step.status}
                        formattedDate={step.formattedDate}
                        badgeLabel={step.badgeLabel}
                        badgeColor={step.badgeColor}
                        badgeBg={step.badgeBg}
                        nodeColor={step.nodeColor}
                        avatarBg="#1E3A8A"
                        avatarColor="#FFFFFF"
                        remarks={step.remarks}
                    />
                ))}
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
        >
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 mt-4">

                {/* LEFT COLUMN */}
                <div className="space-y-6">
                    {/* Visitor Information */}
                    <DetailCard title="Visitor information" subtitle="Basic Details about the Visitor">
                        <div className="space-y-1">
                            <DetailRow label="Full Name" value={visit.visitorInformation?.visitorName} />
                            <DetailRow label="Phone No" value={visit.visitorInformation?.phone} />
                            <DetailRow label="Relation" value={visit.visitorInformation?.relationship} />
                            <DetailRow label="ID Proof Type" value={visit.visitorInformation?.idProofType} />
                            <DetailRow label="ID Number" value={visit.visitorInformation?.idProofNumber} />
                            <DetailRow label="Address" value={visit.visitorInformation?.address} />
                        </div>
                    </DetailCard>

                    {/* Visit Information */}
                    <DetailCard 
                        title="Visit Information" 
                        subtitle="Basic Details about the Visit"
                        headerAction={
                            visit.quickSummary?.currentStatus === 'CHECKED_IN' && user?.role === ROLES.WARDEN && (
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    fullWidth={false} 
                                    onClick={() => setIsAddStudentModalOpen(true)}
                                    className="text-xs px-3"
                                >
                                    Add Student
                                </Button>
                            )
                        }
                    >
                        <div className="space-y-1">
                            <DetailRow 
                                label="Visiting Student(s)" 
                                value={
                                    visit.studentInformation?.length > 0 
                                        ? visit.studentInformation.map(s => `${s.studentName} (Room ${s.roomNumber || s.roomNo || '--'})`).join(', ') 
                                        : studentNames
                                } 
                            />
                            <DetailRow label="Purpose of Visit" value={visit.visitInformation?.purpose} />
                            <DetailRow label="Check-In" value={visit.visitInformation?.checkInTime ? `${formatTime(visit.visitInformation.checkInTime)}, ${formatDateReadable(visit.visitInformation.checkInTime)}` : '--'} />
                            <DetailRow label="Check-Out" value={visit.visitInformation?.checkOutTime ? `${formatTime(visit.visitInformation.checkOutTime)}, ${formatDateReadable(visit.visitInformation.checkOutTime)}` : '--'} />
                            <DetailRow label="Duration" value={visit.visitInformation?.visitDuration || '--'} />
                            <DetailRow label="Status" value={<StatusBadge status={visit.quickSummary?.currentStatus} />} />
                        </div>
                    </DetailCard>

                    {/* Visit Progress / Timeline */}
                    <DetailCard title="Visit Information" subtitle="Basic Details about the Visit">
                        {renderTimeline()}
                    </DetailCard>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                    {/* Quick Summary */}
                    <DetailCard title="Quick Summary" subtitle="Quick summary of the visit">
                        <div className="space-y-1">
                            <DetailRow label="Visitor Name" value={visit.quickSummary?.visitorName} icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>} />
                            <DetailRow label="Student" value={visit.quickSummary?.studentNames} icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>} />
                            <DetailRow label="Status" value={<StatusBadge status={visit.quickSummary?.currentStatus} />} icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} />
                        </div>
                    </DetailCard>

                    {/* Recent Activity */}
                    <DetailCard title="Recent Activity" subtitle="Recent Activity about the Visitor">
                        <ActivityLog timeline={visit.timeline} />
                    </DetailCard>
                </div>
            </div>

            <AddStudentToVisitModal
                isOpen={isAddStudentModalOpen}
                onClose={() => setIsAddStudentModalOpen(false)}
                visit={visit}
                visitId={visitId}
                onSuccess={() => fetchDetails(true)}
            />
        </Modal>
    );
}
