import React from 'react';
import { X, AlignLeft, Calendar } from 'lucide-react';

const ComplaintCategoryDetailView = ({ selectedCategoryDetail, setView }) => {
    if (!selectedCategoryDetail) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col border-l border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Category Details</h2>
                    <p className="text-sm text-gray-500 mt-1">View complete information</p>
                </div>
                <button
                    onClick={() => setView('list')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-2xl uppercase">
                            {selectedCategoryDetail.name ? selectedCategoryDetail.name.substring(0, 2) : 'NA'}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{selectedCategoryDetail.name}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${selectedCategoryDetail.isActive ? 'bg-success/10 text-success' : 'bg-red-50 text-danger'}`}>
                                    {selectedCategoryDetail.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Description
                            </h4>
                            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                <div className="flex items-start gap-3">
                                    <AlignLeft className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Category Description</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedCategoryDetail.description || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                System Info
                            </h4>
                            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Created At</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {new Date(selectedCategoryDetail.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
                <button
                    onClick={() => setView('list')}
                    className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default ComplaintCategoryDetailView;
