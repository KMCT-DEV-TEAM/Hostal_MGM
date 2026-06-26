import React from 'react';
import { X, Wrench, Mail, Phone, Building2, ToggleRight, Fingerprint } from 'lucide-react';
import InfoRow from '@/components/ui/InfoRow';

const MaintenanceStaffDetailView = ({ selectedStaffDetail, setView }) => {
    if (!selectedStaffDetail) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-5xl w-full p-5 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Close Button */}
                <button
                    onClick={() => setView('list')}
                    className="absolute top-6 right-6 p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                    <X size={14} />
                </button>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 bg-[#0A437A] rounded-lg flex items-center justify-center text-white">
                            <Wrench size={18} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{selectedStaffDetail.name}</h1>
                    </div>
                    <p className="text-gray-400 text-sm ml-11">Maintenance Staff Details</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    {/* Main Content Area */}
                    <div className="md:col-span-7 space-y-6">
                        {/* Basic Info Section */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Basic Info</h3>
                            <p className="text-[11px] text-text-secondary mb-4">Basic contact information of the Maintenance Staff</p>
                            <div className="space-y-1">
                                <InfoRow label={<><Wrench className="w-4 h-4 text-gray-400" /> Name</>}>{selectedStaffDetail.name}</InfoRow>
                                <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>{selectedStaffDetail.email || 'N/A'}</InfoRow>
                                <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedStaffDetail.phone ? `+91 ${selectedStaffDetail.phone}` : 'N/A'}</InfoRow>
                                <InfoRow label={<><Fingerprint className="w-4 h-4 text-gray-400" /> Spec.</>}>{selectedStaffDetail.specialization || 'N/A'}</InfoRow>
                                {selectedStaffDetail.assignedTask && (
                                    <InfoRow label={<><Fingerprint className="w-4 h-4 text-gray-400" /> Task</>}>{selectedStaffDetail.assignedTask}</InfoRow>
                                )}
                            </div>
                        </div>
                        {/* Organization Info Section */}
                        {selectedStaffDetail.organizationId && typeof selectedStaffDetail.organizationId === 'object' && selectedStaffDetail.organizationId.name && (
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Organization Details</h3>
                                <p className="text-[11px] text-text-secondary mb-4">Assigned organization for this staff</p>
                                <div className="space-y-1">
                                    <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Org Name</>}>{selectedStaffDetail.organizationId.name}</InfoRow>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-4">Staff Summary</h3>
                        <div className="space-y-1">
                            <InfoRow label={<><Wrench className="w-4 h-4 text-gray-400" /> Name</>}>{selectedStaffDetail.name}</InfoRow>
                            <InfoRow label={<><Fingerprint className="w-4 h-4 text-gray-400" /> Spec.</>}>{selectedStaffDetail.specialization || 'N/A'}</InfoRow>
                            <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                <span className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full ${selectedStaffDetail.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                    {selectedStaffDetail.isActive ? "Active" : "Inactive"}
                                </span>
                            </InfoRow>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceStaffDetailView;
