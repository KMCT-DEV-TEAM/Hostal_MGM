import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const CourseFormModal = ({
    isModalOpen,
    setIsModalOpen,
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <form
                onSubmit={handleSubmit}
                className="
                    bg-white
                    rounded-2xl
                    w-full
                    max-w-3xl
                    max-h-[90vh]
                    overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                    p-8
                    shadow-2xl
                    animate-in
                    fade-in
                    zoom-in-95
                    duration-200
                "
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {isEditMode ? t('edit_course') : t('add_course')}
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">
                            {isEditMode ? t('edit_course_desc') : t('add_course_desc')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="space-y-8">
                    <section>
                        <h3 className="text-[14px] font-medium text-primary">{t('basic_info')}</h3>
                        <h5 className='text-xs font-medium text-[#777777] mb-4 pb-2 border-b border-gray-200 '>{t('basic_course_desc')}</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <label className="block text-xs mb-1.5 font-medium">{t('course_name')} *</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0A437A]"
                                    placeholder="Enter Course name"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs mb-1.5 font-medium">{t('course_code')} *</label>
                                <input
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0A437A]"
                                    placeholder="e.g. CS101"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 text-xs font-medium text-white bg-[#0A437A] rounded-lg hover:bg-[#083660] transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            {isEditMode ? t('save_changes') : t('save')}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                            {t('cancel')}
                        </button>

                    </div>
                </div>
            </form>
        </div>
    );
};

export default CourseFormModal;
