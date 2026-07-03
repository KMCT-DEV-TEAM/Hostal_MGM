import React from 'react';
import { AlignLeft, Calendar, Tag, ToggleRight } from 'lucide-react';
import InfoRow from '@/components/ui/InfoRow';
import Modal from '@/components/ui/Modal';

export default function ComplaintCategoryDetailView({ selectedCategoryDetail, setView }) {
    if (!selectedCategoryDetail) return null;

    return (
        <Modal
            bottomSheetOnMobile={true}
            isOpen={true}
            onClose={() => setView('list')}
            maxWidth="max-w-5xl"
            title={selectedCategoryDetail?.name}
            subtitle="Category Details"
            icon={<Tag size={24} />}
        >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Main Content Area */}
                <div className="md:col-span-7 space-y-4 md:space-y-6">
                    {/* Basic Info Section */}
                    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Basic Info</h3>
                        <p className="text-[11px] text-text-secondary mb-4">Basic information of the Category</p>
                        <div className="space-y-1">
                            <InfoRow label={<><Tag className="w-4 h-4 text-gray-400" /> Name</>}>{selectedCategoryDetail?.name}</InfoRow>
                            <InfoRow label={<><AlignLeft className="w-4 h-4 text-gray-400" /> Description</>}>{selectedCategoryDetail?.description || 'N/A'}</InfoRow>
                            <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                <span className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full mr-2 ${selectedCategoryDetail?.isActive ? 'bg-green-500' : 'bg-danger'}`}></span>
                                    {selectedCategoryDetail?.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </InfoRow>
                            <InfoRow label={<><Calendar className="w-4 h-4 text-gray-400" /> Created</>}>{selectedCategoryDetail?.createdAt ? new Date(selectedCategoryDetail.createdAt).toLocaleDateString() : 'N/A'}</InfoRow>
                        </div>
                    </div>
                </div>

                {/* Right Summary Sidebar */}
                <div className="md:col-span-5 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h3 className="text-sm font-semibold text-[#0A437A] mb-3 md:mb-4">Category Summary</h3>
                    <div className="space-y-1">
                        <InfoRow label={<><Tag className="w-4 h-4 text-gray-400" /> Name</>}>{selectedCategoryDetail?.name}</InfoRow>
                        <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                            <span className="flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-2 ${selectedCategoryDetail?.isActive ? 'bg-green-500' : 'bg-danger'}`}></span>
                                {selectedCategoryDetail?.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </InfoRow>
                        <InfoRow label={<><Calendar className="w-4 h-4 text-gray-400" /> Created At</>}>{selectedCategoryDetail?.createdAt ? new Date(selectedCategoryDetail.createdAt).toLocaleDateString() : 'N/A'}</InfoRow>
                    </div>
                </div>
            </div >
        </Modal >
    );
}
