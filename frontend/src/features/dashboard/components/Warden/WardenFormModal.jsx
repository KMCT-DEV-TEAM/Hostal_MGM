import PhoneInput from '@/components/ui/PhoneInput';
import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import Dropdown from '@/components/ui/Dropdown';
import Modal from '@/components/ui/Modal';

export default function WardenFormModal({
    activeModal,
    setActiveModal,
    editingWarden,
    handleSaveWarden,
    handleCancel,
    AVAILABLE_HOSTELS,
    isEmailVerified,
    setIsOtpModalOpen,
    setOtpSource,
    wardenForm,
    setWardenForm,
    handleVerifyClick,
    isSubmitting,
    isVerifying
}) {
    const { t } = useTranslation();
    const [errors, setErrors] = React.useState({});

    return (
        <Modal
            isOpen={activeModal === 'warden'}
            onClose={handleCancel}
            title={editingWarden ? t('edit_warden') : t('add_warden')}
            subtitle={t('add_warden_desc')}
            asForm={true}
            onSubmit={handleSaveWarden}
            maxWidth="max-w-xl"
            bottomSheetOnMobile={true}
            footer={
                <>
                    <button
                        type="submit"
                        disabled={(!isEmailVerified && !editingWarden) || isSubmitting || (wardenForm.phone?.length !== 10)}
                        className="flex items-center justify-center min-w-[100px] px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 size={14} className="animate-spin mx-auto" /> : (editingWarden ? t('save_changes') : t('save'))}
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
                    <h5 className="text-xs text-[#777777] mb-4">{t('basic_info_desc')}</h5>
                    <div className="border-b border-gray-100 mb-4" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('full_name', 'Full Name')} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                pattern="[A-Za-z\s]+"
                                title="Only letters and spaces are allowed"
                                placeholder="Full Name"
                                value={wardenForm.name || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const cleanVal = val.replace(/[^a-zA-Z\s]/g, '');
                                    if (val !== cleanVal) {
                                        setErrors(prev => ({ ...prev, name: 'Only letters and spaces are allowed' }));
                                    } else {
                                        setErrors(prev => ({ ...prev, name: '' }));
                                    }
                                    setWardenForm(prev => ({ ...prev, name: cleanVal }));
                                }}
                                className={`w-full px-3 py-2 bg-gray-50/50 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs focus:outline-none focus:border-[#0A437A]`}
                            />
                            {errors.name && <p className="text-red-500 text-[10px] mt-1">{errors.name}</p>}
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('phone_number')} <span className="text-red-500">*</span></label>
                            <PhoneInput
                                name="phone"
                                value={wardenForm.phone || ''}
                                onChange={(val) => {
                                    setWardenForm(prev => ({ ...prev, phone: val }));
                                    setErrors(prev => ({ ...prev, phone: '' }));
                                }}
                            />
                            {errors.phone && <p className="text-red-500 text-[10px] mt-1">{errors.phone}</p>}
                        </div>

                        {!editingWarden && (
                            <div className="col-span-1 sm:col-span-2 mt-2">
                                <label className="block text-[10px] font-medium text-black mb-1">{t('email_address')} <span className="text-red-500">*</span></label>
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <input
                                            type="email"
                                            required
                                            placeholder="email@gmail.com"
                                            value={wardenForm.email || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const cleanVal = val.replace(/\s/g, '');
                                                if (val !== cleanVal) {
                                                    setErrors(prev => ({ ...prev, email: 'Spaces are not allowed in email' }));
                                                } else {
                                                    setErrors(prev => ({ ...prev, email: '' }));
                                                }
                                                setWardenForm(prev => ({ ...prev, email: cleanVal }));
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === ' ') {
                                                    e.preventDefault();
                                                    setErrors(prev => ({ ...prev, email: 'Spaces are not allowed in email' }));
                                                }
                                            }}
                                            disabled={editingWarden}
                                            className={`w-full px-3 py-2.5 bg-gray-50/50 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs outline-none focus:border-[#0A437A] disabled:bg-gray-100 disabled:text-gray-500`}
                                        />
                                        {errors.email && <p className="text-red-500 text-[10px] mt-1">{errors.email}</p>}
                                    </div>
                                    {isEmailVerified ? (
                                        <button type="button" className="px-4 py-2 bg-green-50 text-success text-[10px] font-medium rounded-lg flex items-center gap-1 cursor-default whitespace-nowrap">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            {t('verified')}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleVerifyClick(wardenForm.email, 'addWarden')}
                                            disabled={!wardenForm.email || isVerifying || editingWarden}
                                            className="px-4 py-2.5 text-xs bg-[#0A437A] text-white hover:bg-secondary cursor-pointer font-medium rounded-lg shrink-0 flex items-center justify-center min-w-[70px]"
                                        >
                                            {isVerifying ? <Loader2 size={14} className="animate-spin" /> : t('verify')}
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {t('verify_email_desc')}
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <section>
                    <h3 className="text-sm font-semibold text-[#0A437A] mb-2">{t('assigned_hostel')}</h3>
                    <h5 className="text-xs text-[#777777] mb-4">{t('assigned_hostel_desc')}</h5>
                    <div className="border-b border-gray-100 mb-4" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-medium text-black mb-1">{t('assign_hostel')} <span className="text-red-500">*</span></label>
                            <Dropdown
                                options={[
                                    { value: 'Not Assigned', label: 'Not Assigned' },
                                    ...AVAILABLE_HOSTELS.map(h => ({ value: h.id || h, label: h.name || h }))
                                ]}
                                value={wardenForm.hostel || 'Not Assigned'}
                                onChange={(val) => setWardenForm(prev => ({ ...prev, hostel: val }))}
                                placeholder={t('select_hostel')}
                                minWidth="w-full"
                                triggerClassName="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs text-[#777777] focus:border-[#0A437A]"
                            />
                        </div>

                        {editingWarden && (
                            <div>
                                <label className="block text-[10px] font-medium text-black mb-1">{t('status')} <span className="text-red-500">*</span></label>
                                <Dropdown
                                    options={[
                                        { value: 'Active', label: 'Active' },
                                        { value: 'Inactive', label: 'Inactive' }
                                    ]}
                                    value={wardenForm.status || (wardenForm.isActive !== undefined ? (wardenForm.isActive ? 'Active' : 'Inactive') : 'Active')}
                                    onChange={(val) => setWardenForm(prev => ({ ...prev, status: val, isActive: val === 'Active' }))}
                                    triggerClassName="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A] cursor-pointer text-left"
                                />
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </Modal>
    );
}
