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
    const [errors, setErrors] = React.useState({});
    const selectedOrg = (organizations || []).find(o => o._id === formData.organizationId);
    const orgCode = selectedOrg ? `${selectedOrg.code}-` : '';

    const onSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        
        if (!formData.organizationId) {
            newErrors.organizationId = t('org_not_selected', 'Organization is not selected');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...newErrors }));
            return;
        }
        
        handleSubmit(e);
    };

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={handleCancel}
            title={isEditMode ? t('edit_course') : t('add_course')}
            subtitle={isEditMode ? t('edit_course_desc') : t('add_course_desc')}
            asForm={true}
            onSubmit={onSubmit}
            maxWidth="max-w-xl"
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
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-medium text-black mb-1">Organization <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Dropdown
                                    options={(organizations || []).map(org => ({ value: org._id, label: org.name }))}
                                    value={formData.organizationId || ''}
                                    onChange={(val) => {
                                        setErrors(prev => ({ ...prev, organizationId: undefined }));
                                        handleInputChange({ target: { name: 'organizationId', value: val } });
                                    }}
                                    placeholder="Select Organization"
                                    minWidth="w-full"
                                    triggerClassName={`w-full px-3 py-2 bg-gray-50/50 border ${errors.organizationId ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs text-[#777777] focus:border-[#0A437A]`}
                                />
                            </div>
                            {errors.organizationId && <p className="text-red-500 text-[10px] mt-1">{errors.organizationId}</p>}
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('course_name')} <span className="text-red-500">*</span></label>
                            <input
                                name="name"
                                value={formData.name}
                                pattern="[A-Za-z]+"
                                title="Only letters are allowed"
                                onChange={(e) => {
                                    const originalVal = e.target.value;
                                    const cleanVal = originalVal.replace(/[^a-zA-Z]/g, '');
                                    if (originalVal !== cleanVal) {
                                        setErrors(prev => ({ ...prev, name: 'Only letters are allowed' }));
                                    } else {
                                        setErrors(prev => ({ ...prev, name: '' }));
                                    }
                                    handleInputChange({ target: { name: 'name', value: cleanVal } });
                                }}
                                required
                                className={`w-full px-3 py-2 bg-gray-50/50 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs focus:outline-none focus:border-[#0A437A]`}
                                placeholder="Enter Course name"
                            />
                            {errors.name && <p className="text-red-500 text-[10px] mt-1">{errors.name}</p>}
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
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase();
                                        handleInputChange({ target: { name: 'code', value: val } });
                                    }}
                                    required
                                    disabled={isEditMode}
                                    className={`flex-1 w-full px-3 py-2 bg-gray-50/50 border border-gray-200 text-xs focus:outline-none focus:border-[#0A437A] ${isEditMode ? 'text-gray-500 cursor-not-allowed' : ''}`}
                                    placeholder="CS101"
                                />
                            </div>
                        </div>
                        
                        {isEditMode && (
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-[10px] font-medium text-black mb-1">{t('status')} <span className="text-red-500">*</span></label>
                                <Dropdown
                                    options={[
                                        { value: 'Active', label: 'Active' },
                                        { value: 'Inactive', label: 'Inactive' }
                                    ]}
                                    value={formData.isActive !== undefined ? (formData.isActive ? 'Active' : 'Inactive') : (formData.status || 'Active')}
                                    onChange={(val) => handleInputChange({ target: { name: 'isActive', value: val === 'Active' } })}
                                    triggerClassName="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A] cursor-pointer text-left"
                                />
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </Modal>
    );
};

export default CourseFormModal;
