import React from 'react';
import { Loader2 } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import { useTranslation } from '@/hooks/useTranslation';
import Modal from '@/components/ui/Modal';

const DepartmentFormModal = ({
    isModalOpen,
    isEditMode,
    formData,
    handleInputChange,
    handleSubmit,
    handleCancel,
    isSubmitting,
    courses
}) => {
    const { t } = useTranslation();
    const [errors, setErrors] = React.useState({});
    const selectedCourse = (courses || []).find(c => c._id === formData.courseId);
    const courseCode = selectedCourse ? selectedCourse.code : '';

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={handleCancel}
            title={isEditMode ? t('edit_department') : t('add_department')}
            subtitle={isEditMode ? t('edit_department_desc') : t('add_department_desc')}
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
                    <h5 className="text-xs text-[#777777] mb-4">{t('basic_department_desc')}</h5>
                    <div className="border-b border-gray-100 mb-4" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('department_name')} <span className="text-red-500">*</span></label>
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
                                placeholder="Enter Department name"
                            />
                            {errors.name && <p className="text-red-500 text-[10px] mt-1">{errors.name}</p>}
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('department_code')} <span className="text-red-500">*</span></label>
                            <div className={"flex border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#0A437A] "}>
                                {courseCode && (
                                    <div className="px-3 py-2 bg-gray-100 border-r border-gray-200 text-xs font-semibold text-gray-600 uppercase select-none">
                                        {courseCode}
                                    </div>
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
                                    className={`w-full px-3 py-2 outline-none text-xs uppercase ${isEditMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-transparent'}`}
                                    placeholder="DEPT"
                                />
                            </div>
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('course')} <span className="text-red-500">*</span></label>
                            <Dropdown
                                options={courses ? courses.map(course => ({
                                    label: `${course.name} (${course.code})`,
                                    value: course._id
                                })) : []}
                                value={formData.courseId}
                                onChange={(val) => handleInputChange({ target: { name: 'courseId', value: val } })}
                                placeholder="Select Course"
                                minWidth="w-full"
                                triggerClassName="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs text-[#777777] focus:border-[#0A437A]"
                            />
                        </div>
                    </div>
                </section>
            </div >
        </Modal >
    );
};

export default DepartmentFormModal;
