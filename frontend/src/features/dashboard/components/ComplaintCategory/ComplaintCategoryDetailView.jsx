import React from 'react';
import { X, AlignLeft, Calendar, Tag, ToggleRight } from 'lucide-react';
import InfoRow from '@/components/ui/InfoRow';

export default function ComplaintCategoryDetailView({ selectedCategoryDetail, setView }) {
    if (!selectedCategoryDetail) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-end md:items-center justify-center p-0 md:p-4 z-50">
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
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#0A437A] rounded-xl flex items-center justify-center text-white">
                            <Tag size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{selectedCategoryDetail?.name}</h1>
                            <p className="text-gray-400 text-sm">Category Details</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Basic Info Section */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Basic Info</h3>
                            <p className="text-[11px] text-text-secondary mb-4">Basic information of the Category</p>
                            <div className="space-y-1">
                                <InfoRow label={<><Tag className="w-4 h-4 text-gray-400" /> Name</>}>{selectedCategoryDetail?.name}</InfoRow>
                                <InfoRow label={<><AlignLeft className="w-4 h-4 text-gray-400" /> Description</>}>{selectedCategoryDetail?.description || 'N/A'}</InfoRow>
                                <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                    <span className="flex items-center">
                                        <span className={`w-2 h-2 rounded-full ${selectedCategoryDetail?.isActive ? 'bg-green-600' : 'bg-red-600'} mr-2`}></span>
                                        {selectedCategoryDetail?.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </InfoRow>
                                <InfoRow label={<><Calendar className="w-4 h-4 text-gray-400" /> Created</>}>{selectedCategoryDetail?.createdAt ? new Date(selectedCategoryDetail.createdAt).toLocaleDateString() : 'N/A'}</InfoRow>
                            </div>
                        </div>
                    </div>

                    {/* Right Summary Sidebar */}
                    <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-4">Category Summary</h3>
                        <div className="space-y-1">
                            <InfoRow label={<><Tag className="w-4 h-4 text-gray-400" /> Name</>}>{selectedCategoryDetail?.name}</InfoRow>
                            <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                <span className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full ${selectedCategoryDetail?.isActive ? 'bg-green-600' : 'bg-red-600'} mr-2`}></span>
                                    {selectedCategoryDetail?.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </InfoRow>
                            <InfoRow label={<><Calendar className="w-4 h-4 text-gray-400" /> Created At</>}>{selectedCategoryDetail?.createdAt ? new Date(selectedCategoryDetail.createdAt).toLocaleDateString() : 'N/A'}</InfoRow>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
