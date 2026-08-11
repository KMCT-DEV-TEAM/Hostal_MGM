import React, { useState, useEffect } from 'react';
import { User, Activity, Building, Calendar, Mail, Phone, GraduationCap } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import mentorService from '@/services/mentor.service';
import { formatDateReadable } from '@/utils/formatters';
import DetailCard from '@/components/ui/DetailCard';
import DetailRow from '@/components/ui/DetailRow';
import StatusBadge from '@/components/ui/StatusBadge';
import ActivityLog from '@/components/ui/ActivityLog';
import DetailsSkeletonLoader from '@/components/ui/DetailsSkeletonLoader';
import Button from '@/components/ui/Button';
import MentorReleaseModal from './MentorReleaseModal';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

export default function MentorDetailsModal({
    mentor: initialMentor,
    onClose,
    onEdit,
    zIndex
}) {
    const role = useAuthStore(s => s.user?.role);
    const [mentor, setMentor] = useState(initialMentor);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('active');
    const [assignmentToRelease, setAssignmentToRelease] = useState(null);
    const [isReleasing, setIsReleasing] = useState(false);

    useEffect(() => {
        if (!initialMentor?._id || !role) return;

        let isMounted = true;
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const response = await mentorService.getMentorById(role, initialMentor._id);
                if (isMounted && response?.data) {
                    setMentor(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch mentor details", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDetails();

        return () => {
            isMounted = false;
        };
    }, [initialMentor?._id, role]);

    const handleRelease = async (reason) => {
        if (!assignmentToRelease) return;
        setIsReleasing(true);
        try {
            await mentorService.endMentorAssignment(assignmentToRelease, { reason });
            showSuccessToast('Mentor released successfully');
            // Refresh mentor details
            const response = await mentorService.getMentorById(role, mentor._id);
            if (response?.data) setMentor(response.data);
        } catch (error) {
            console.error("Failed to release mentor", error);
            showErrorToast(error?.response?.data?.message || error?.message || 'Failed to release mentor');
        } finally {
            setIsReleasing(false);
            setAssignmentToRelease(null);
        }
    };

    if (!mentor) return null;

    const isActive = mentor.isActive === true || mentor.isActive === 'true';

    const renderQuickSummary = () => (
        <DetailCard title="Quick Summary" subtitle="Quick Summary about the mentor" className="md:sticky md:top-0">
            <div className="space-y-1">
                <DetailRow
                    label="Mentor"
                    value={mentor.name || '--'}
                    icon={<User className="w-4 h-4 text-text-secondary" />}
                />
                <DetailRow
                    label="Status"
                    value={<StatusBadge status={isActive ? 'Active' : 'Inactive'} />}
                    icon={<Activity className="w-4 h-4 text-text-secondary" />}
                />
                {role === ROLES.SUPER_ADMIN && (
                    <DetailRow
                        label="Org Code"
                        value={mentor.organization?.code || '-----'}
                        icon={<Building className="w-4 h-4 text-text-secondary" />}
                    />
                )}
                <DetailRow
                    label="Joined Date"
                    value={formatDateReadable(mentor.createdAt)}
                    icon={<Calendar className="w-4 h-4 text-text-secondary" />}
                />
            </div>
        </DetailCard>
    );

    return (
        <>
            <Modal
                isOpen
                onClose={onClose}
                title="Mentor Details"
                subtitle="Detailed view of the mentor's profile"
                maxWidth="max-w-5xl"
                bottomSheetOnMobile={true}
                zIndex={zIndex || 50}
            >
                {loading ? (
                    <DetailsSkeletonLoader />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6 mt-4 md:items-start">
                        {/* LEFT COLUMN */}
                        <div className="space-y-6">

                            {/* 1. Mentor Information */}
                            <DetailCard title="Mentor Information" subtitle="Details about mentor">
                                <div className="space-y-1">
                                    <DetailRow
                                        label="Name"
                                        value={mentor.name}
                                        icon={<User className="w-4 h-4 text-text-secondary" />}
                                    />
                                    <DetailRow
                                        label="Email Address"
                                        value={mentor.email || '-----'}
                                        icon={<Mail className="w-4 h-4 text-text-secondary" />}
                                    />
                                    <DetailRow
                                        label="Phone Number"
                                        value={mentor.phone || '-----'}
                                        icon={<Phone className="w-4 h-4 text-text-secondary" />}
                                    />
                                    <DetailRow
                                        label="Specialization"
                                        value={mentor.specialization || 'Not Specified'}
                                        icon={<GraduationCap className="w-4 h-4 text-text-secondary" />}
                                    />
                                    {role === ROLES.SUPER_ADMIN && (
                                        <DetailRow
                                            label="Organization"
                                            value={mentor.organization?.name || 'Unassigned'}
                                            icon={<Building className="w-4 h-4 text-text-secondary" />}
                                        />
                                    )}
                                </div>
                            </DetailCard>

                            {/* 2. Quick Summary (MOBILE ONLY - ordered before recent assignments) */}
                            <div className="md:hidden">
                                {renderQuickSummary()}
                            </div>

                            {/* 3. Recent Activity */}
                            <DetailCard title="Recent Assignments" subtitle="Recent assignments of the mentor" className="flex flex-col">
                                <div className="flex items-center gap-6 border-b border-gray-200 mb-4 md:sticky md:top-0 bg-white z-10 pt-2 pb-1">
                                    <button
                                        onClick={() => setActiveTab('active')}
                                        className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'active' ? 'text-primary border-primary' : 'text-text-secondary border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                                    >
                                        Active
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'history' ? 'text-primary border-primary' : 'text-text-secondary border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                                    >
                                        History
                                    </button>
                                </div>

                                <div className="md:overflow-y-auto md:max-h-110 pr-2 no-scrollbar">

                                    <ActivityLog
                                        timeline={activeTab === 'active'
                                            ? (mentor.activeAssignments || []).map(t => ({
                                                action: `Assigned to ${t.batchId?.name || 'Batch'}`,
                                                remarks: t.remarks ? `Assigned: ${t.remarks}` : `Assigned to ${t.batchId?.name || 'Batch'}`,
                                                timestamp: t.assignedAt,
                                                actorRole: t.assignedBy?.name || 'Admin',
                                                meta: { label: 'Batch', value: t.batchId?.name || 'Unknown' },
                                                actionButton: (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        fullWidth={false}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAssignmentToRelease(t._id);
                                                        }}
                                                        className="text-danger hover:bg-danger/5 border border-danger text-[10px] py-1 px-3"
                                                    >
                                                        Release
                                                    </Button>
                                                )
                                            }))
                                            : (mentor.historyAssignments || []).map(t => ({
                                                action: t.status,
                                                remarks: t.remarks ? `${t.status}: ${t.remarks}` : t.status,
                                                timestamp: t.endedAt || t.assignedAt,
                                                actorRole: t.assignedBy?.name || 'Admin',
                                                meta: { label: 'Batch', value: t.batchId?.name || 'Unknown' }
                                            }))
                                        }
                                        defaultText={`No ${activeTab} assignments found.`}
                                    />
                                </div>
                            </DetailCard>
                        </div>

                        {/* RIGHT COLUMN (DESKTOP ONLY) */}
                        <div className="hidden md:block space-y-6">
                            {renderQuickSummary()}
                        </div>
                    </div>
                )}
            </Modal>

            <MentorReleaseModal
                isOpen={!!assignmentToRelease}
                onClose={() => setAssignmentToRelease(null)}
                onConfirm={handleRelease}
                isSubmitting={isReleasing}
            />
        </>
    );
}
