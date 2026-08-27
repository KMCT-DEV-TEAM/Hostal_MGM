import React, { useState, useEffect } from 'react';
import { Building2, Fingerprint, ToggleRight, MapPin, Phone, Mail, Calendar, UserCircleIcon, UserCircle2 } from 'lucide-react';
import DetailCard from '@/components/ui/DetailCard';
import DetailRow from '@/components/ui/DetailRow';
import ActivityLog from '@/components/ui/ActivityLog';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import MentorAssignmentModal from './MentorAssignmentModal';
import MentorDetailsModal from '../mentor/MentorDetailsModal';
import MentorReleaseModal from '../mentor/MentorReleaseModal';
import BatchService from '@/services/batch.service';
import { endMentorAssignment } from '@/services/mentor.service';
import DetailsSkeletonLoader from '@/components/ui/DetailsSkeletonLoader';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

const BatchDetailView = ({ selectedBatchDetail, setView }) => {
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [selectedMentorForModal, setSelectedMentorForModal] = useState(null);
    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isReleasing, setIsReleasing] = useState(false);
    const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
     
    const fetchBatch = async () => {
        if (!selectedBatchDetail) return;
        try {
            setLoading(true);
            const id = selectedBatchDetail.id;
            const response = await BatchService.getBatchById(id);
            setBatch(response.data || response);
        } catch (err) {
            console.error("Failed to fetch batch details:", err);
            // Fallback to selectedBatchDetail if fetch fails
            setBatch(selectedBatchDetail);
        } finally {
            setLoading(false);
        }
    };

    const handleReleaseMentor = async (reason) => {
        if (!displayBatch?.activeMentor?.assignmentId) return;
        setIsReleasing(true);
        try {
            await endMentorAssignment(displayBatch.activeMentor.assignmentId, { reason });
            showSuccessToast('Mentor released successfully');
            await fetchBatch();
        } catch (error) {
            console.error('Failed to release mentor', error);
            showErrorToast(error?.response?.data?.message || error?.message || 'Failed to release mentor');
        } finally {
            setIsReleasing(false);
            setIsReleaseModalOpen(false);
        }
    };

    // Fetch batch details from API
    useEffect(() => {
        fetchBatch();
    }, [selectedBatchDetail]);

    if (!selectedBatchDetail) return null;

    if (loading) {
        return (
            <Modal
                bottomSheetOnMobile={true}
                isOpen={true}
                onClose={() => setView('list')}
                maxWidth="max-w-5xl"
                title="Loading Details..."
                icon={<Building2 size={24} />}
            >
                <DetailsSkeletonLoader />
            </Modal>
        );
    }

    const displayBatch = batch;
    const activeAssignment = displayBatch.activeMentor || null;
    const assignmentLoading = loading;

    // Extract organization ID safely
    const orgId = displayBatch?.department?.course?.organization?.id
        || displayBatch?.departmentId?.courseId?.organizationId
        || displayBatch?.organizationId;

    return (
        <>
            <Modal
                bottomSheetOnMobile={true}
                isOpen={true}
                onClose={() => setView('list')}
                maxWidth="max-w-5xl"
                title={displayBatch.name}
                subtitle="Students"
                icon={<Building2 size={24} />}
            >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    {/* Main Content Area */}
                    <div className="md:col-span-7 space-y-4 md:space-y-6">
                        {/* Basic Info */}
                        <DetailCard title="Basic Info" subtitle="Basic information of the Batch">
                            <div className="space-y-1">
                                <DetailRow label="Id" value={displayBatch.code} icon={<Fingerprint className="w-4 h-4 text-text-secondary" />} />
                                <DetailRow label="Name" value={displayBatch.name || 'Ajmal'} icon={<Building2 className="w-4 h-4 text-text-secondary" />} />
                                <DetailRow label="Dept" value={displayBatch.departmentId?.name || displayBatch.departmentId || 'N/A'} icon={<Building2 className="w-4 h-4 text-text-secondary" />} />
                                <DetailRow label="Start Year" value={displayBatch.startYear || 'N/A'} icon={<Calendar className="w-4 h-4 text-text-secondary" />} />
                                <DetailRow label="End Year" value={displayBatch.endYear || 'N/A'} icon={<Calendar className="w-4 h-4 text-text-secondary" />} />
                                <DetailRow label="Status" value={
                                    <span className="flex items-center">
                                        <span className={`w-2 h-2 rounded-full ${displayBatch.isActive ? 'bg-success' : 'bg-danger'} mr-2`}></span>
                                        {displayBatch.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                } icon={<ToggleRight className="w-4 h-4 text-text-secondary" />} />
                            </div>
                        </DetailCard>

                        {/* Mentor Details Section */}
                        <DetailCard
                            title="Mentor Details"
                            subtitle="Assigned mentor for this batch"
                            headerAction={
                                <div className="flex items-center gap-2">
                                    {activeAssignment && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            fullWidth={false}
                                            onClick={() => setIsReleaseModalOpen(true)}
                                            isLoading={isReleasing}
                                            disabled={assignmentLoading || isReleasing}
                                            className="text-danger hover:bg-danger/5 border border-danger"
                                        >
                                            Release
                                        </Button>
                                    )}
                                    <Button
                                        variant={'primary'}
                                        size="sm"
                                        fullWidth={false}
                                        onClick={() => setIsAssignmentModalOpen(true)}
                                        disabled={assignmentLoading || isReleasing}
                                    >
                                        {activeAssignment ? 'Transfer Mentor' : 'Assign Mentor'}
                                    </Button>
                                </div>
                            }
                        >
                            {assignmentLoading ? (
                                <div className="text-xs text-text-secondary py-2">Loading mentor details...</div>
                            ) : activeAssignment && activeAssignment.mentor ? (
                                <div className="space-y-1">
                                    <DetailRow
                                        label="Name"
                                        value={activeAssignment.mentor.name || 'Unknown'}
                                        icon={<UserCircle2 className="w-4 h-4 text-text-secondary" />}
                                    />
                                    {activeAssignment.mentor.email && (
                                        <DetailRow
                                            label="Email"
                                            value={activeAssignment.mentor.email}
                                            icon={<Mail className="w-4 h-4 text-text-secondary" />}
                                        />
                                    )}
                                    {activeAssignment.mentor.phone && (
                                        <DetailRow
                                            label="Phone"
                                            value={activeAssignment.mentor.phone}
                                            icon={<Phone className="w-4 h-4 text-text-secondary" />}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="text-xs text-text-secondary py-4 text-center border border-dashed border-gray-200 rounded-lg bg-gray-50/50 mt-2">
                                    No mentor is currently assigned to this batch.
                                </div>
                            )}
                        </DetailCard>

                        {displayBatch.address && (
                            <DetailCard title="Address Information" subtitle="Address information of the Batch">
                                <div className="space-y-1">
                                    <DetailRow label="Address" value={<span className="break-words whitespace-pre-wrap">{displayBatch.address}</span>} icon={<MapPin className="w-4 h-4 text-text-secondary" />} />
                                </div>
                            </DetailCard>
                        )}

                        {(displayBatch.phone || displayBatch.email) && (
                            <DetailCard title="Contact Information" subtitle="Contact information of the Batch">
                                <div className="space-y-1">
                                    {displayBatch.phone && <DetailRow label="Phone" value={displayBatch.phone} icon={<Phone className="w-4 h-4 text-text-secondary" />} />}
                                    {displayBatch.email && <DetailRow label="Email" value={displayBatch.email} icon={<Mail className="w-4 h-4 text-text-secondary" />} />}
                                </div>
                            </DetailCard>
                        )}
                    </div>

                    <div className="md:col-span-5 space-y-4 md:space-y-6 h-fit">
                        <DetailCard title="Batch Summary" subtitle="Key metrics and details">
                            <div className="space-y-1">
                                <DetailRow label="Id" value={displayBatch.code} icon={<Fingerprint className="w-4 h-4 text-text-secondary" />} />
                                <DetailRow label="Name" value={displayBatch.name} icon={<Building2 className="w-4 h-4 text-text-secondary" />} />
                                <DetailRow label="Dept" value={displayBatch.departmentId?.name || displayBatch.departmentId || 'N/A'} icon={<Building2 className="w-4 h-4 text-text-secondary" />} />
                                <DetailRow label="Org" value={displayBatch?.departmentId?.courseId?.organizationId?.name || 'N/A'} icon={<Building2 className="w-4 h-4 text-text-secondary" />} />
                                <DetailRow label="Start Year" value={displayBatch.startYear || 'N/A'} icon={<Calendar className="w-4 h-4 text-text-secondary" />} />
                                <DetailRow label="End Year" value={displayBatch.endYear || 'N/A'} icon={<Calendar className="w-4 h-4 text-text-secondary" />} />
                                <DetailRow label="Status" value={
                                    <span className="flex items-center">
                                        <span className={`w-2 h-2 rounded-full ${displayBatch.isActive ? 'bg-success' : 'bg-danger'} mr-2`}></span>
                                        {displayBatch.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                } icon={<ToggleRight className="w-4 h-4 text-text-secondary" />} />
                                {displayBatch.phone && <DetailRow label="Phone" value={displayBatch.phone} icon={<Phone className="w-4 h-4 text-text-secondary" />} />}
                                {displayBatch.email && <DetailRow label="Email" value={displayBatch.email} icon={<Mail className="w-4 h-4 text-text-secondary" />} />}
                            </div>
                        </DetailCard>

                        <DetailCard title="Recent Mentors" subtitle="Historical mentor assignments">
                            <ActivityLog
                                timeline={(displayBatch.recentMentors || []).map(m => ({
                                    remarks: m.remarks ? `${m.status}: ${m.remarks}` : m.status,
                                    meta: {
                                        label: 'Mentor',
                                        value: m.mentor?.name || 'Unknown'
                                    },
                                    timestamp: m.endedAt || m.assignedAt,
                                    actorRole: m.assignedBy?.name || 'System',
                                    onClick: m.mentor ? () => setSelectedMentorForModal(m.mentor) : undefined
                                }))}
                                defaultText="No previous mentors found."
                            />
                        </DetailCard>
                    </div>
                </div>
            </Modal>

            <MentorAssignmentModal
                isOpen={isAssignmentModalOpen}
                onClose={() => setIsAssignmentModalOpen(false)}
                batchId={displayBatch?.id}
                organizationId={orgId}
                existingAssignmentId={activeAssignment?.assignmentId}
                onSuccess={() => {
                    fetchBatch();
                }}
            />

            {selectedMentorForModal && (
                <MentorDetailsModal
                    mentor={{ id: typeof selectedMentorForModal === 'string' ? selectedMentorForModal : selectedMentorForModal.id }}
                    onClose={() => setSelectedMentorForModal(null)}
                    zIndex={60}
                />
            )}

            <MentorReleaseModal
                isOpen={isReleaseModalOpen}
                onClose={() => setIsReleaseModalOpen(false)}
                onConfirm={handleReleaseMentor}
                isSubmitting={isReleasing}
            />
        </>
    );
};

export default BatchDetailView;
