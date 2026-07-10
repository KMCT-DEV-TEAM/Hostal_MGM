import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const OrganizationFormModal = ({
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
    const [errors, setErrors] = React.useState({});

    if (!isModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-end md:items-center justify-center p-0 md:p-4">
            <form
                onSubmit={handleSubmit}
                className="
                    bg-white
                    rounded-t-2xl md:rounded-2xl rounded-b-none md:rounded-b-2xl
                    w-full
                    max-w-3xl
                    max-h-[90vh]
                    overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                    p-8
                    shadow-2xl
                    animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200
                "
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {isEditMode ? t('edit_org') : t('add_org')}
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">
                            {isEditMode ? t('edit_org_desc') : t('add_org_desc')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="space-y-8">
                    <section>
                        <h3 className="text-[14px] font-medium text-primary">{t('basic_info')}</h3>
                        <h5 className='text-xs font-medium text-[#777777] mb-4 pb-2 border-b border-gray-200 '>{t('basic_info_desc')}</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-xs mb-1.5 font-medium">{t('org_name')} <span className="text-red-500">*</span></label>
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
                                    className={`w-full p-2.5 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs outline-none focus:border-[#0A437A]`}
                                    placeholder={t('org_name_placeholder')}
                                />
                                {errors.name && <p className="text-red-500 text-[10px] mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-xs mb-1.5 font-medium">{t('code')} <span className="text-red-500">*</span></label>
                                <input
                                    name="code"
                                    value={formData.code}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase();
                                        handleInputChange({ target: { name: 'code', value: val } });
                                    }}
                                    required
                                    disabled={isEditMode}
                                    className={`w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0A437A] ${isEditMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                    placeholder="KMCTENG"
                                />
                            </div>
                            <div>
                                <label className="block text-xs mb-1.5 font-medium">{t('org_number')} <span className="text-red-500">*</span></label>
                                <input
                                    name="organisationNumber"
                                    value={formData.organisationNumber}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase();
                                        handleInputChange({ target: { name: 'organisationNumber', value: val } });
                                    }}
                                    required
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0A437A]"
                                    placeholder="ORG001"
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[14px] font-medium text-primary">{t('contact_address')}</h3>
                        <h5 className="text-xs font-medium text-[#777777] mb-4 pb-2 border-b border-gray-200">{t('contact_address_desc')}</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-medium text-black mb-1">{t('email_address')} <span className="text-red-500">*</span></label>
                                <input
                                    name="email"
                                    value={formData.email}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const cleanVal = val.replace(/\s/g, '');
                                        if (val !== cleanVal) {
                                            setErrors(prev => ({ ...prev, email: 'Spaces are not allowed in email' }));
                                        } else {
                                            setErrors(prev => ({ ...prev, email: '' }));
                                        }
                                        handleInputChange({ target: { name: 'email', value: cleanVal } });
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === ' ') {
                                            e.preventDefault();
                                            setErrors(prev => ({ ...prev, email: 'Spaces are not allowed in email' }));
                                        }
                                    }}
                                    type="email"
                                    required
                                    placeholder="info@example.com"
                                    className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs focus:outline-none focus:border-[#0A437A]`}
                                />
                                {errors.email && <p className="text-red-500 text-[10px] mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-black mb-1">{t('phone_number')} <span className="text-red-500">*</span></label>
                                <div className={`flex border ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-lg overflow-hidden focus-within:border-[#0A437A]`}>
                                    <div className="px-2 py-2 border-r border-gray-200 flex items-center gap-1 text-xs text-black bg-gray-50">
                                        <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-4 h-3" />
                                        +91
                                    </div>
                                    <input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            const originalVal = e.target.value;
                                            const val = originalVal.replace(/\D/g, '');
                                            if (originalVal !== val) {
                                                setErrors(prev => ({ ...prev, phone: 'Only numbers are allowed' }));
                                            } else {
                                                setErrors(prev => ({ ...prev, phone: '' }));
                                            }
                                            if (val.length <= 10) {
                                                handleInputChange({ target: { name: 'phone', value: val } });
                                            }
                                        }}
                                        type="text"
                                        required
                                        maxLength="10"
                                        pattern="[0-9]{10}"
                                        title="Please enter exactly 10 digits"
                                        placeholder="0000000000"
                                        className="w-full px-3 py-2 text-xs outline-none"
                                    />
                                </div>
                                {errors.phone && <p className="text-red-500 text-[10px] mt-1">{errors.phone}</p>}
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-xs font-medium text-black mb-1">{t('full_address')} <span className="text-red-500">*</span></label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    rows="3"
                                    placeholder={t('full_address_placeholder')}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting || (formData.phone?.length !== 10)}
                            className="px-6 py-2.5 text-xs font-medium text-white bg-[#0A437A] rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
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

export default OrganizationFormModal;
