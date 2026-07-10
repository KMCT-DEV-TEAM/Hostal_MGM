import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import Dropdown from '@/components/ui/Dropdown';
import Modal from '@/components/ui/Modal';

const CourseFormModal = ({
    isModalOpen,
    isEditMode,
    formData,
    handleInputChange,
    handleSubmit,
    handleCancel,
    isSubmitting,
    organizations
}) => {
    const { t } = useTranslation();
    const selectedOrg = (organizations || []).find(o => o._id === formData.organizationId);
    const orgCode = selectedOrg ? `${selectedOrg.code}-` : '';

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={handleCancel}
            title={isEditMode ? t('edit_course') : t('add_course')}
            subtitle={isEditMode ? t('edit_course_desc') : t('add_course_desc')}
            asForm={true}
            onSubmit={handleSubmit}
            maxWidth="max-w-xl"
            overflowClass="overflow-visible"
            bottomSheetOnMobile={true}
            footer={
                <>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center justify-center min-w-[100px] px-4 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-secondary cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 size={14} className="animate-spin mx-auto" /> : (isEditMode ? t('save_changes') : t('save'))}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                        {t('cancel')}
                    </button>
                </>
            }
        >
            <div className="space-y-6">
                <section>
                    <h3 className="text-xs font-semibold text-[#0A437A] mb-1">{t('basic_info')}</h3>
                    <h5 className="text-xs text-[#777777] mb-4">{t('basic_course_desc')}</h5>
                    <div className="border-b border-gray-100 mb-4" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {!isEditMode && (
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-[10px] font-medium text-black mb-1">Organization <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Dropdown
                                        options={(organizations || []).map(org => ({ value: org._id, label: org.name }))}
                                        value={formData.organizationId || ''}
                                        onChange={(val) => handleInputChange({ target: { name: 'organizationId', value: val } })}
                                        placeholder="Select Organization"
                                        minWidth="w-full"
                                        triggerClassName="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs text-[#777777] focus:border-[#0A437A]"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('course_name')} <span className="text-red-500">*</span></label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                placeholder="Enter Course name"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('course_code')} <span className="text-red-500">*</span></label>
                            <div className="flex">
                                {orgCode && (
                                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-100 text-gray-500 text-xs font-medium">
                                        {orgCode}
                                    </span>
                                )}
                                <input
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isEditMode}
                                    className="flex-1 w-full px-3 py-2 bg-gray-50/50 border border-gray-200 text-xs focus:outline-none focus:border-[#0A437A]"
                                    placeholder="CS101"
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </Modal>
    );
};

export default CourseFormModal;
