import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const ComplaintCategoryFormModal = ({
    isModalOpen,
    isEditMode,
    formData,
    handleInputChange,
    handleSubmit,
    handleCancel,
    isSubmitting
}) => {
    const { t } = useTranslation();
    if (!isModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {isEditMode ? 'Edit Complaint Category' : 'Add Complaint Category'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {isEditMode ? 'Update details for this complaint category' : 'Fill in the details to create a new complaint category'}
                        </p>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <form id="categoryForm" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Category Details</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0A437A]"
                                        placeholder="Enter category name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Enter category description"
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A437A]/20 focus:border-[#0A437A] transition-all resize-none min-h-[100px]"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="categoryForm"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 text-sm font-medium bg-[#0A437A] text-white rounded-xl hover:bg-[#0A437A]/90 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSubmitting ? 'Saving...' : 'Save Category'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComplaintCategoryFormModal;
