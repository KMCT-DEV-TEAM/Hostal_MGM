import React from 'react';
import { X, Building2, Fingerprint, ToggleRight, MapPin, Phone, Mail } from 'lucide-react';
import InfoRow from '@/components/ui/InfoRow';

const CourseDetailView = ({ selectedCourseDetail, setView }) => {
    if (!selectedCourseDetail) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
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
                            <h1 className="text-2xl font-bold text-gray-900">{selectedCourseDetail.name}</h1>
                            <p className="text-gray-400 text-sm">Course - {selectedCourseDetail.departmentsCount || 0} Departments</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Basic Info</h3>
                            <p className="text-[11px] text-text-secondary mb-4">Basic contact information of the Course</p>
                            <div className="space-y-1">
                                <InfoRow label={<><Fingerprint className="w-4 h-4 text-gray-400" /> Id</>}>{selectedCourseDetail.code}</InfoRow>
                                <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Name</>}>{selectedCourseDetail.name}</InfoRow>
                                <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Organization</>}>{selectedCourseDetail?.organizationId?.name || selectedCourseDetail?.organization?.name || 'N/A'}</InfoRow>
                                <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                    <span className="flex items-center">
                                        <span className={`w-2 h-2 rounded-full ${selectedCourseDetail.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                        {selectedCourseDetail.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </InfoRow>
                            </div>
                        </div>

                        {/* Address Information */}
                        {selectedCourseDetail.address && (
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Address Information</h3>
                                <p className="text-[11px] text-text-secondary mb-4">Address information of the Course</p>
                                <div className="space-y-1">
                                    <InfoRow label={<><MapPin className="w-4 h-4 text-gray-400" /> Address</>}><span className="break-words whitespace-pre-wrap">{selectedCourseDetail.address}</span></InfoRow>
                                </div>
                            </div>
                        )}

                        {/* Contact Information */}
                        {(selectedCourseDetail.phone || selectedCourseDetail.email) && (
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Contact Information</h3>
                                <p className="text-[11px] text-text-secondary mb-4">Contact information of the Course</p>
                                <div className="space-y-1">
                                    {selectedCourseDetail.phone && <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedCourseDetail.phone}</InfoRow>}
                                    {selectedCourseDetail.email && <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>{selectedCourseDetail.email}</InfoRow>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-4">Course Summary</h3>
                        <div className="space-y-1">
                            <InfoRow label={<><Fingerprint className="w-4 h-4 text-gray-400" /> Id</>}>{selectedCourseDetail.code}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Name</>}>{selectedCourseDetail.name}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Org</>}>{selectedCourseDetail?.organizationId?.name || selectedCourseDetail?.organization?.name || 'N/A'}</InfoRow>
                            <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                <span className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full ${selectedCourseDetail.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                    {selectedCourseDetail.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </InfoRow>
                            {selectedCourseDetail.phone && <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedCourseDetail.phone}</InfoRow>}
                            {selectedCourseDetail.email && <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>{selectedCourseDetail.email}</InfoRow>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetailView;
