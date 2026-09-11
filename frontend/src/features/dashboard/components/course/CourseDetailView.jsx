import React from 'react';
import { Building2, Fingerprint, ToggleRight, Layers } from 'lucide-react';
import InfoRow from '@/components/ui/InfoRow';
import Modal from '@/components/ui/Modal';

const CourseDetailView = ({ selectedCourseDetail, setView }) => {
    if (!selectedCourseDetail) return null;

    return (
        <Modal 
            bottomSheetOnMobile={true}
            isOpen={true}
            onClose={() => setView('list')}
            maxWidth="max-w-5xl"
            title={selectedCourseDetail.name}
            subtitle="Course"
            icon={<Building2 size={24} />}
        >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Main Content Area */}
                <div className="md:col-span-7 space-y-4 md:space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Basic Info</h3>
                        <p className="text-[11px] text-text-secondary mb-4">Basic contact information of the Course</p>
                        <div className="space-y-1">
                            <InfoRow label={<><Fingerprint className="w-4 h-4 text-gray-400" /> Id</>}>{selectedCourseDetail.code}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Name</>}>{selectedCourseDetail.name}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Organization</>}>{selectedCourseDetail?.organizationId?.name || selectedCourseDetail?.organization?.name || 'N/A'}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Departments</>}>{selectedCourseDetail.departmentsCount || 0}</InfoRow>
                            <InfoRow label={<><Layers className="w-4 h-4 text-gray-400" /> Batches</>}>{selectedCourseDetail.batchesCount || 0}</InfoRow>
                            <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                <span className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full ${selectedCourseDetail.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                    {selectedCourseDetail.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </InfoRow>
                        </div>
                    </div>

                </div>

                <div className="md:col-span-5 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h3 className="text-sm font-semibold text-[#0A437A] mb-3 md:mb-4">Course Summary</h3>
                    <div className="space-y-1">
                        <InfoRow label={<><Fingerprint className="w-4 h-4 text-gray-400" /> Id</>}>{selectedCourseDetail.code}</InfoRow>
                        <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Name</>}>{selectedCourseDetail.name}</InfoRow>
                        <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Org</>}>{selectedCourseDetail?.organizationId?.name || selectedCourseDetail?.organization?.name || 'N/A'}</InfoRow>
                        <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Departments</>}>{selectedCourseDetail.departmentsCount || 0}</InfoRow>
                        <InfoRow label={<><Layers className="w-4 h-4 text-gray-400" /> Batches</>}>{selectedCourseDetail.batchesCount || 0}</InfoRow>
                        <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                            <span className="flex items-center">
                                <span className={`w-2 h-2 rounded-full ${selectedCourseDetail.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                {selectedCourseDetail.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </InfoRow>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CourseDetailView;
