import React, { useState, useEffect } from 'react';
import { Building2, Fingerprint, ToggleRight, MapPin, Phone, Mail, Calendar, UserCircle2 } from 'lucide-react';
import InfoRow from '@/components/ui/InfoRow';
import DetailCard from '@/components/ui/DetailCard';
import DetailRow from '@/components/ui/DetailRow';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import MentorAssignmentModal from './MentorAssignmentModal';
import BatchService from '@/services/batch.service';
import DetailsSkeletonLoader from '@/components/ui/DetailsSkeletonLoader';

const BatchDetailView = ({ selectedBatchDetail, setView }) => {
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchBatch = async () => {
        if (!selectedBatchDetail) return;
        try {
            setLoading(true);
            const id = selectedBatchDetail._id || selectedBatchDetail.id;
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

    const displayBatch = batch || selectedBatchDetail;
    const activeAssignment = displayBatch.activeMentor || null;
    const assignmentLoading = loading;

    // Extract organization ID safely
    const orgId = displayBatch?.departmentId?.courseId?.organizationId?._id
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
                        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-primary mb-1">Basic Info</h3>
                            <p className="text-[11px] text-text-secondary mb-4">Basic contact information of the Batch</p>
                            <div className="space-y-1">
                                <InfoRow label={<><Fingerprint className="w-4 h-4 text-text-secondary" /> Id</>}>{displayBatch.code}</InfoRow>
                                <InfoRow label={<><Building2 className="w-4 h-4 text-text-secondary" /> Name</>}>{displayBatch.name}</InfoRow>
                                <InfoRow label={<><Building2 className="w-4 h-4 text-text-secondary" /> Dept</>}>{displayBatch.departmentId?.name || displayBatch.departmentId || 'N/A'}</InfoRow>
                                <InfoRow label={<><Calendar className="w-4 h-4 text-text-secondary" /> Start Year</>}>{displayBatch.startYear || 'N/A'}</InfoRow>
                                <InfoRow label={<><Calendar className="w-4 h-4 text-text-secondary" /> End Year</>}>{displayBatch.endYear || 'N/A'}</InfoRow>
                                <InfoRow label={<><ToggleRight className="w-4 h-4 text-text-secondary" /> Status</>}>
                                    <span className="flex items-center">
                                        <span className={`w-2 h-2 rounded-full ${displayBatch.isActive ? 'bg-success' : 'bg-danger'} mr-2`}></span>
                                        {displayBatch.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </InfoRow>
                            </div>
                        </div>

                        {/* Mentor Details Section */}
                        <DetailCard
                            title="Mentor Details"
                            subtitle="Assigned mentor for this batch"
                            headerAction={
                                <Button
                                    variant={'primary'}
                                    size="sm"
                                    fullWidth={false}
                                    onClick={() => setIsAssignmentModalOpen(true)}
                                    disabled={assignmentLoading}
                                >
                                    {activeAssignment ? 'Transfer Mentor' : 'Assign Mentor'}
                                </Button>
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
                            <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-semibold text-primary mb-1">Address Information</h3>
                                <p className="text-[11px] text-text-secondary mb-4">Address information of the Batch</p>
                                <div className="space-y-1">
                                    <InfoRow label={<><MapPin className="w-4 h-4 text-text-secondary" /> Address</>}><span className="break-words whitespace-pre-wrap">{displayBatch.address}</span></InfoRow>
                                </div>
                            </div>
                        )}

                        {(displayBatch.phone || displayBatch.email) && (
                            <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-semibold text-primary mb-1">Contact Information</h3>
                                <p className="text-[11px] text-text-secondary mb-4">Contact information of the Batch</p>
                                <div className="space-y-1">
                                    {displayBatch.phone && <InfoRow label={<><Phone className="w-4 h-4 text-text-secondary" /> Phone</>}>{displayBatch.phone}</InfoRow>}
                                    {displayBatch.email && <InfoRow label={<><Mail className="w-4 h-4 text-text-secondary" /> Email</>}>{displayBatch.email}</InfoRow>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-5 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h3 className="text-sm font-semibold text-primary mb-3 md:mb-4">Batch Summary</h3>
                        <div className="space-y-1">
                            <InfoRow label={<><Fingerprint className="w-4 h-4 text-text-secondary" /> Id</>}>{displayBatch.code}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-text-secondary" /> Name</>}>{displayBatch.name}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-text-secondary" /> Dept</>}>{displayBatch.departmentId?.name || displayBatch.departmentId || 'N/A'}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-text-secondary" /> Org</>}>{displayBatch?.departmentId?.courseId?.organizationId?.name || 'N/A'}</InfoRow>
                            <InfoRow label={<><Calendar className="w-4 h-4 text-text-secondary" /> Start Year</>}>{displayBatch.startYear || 'N/A'}</InfoRow>
                            <InfoRow label={<><Calendar className="w-4 h-4 text-text-secondary" /> End Year</>}>{displayBatch.endYear || 'N/A'}</InfoRow>
                            <InfoRow label={<><ToggleRight className="w-4 h-4 text-text-secondary" /> Status</>}>
                                <span className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full ${displayBatch.isActive ? 'bg-success' : 'bg-danger'} mr-2`}></span>
                                    {displayBatch.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </InfoRow>
                            {displayBatch.phone && <InfoRow label={<><Phone className="w-4 h-4 text-text-secondary" /> Phone</>}>{displayBatch.phone}</InfoRow>}
                            {displayBatch.email && <InfoRow label={<><Mail className="w-4 h-4 text-text-secondary" /> Email</>}>{displayBatch.email}</InfoRow>}
                        </div>
                    </div>
                </div>
            </Modal>

            <MentorAssignmentModal
                isOpen={isAssignmentModalOpen}
                onClose={() => setIsAssignmentModalOpen(false)}
                batchId={displayBatch?._id || displayBatch?.id}
                organizationId={orgId}
                existingAssignmentId={activeAssignment?.assignmentId}
                onSuccess={() => {
                    fetchBatch();
                }}
            />
        </>
    );
};

export default BatchDetailView;
