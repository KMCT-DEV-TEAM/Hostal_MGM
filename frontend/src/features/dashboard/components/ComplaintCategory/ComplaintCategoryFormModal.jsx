import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import Modal from '@/components/ui/Modal';

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

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={handleCancel}
            title={isEditMode ? 'Edit Complaint Category' : 'Add Complaint Category'}
            subtitle={isEditMode ? 'Update details for this complaint category' : 'Fill in the details to create a new complaint category'}
            asForm={true}
            onSubmit={handleSubmit}
            maxWidth="max-w-xl"
            bottomSheetOnMobile={true}
            footer={
                <>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center justify-center min-w-[100px] px-4 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-secondary cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 size={14} className="animate-spin mx-auto" /> : (isEditMode ? 'Save Changes' : 'Save')}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                </>
            }
        >
            <div className="space-y-6">
                <section>
                    <h3 className="text-sm font-semibold text-primary mb-1">Category Details</h3>
                    <h5 className="text-xs text-[#777777] mb-4">Basic information of the category</h5>
                    <div className="border-b border-gray-100 mb-4" />
                    <div className="grid grid-cols-1 gap-4">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">Category Name <span className="text-danger">*</span></label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                placeholder="Enter category name"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter category description"
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A] resize-none min-h-[100px]"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </Modal>
    );
};

export default ComplaintCategoryFormModal;
