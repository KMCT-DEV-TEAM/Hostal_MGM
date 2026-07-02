import React from 'react';
import { Wrench, Mail, Phone, Building2, ToggleRight, Fingerprint } from 'lucide-react';
import InfoRow from '@/components/ui/InfoRow';
import Modal from '@/components/ui/Modal';

const MaintenanceStaffDetailView = ({ selectedStaffDetail, setView }) => {
    if (!selectedStaffDetail) return null;

    return (
        <Modal
            bottomSheetOnMobile={true}
            isOpen={true}
            onClose={() => setView('list')}
            maxWidth="max-w-5xl"
            title={selectedStaffDetail.name}
            subtitle="Maintenance Staff Details"
            icon={<Wrench size={24} />}
        >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Main Content Area */}
                <div className="md:col-span-7 space-y-4 md:space-y-6">
                    {/* Basic Info Section */}
                    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Basic Info</h3>
                        <p className="text-[11px] text-text-secondary mb-4">Basic contact information of the Maintenance Staff</p>
                        <div className="space-y-1">
                            <InfoRow label={<><Wrench className="w-4 h-4 text-gray-400" /> Name</>}>{selectedStaffDetail.name}</InfoRow>
                            <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>{selectedStaffDetail.email || 'N/A'}</InfoRow>
                            <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedStaffDetail.phone ? +91 : 'N/A'}</InfoRow>
                            <InfoRow label={<><Fingerprint className="w-4 h-4 text-gray-400" /> Spec.</>}>{selectedStaffDetail.specialization || 'N/A'}</InfoRow>
                            {selectedStaffDetail.assignedTask && (
                                <InfoRow label={<><Fingerprint className="w-4 h-4 text-gray-400" /> Task</>}>{selectedStaffDetail.assignedTask}</InfoRow>
                            )}
                        </div>
                    </div>
                    {/* Organization Info Section */}
                    {selectedStaffDetail.organizationId && typeof selectedStaffDetail.organizationId === 'object' && selectedStaffDetail.organizationId.name && (
                        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Organization Details</h3>
                            <p className="text-[11px] text-text-secondary mb-4">Assigned organization for this staff</p>
                            <div className="space-y-1">
                                <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Org Name</>}>{selectedStaffDetail.organizationId.name}</InfoRow>
                            </div>
                        </div>
                    )}
                </div>

                <div className="md:col-span-5 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h3 className="text-sm font-semibold text-[#0A437A] mb-3 md:mb-4">Staff Summary</h3>
                    <div className="space-y-1">
                        <InfoRow label={<><Wrench className="w-4 h-4 text-gray-400" /> Name</>}>{selectedStaffDetail.name}</InfoRow>
                        <InfoRow label={<><Fingerprint className="w-4 h-4 text-gray-400" /> Spec.</>}>{selectedStaffDetail.specialization || 'N/A'}</InfoRow>
                        <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                            <span className="flex items-center">
                                <span className={"w-2 h-2 rounded-full  mr-2"}></span>
                                {selectedStaffDetail.isActive ? "Active" : "Inactive"}
                            </span>
                        </InfoRow>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default MaintenanceStaffDetailView;
