import React from 'react';
import { Building2, Fingerprint, ToggleRight, MapPin, Phone, Mail } from 'lucide-react';
import InfoRow from '@/components/ui/InfoRow';
import Modal from '@/components/ui/Modal';

const BatchDetailView = ({ selectedBatchDetail, setView }) => {
    if (!selectedBatchDetail) return null;

    return (
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
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Basic Info</h3>
                        <p className="text-[11px] text-text-secondary mb-4">Basic contact information of the Batch</p>
                        <div className="space-y-1">
                            <InfoRow label={<><Fingerprint className="w-4 h-4 text-gray-400" /> Id</>}>{selectedBatchDetail.code}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Name</>}>{selectedBatchDetail.name}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Dept</>}>{selectedBatchDetail.departmentId?.name || selectedBatchDetail.departmentId || 'N/A'}</InfoRow>
                            <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                <span className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full ${selectedBatchDetail.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                    {selectedBatchDetail.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </InfoRow>
                        </div>
                    </div>

                    {selectedBatchDetail.address && (
                        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Address Information</h3>
                            <p className="text-[11px] text-text-secondary mb-4">Address information of the Batch</p>
                            <div className="space-y-1">
                                <InfoRow label={<><MapPin className="w-4 h-4 text-gray-400" /> Address</>}><span className="break-words whitespace-pre-wrap">{selectedBatchDetail.address}</span></InfoRow>
                            </div>
                        </div>
                    )}

                    {(selectedBatchDetail.phone || selectedBatchDetail.email) && (
                        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Contact Information</h3>
                            <p className="text-[11px] text-text-secondary mb-4">Contact information of the Batch</p>
                            <div className="space-y-1">
                                {selectedBatchDetail.phone && <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedBatchDetail.phone}</InfoRow>}
                                {selectedBatchDetail.email && <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>{selectedBatchDetail.email}</InfoRow>}
                            </div>
                        </div>
                    )}
                </div>

                <div className="md:col-span-5 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h3 className="text-sm font-semibold text-[#0A437A] mb-3 md:mb-4">Batch Summary</h3>
                    <div className="space-y-1">
                        <InfoRow label={<><Fingerprint className="w-4 h-4 text-gray-400" /> Id</>}>{selectedBatchDetail.code}</InfoRow>
                        <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Name</>}>{selectedBatchDetail.name}</InfoRow>
                        <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Dept</>}>{selectedBatchDetail.departmentId?.name || selectedBatchDetail.departmentId || 'N/A'}</InfoRow>
                        <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Org</>}>{selectedBatchDetail?.departmentId?.courseId?.organizationId?.name || 'N/A'}</InfoRow>
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
    );
};

export default BatchDetailView;
