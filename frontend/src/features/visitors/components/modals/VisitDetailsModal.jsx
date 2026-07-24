import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { getVisitDetails } from '@/services/visitor.service';
import DetailCard from '@/components/ui/DetailCard';
import DetailRow from '@/components/ui/DetailRow';
import TimelineStep from '@/components/ui/TimelineStep';
import ActivityLog from '@/components/ui/ActivityLog';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDateReadable, formatTime } from '@/utils/formatters';

export default function VisitDetailsModal({ isOpen, onClose, visitId }) {
    const [visit, setVisit] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!isOpen || !visitId) {
                setVisit(null);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const res = await getVisitDetails(visitId);
                setVisit(res.data || res);
            } catch (err) {
                console.error("Failed to fetch visit details:", err);
                setError("Failed to load details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [isOpen, visitId]);

    if (!isOpen) return null;

    if (isLoading) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Loading Details..." maxWidth="max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 mt-4">
                    <div className="space-y-6">
                        <div className="h-64 bg-gray-100 animate-pulse rounded-xl"></div>
                        <div className="h-64 bg-gray-100 animate-pulse rounded-xl"></div>
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
                <div className="p-4 text-center text-danger font-medium">{error}</div>
            </Modal>
        );
    }

    if (!visit) return null;

    const visitorName = visit.visitorInformation?.visitorName || 'Unknown';
    const studentName = visit.studentInformation?.[0]?.studentName || 'Unknown';
    const subtitle = `Visitor - ${studentName}`;

    // Helper for rendering Timeline
    const renderTimeline = () => {
        let checkoutStatus = 'pending';
        let checkinStatus = 'pending';

        if (visit.quickSummary?.currentStatus === 'Completed') {
            checkoutStatus = 'approved';
            checkinStatus = 'approved';
        } else if (visit.quickSummary?.currentStatus === 'Checked In') {
            checkinStatus = 'approved';
        } else if (visit.quickSummary?.currentStatus === 'Pending') {
            checkinStatus = 'submitted';
        }

        const checkInDate = visit.visitInformation?.checkInTime;
        const checkOutDate = visit.visitInformation?.checkOutTime;

        return (
            <div className="relative pl-8 space-y-10 before:absolute before:top-4 before:bottom-4 before:left-[11px] before:w-0.5 before:bg-gray-200">
                <TimelineStep
                    title="Checked Out"
                    subtitle={visit.wardenInformation?.name ? `${visit.wardenInformation.name} - Warden` : 'Warden'}
                    status={checkoutStatus}
                    formattedDate={checkOutDate ? `${formatDateReadable(checkOutDate)} | ${formatTime(checkOutDate)}` : '--'}
                    badgeLabel={checkoutStatus === 'approved' ? 'Completed' : 'Pending'}
                    badgeColor={checkoutStatus === 'approved' ? '#3B82F6' : '#6B7280'}
                    badgeBg={checkoutStatus === 'approved' ? '#EFF6FF' : '#F3F4F6'}
                    nodeColor={checkoutStatus === 'approved' ? '#3B82F6' : '#D1D5DB'}
                    avatarBg="#1E3A8A"
                    avatarColor="#FFFFFF"
                />

                <TimelineStep
                    title="Checked In"
                    subtitle={visit.wardenInformation?.name ? `${visit.wardenInformation.name} - Warden` : 'Warden'}
                    status={checkinStatus}
                    formattedDate={checkInDate ? `${formatDateReadable(checkInDate)} | ${formatTime(checkInDate)}` : '--'}
                    badgeLabel={checkinStatus === 'approved' ? 'Inside' : (checkinStatus === 'submitted' ? 'Waiting' : 'Pending')}
                    badgeColor={checkinStatus === 'approved' ? '#10B981' : '#6B7280'}
                    badgeBg={checkinStatus === 'approved' ? '#D1FAE5' : '#F3F4F6'}
                    nodeColor={checkinStatus === 'approved' ? '#10B981' : '#D1D5DB'}
                    avatarBg="#1E3A8A"
                    avatarColor="#FFFFFF"
                />
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
                    <DetailCard title="Visit Information" subtitle="Basic Details about the Visit">
                        <div className="space-y-1">
                            <DetailRow label="Visiting Student" value={`${studentName} ${visit.studentInformation?.[0]?.roomNo ? `(Room ${visit.studentInformation?.[0]?.roomNo})` : ''}`} />
                            <DetailRow label="Room No" value={visit.studentInformation?.[0]?.roomNo} />
                            <DetailRow label="Purpose of Visit" value={visit.visitInformation?.purpose} />
                            <DetailRow label="Check-In" value={visit.visitInformation?.checkInTime ? `${formatTime(visit.visitInformation.checkInTime)}, ${formatDateReadable(visit.visitInformation.checkInTime)}` : '--'} />
                            <DetailRow label="Check-Out" value={visit.visitInformation?.checkOutTime ? `${formatTime(visit.visitInformation.checkOutTime)}, ${formatDateReadable(visit.visitInformation.checkOutTime)}` : '--'} />
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
        </Modal>
    );
}
