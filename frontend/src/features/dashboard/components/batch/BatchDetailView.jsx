import React from 'react';
import { X, Building2, Fingerprint, ToggleRight, MapPin, Phone, Mail } from 'lucide-react';
import InfoRow from '@/components/ui/InfoRow';

const BatchDetailView = ({ selectedBatchDetail, setView }) => {
    if (!selectedBatchDetail) return null;

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
                            <h1 className="text-2xl font-bold text-gray-900">{selectedBatchDetail.name}</h1>
                            <p className="text-gray-400 text-sm">
                                {selectedBatchDetail.departmentId?.name || selectedBatchDetail.departmentId || 'N/A'} • {selectedBatchDetail.studentsCount || 0} Students
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
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
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Address Information</h3>
                                <p className="text-[11px] text-text-secondary mb-4">Address information of the Batch</p>
                                <div className="space-y-1">
                                    <InfoRow label={<><MapPin className="w-4 h-4 text-gray-400" /> Address</>}><span className="break-words whitespace-pre-wrap">{selectedBatchDetail.address}</span></InfoRow>
                                </div>
                            </div>
                        )}

                        {(selectedBatchDetail.phone || selectedBatchDetail.email) && (
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Contact Information</h3>
                                <p className="text-[11px] text-text-secondary mb-4">Contact information of the Batch</p>
                                <div className="space-y-1">
                                    {selectedBatchDetail.phone && <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedBatchDetail.phone}</InfoRow>}
                                    {selectedBatchDetail.email && <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>{selectedBatchDetail.email}</InfoRow>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-4">Batch Summary</h3>
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
            </div>
        </div>
    );
};

export default BatchDetailView;
