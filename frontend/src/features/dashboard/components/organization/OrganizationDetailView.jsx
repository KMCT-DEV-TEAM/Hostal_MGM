import React from 'react';
import { X, Building2, Fingerprint, ToggleRight, MapPin, Phone, Mail, Users } from 'lucide-react';
import InfoRow from '@/components/ui/InfoRow';

const OrganizationDetailView = ({ selectedOrganizationDetail, setView }) => {
    if (!selectedOrganizationDetail) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-end md:items-center justify-center p-0 md:p-4 z-50">
            <div className="bg-white rounded-2xl max-w-5xl w-full p-5 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Close Button */}
                <button
                    onClick={() => setView('list')}
                    className="absolute top-6 right-6 p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                    <X size={14} />
                </button>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#0A437A] rounded-xl flex items-center justify-center text-white">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{selectedOrganizationDetail.name}</h1>
                            <p className="text-gray-400 text-sm">Organization - {selectedOrganizationDetail.hostelCount || 0} Hostels</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Basic Info</h3>
                            <p className="text-[11px] text-text-secondary mb-4">Basic contact information of the Organization</p>
                            <div className="space-y-1">
                                <InfoRow label={<><Fingerprint className="w-4 h-4 text-gray-400" /> Id</>}>{selectedOrganizationDetail.code}</InfoRow>
                                <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Name</>}>{selectedOrganizationDetail.name}</InfoRow>
                                <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                    <span className="flex items-center">
                                        <span className={`w-2 h-2 rounded-full ${selectedOrganizationDetail.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                        {selectedOrganizationDetail.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </InfoRow>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Address Information</h3>
                            <p className="text-[11px] text-text-secondary mb-4">Address information of the Organization</p>
                            <div className="p-3 rounded-lg border border-gray-100 flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                <div className="text-xs font-medium text-black leading-relaxed">
                                    {selectedOrganizationDetail.address ? (
                                        selectedOrganizationDetail.address.split(',').map((line, index) => (
                                            <div key={index}>{line.trim()}</div>
                                        ))
                                    ) : (
                                        <span className="text-gray-500 italic">No address provided</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Contact Information</h3>
                            <p className="text-[11px] text-text-secondary mb-4">Contact information of the Organization</p>
                            <div className="space-y-1">
                                <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedOrganizationDetail.phone}</InfoRow>
                                <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>{selectedOrganizationDetail.email}</InfoRow>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-4">Organization Summary</h3>
                        <div className="space-y-1">
                            <InfoRow label={<><Fingerprint className="w-4 h-4 text-gray-400" /> Id</>}>{selectedOrganizationDetail.code}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Name</>}>{selectedOrganizationDetail.name}</InfoRow>
                            <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                <span className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full ${selectedOrganizationDetail.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                    {selectedOrganizationDetail.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </InfoRow>
                            <InfoRow label={<><Users className="w-4 h-4 text-gray-400" /> Students</>}>{selectedOrganizationDetail.studentsCount || 0}</InfoRow>
                            <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedOrganizationDetail.phone}</InfoRow>
                            <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>{selectedOrganizationDetail.email}</InfoRow>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizationDetailView;
