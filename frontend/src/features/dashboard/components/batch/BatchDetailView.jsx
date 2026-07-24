import React, { useState } from 'react';
import { Building2, Fingerprint, ToggleRight, MapPin, Phone, Mail, Calendar, UserCircle2 } from 'lucide-react';
import InfoRow from '@/components/ui/InfoRow';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useBatchMentorAssignment } from '@/features/dashboard/hooks/mentor/useBatchMentorAssignment';
import MentorAssignmentModal from './MentorAssignmentModal';

const BatchDetailView = ({ selectedBatchDetail, setView }) => {
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

    // Fetch active assignment for this batch
    const { activeAssignment, loading: assignmentLoading, refetch } = useBatchMentorAssignment(selectedBatchDetail?._id || selectedBatchDetail?.id);

    if (!selectedBatchDetail) return null;

    // Extract organization ID safely
    const orgId = selectedBatchDetail?.departmentId?.courseId?.organizationId?._id
        || selectedBatchDetail?.departmentId?.courseId?.organizationId
        || selectedBatchDetail?.organizationId;

    return (
        <>
            <Modal
                bottomSheetOnMobile={true}
                isOpen={true}
                onClose={() => setView('list')}
                maxWidth="max-w-5xl"
                title={selectedBatchDetail.name}
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
                                <InfoRow label={<><Fingerprint className="w-4 h-4 text-gray-400" /> Id</>}>{selectedBatchDetail.code}</InfoRow>
                                <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Name</>}>{selectedBatchDetail.name}</InfoRow>
                                <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Dept</>}>{selectedBatchDetail.departmentId?.name || selectedBatchDetail.departmentId || 'N/A'}</InfoRow>
                                <InfoRow label={<><Calendar className="w-4 h-4 text-gray-400" /> Start Year</>}>{selectedBatchDetail.startYear || 'N/A'}</InfoRow>
                                <InfoRow label={<><Calendar className="w-4 h-4 text-gray-400" /> End Year</>}>{selectedBatchDetail.endYear || 'N/A'}</InfoRow>
                                <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                    <span className="flex items-center">
                                        <span className={`w-2 h-2 rounded-full ${selectedBatchDetail.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                        {selectedBatchDetail.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </InfoRow>
                            </div>
                        </div>

                        {/* Mentor Details Section */}
                        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm relative">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-primary mb-1">Mentor Details</h3>
                                    <p className="text-[11px] text-text-secondary">Assigned mentor for this batch</p>
                                </div>
                                <Button
                                    variant={activeAssignment ? 'outline' : 'primary'}
                                    size="sm"
                                    fullWidth={false}
                                    onClick={() => setIsAssignmentModalOpen(true)}
                                    disabled={assignmentLoading}
                                >
                                    {activeAssignment ? 'Transfer Mentor' : 'Assign Mentor'}
                                </Button>
                            </div>

                            {assignmentLoading ? (
                                <div className="text-xs text-gray-500 py-2">Loading mentor details...</div>
                            ) : activeAssignment && activeAssignment.mentorId ? (
                                <div className="space-y-2 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                            <UserCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900">{activeAssignment.mentorId.name || 'Unknown'}</h4>
                                            <p className="text-xs text-gray-500">Active Mentor</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                        {activeAssignment.mentorId.email && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{activeAssignment.mentorId.email}</span>
                                            </div>
                                        )}
                                        {activeAssignment.mentorId.phone && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{activeAssignment.mentorId.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded-lg bg-gray-50/50 mt-2">
                                    No mentor is currently assigned to this batch.
                                </div>
                            )}
                        </div>

                        {selectedBatchDetail.address && (
                            <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-semibold text-primary mb-1">Address Information</h3>
                                <p className="text-[11px] text-text-secondary mb-4">Address information of the Batch</p>
                                <div className="space-y-1">
                                    <InfoRow label={<><MapPin className="w-4 h-4 text-gray-400" /> Address</>}><span className="break-words whitespace-pre-wrap">{selectedBatchDetail.address}</span></InfoRow>
                                </div>
                            </div>
                        )}

                        {(selectedBatchDetail.phone || selectedBatchDetail.email) && (
                            <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-semibold text-primary mb-1">Contact Information</h3>
                                <p className="text-[11px] text-text-secondary mb-4">Contact information of the Batch</p>
                                <div className="space-y-1">
                                    {selectedBatchDetail.phone && <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedBatchDetail.phone}</InfoRow>}
                                    {selectedBatchDetail.email && <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>{selectedBatchDetail.email}</InfoRow>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-5 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h3 className="text-sm font-semibold text-primary mb-3 md:mb-4">Batch Summary</h3>
                        <div className="space-y-1">
                            <InfoRow label={<><Fingerprint className="w-4 h-4 text-gray-400" /> Id</>}>{selectedBatchDetail.code}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Name</>}>{selectedBatchDetail.name}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Dept</>}>{selectedBatchDetail.departmentId?.name || selectedBatchDetail.departmentId || 'N/A'}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Org</>}>{selectedBatchDetail?.departmentId?.courseId?.organizationId?.name || 'N/A'}</InfoRow>
                            <InfoRow label={<><Calendar className="w-4 h-4 text-gray-400" /> Start Year</>}>{selectedBatchDetail.startYear || 'N/A'}</InfoRow>
                            <InfoRow label={<><Calendar className="w-4 h-4 text-gray-400" /> End Year</>}>{selectedBatchDetail.endYear || 'N/A'}</InfoRow>
                            <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                <span className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full ${selectedBatchDetail.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                    {selectedBatchDetail.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </InfoRow>
                            {selectedBatchDetail.phone && <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedBatchDetail.phone}</InfoRow>}
                            {selectedBatchDetail.email && <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>{selectedBatchDetail.email}</InfoRow>}
                        </div>
                    </div>
                </div>
            </Modal>

            <MentorAssignmentModal
                isOpen={isAssignmentModalOpen}
                onClose={() => setIsAssignmentModalOpen(false)}
                batchId={selectedBatchDetail?._id || selectedBatchDetail?.id}
                organizationId={orgId}
                existingAssignmentId={activeAssignment?._id}
                onSuccess={() => {
                    refetch();
                }}
            />
        </>
    );
};

export default BatchDetailView;
