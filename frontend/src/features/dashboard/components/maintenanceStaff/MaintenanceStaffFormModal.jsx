import React from 'react';
import { Loader2, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';

const MaintenanceStaffFormModal = ({
    activeModal,
    editingStaff,
    staffForm,
    setStaffForm,
    handleSaveStaff,
    handleCancel,
    isEmailVerified,
    handleVerifyClick,
    isSubmitting,
    isVerifying,
    userRole,
    organizations
}) => {
    const { t } = useTranslation();

    return (
        <Modal
            isOpen={activeModal === 'staff'}
            onClose={handleCancel}
            title={editingStaff ? t('Edit Maintenance Staff') : t('Add Maintenance Staff')}
            subtitle={t('Enter the details of the maintenance staff member.')}
            asForm={true}
            onSubmit={handleSaveStaff}
            maxWidth="max-w-xl"
            bottomSheetOnMobile={true}
            footer={
                <>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center justify-center min-w-[100px] px-4 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-secondary cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 size={14} className="animate-spin mx-auto" /> : (editingStaff ? t('Save Changes') : t('Save'))}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                        {t('Cancel')}
                    </button>
                </>
            }
        >
            <div className="space-y-6">
                <section>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {userRole === 'super_admin' && !editingStaff && (
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-[10px] font-medium text-black mb-1">Organization <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Dropdown
                                        options={(organizations || []).map(org => ({ value: org._id, label: org.name }))}
                                        value={staffForm.organizationId || ''}
                                        onChange={(val) => setStaffForm({ ...staffForm, organizationId: val })}
                                        placeholder="Select Organization"
                                        minWidth="w-full"
                                        triggerClassName="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs text-[#777777] focus:border-[#0A437A]"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('first_name', 'First Name')} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder={t('Enter First Name')}
                                value={staffForm.name ? staffForm.name.split(' ')[0] : ''}
                                onChange={(e) => setStaffForm({ ...staffForm, name: `${e.target.value} ${staffForm.name ? staffForm.name.split(' ').slice(1).join(' ') : ''}`.trim() })}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                            />
                        </div>

                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('last_name', 'Last Name')} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder={t('Enter Last Name')}
                                value={staffForm.name ? staffForm.name.split(' ').slice(1).join(' ') : ''}
                                onChange={(e) => setStaffForm({ ...staffForm, name: `${staffForm.name ? staffForm.name.split(' ')[0] : ''} ${e.target.value}`.trim() })}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                            />
                        </div>

                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('phone_number', 'Phone Number')} <span className="text-red-500">*</span></label>
                            <div className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#0A437A]">
                                <div className="px-2 py-2 border-r border-gray-200 flex items-center gap-1 text-xs text-gray-600 bg-gray-50/50">
                                    <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-4 h-3" />
                                    +91
                                </div>
                                <input
                                    type="tel"
                                    required
                                    pattern="[0-9]{10}"
                                    maxLength="10"
                                    title="Please enter a valid 10-digit phone number"
                                    value={staffForm.phone || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) {
                                            setStaffForm({ ...staffForm, phone: val });
                                        }
                                    }}
                                    placeholder="0000000000"
                                    className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                                />
                            </div>
                        </div>

                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('specialization', 'Specialization')}</label>
                            <input
                                type="text"
                                placeholder={t('Plumbing')}
                                value={staffForm.specialization || ''}
                                onChange={(e) => setStaffForm({ ...staffForm, specialization: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                            />
                        </div>

                        {/* Conditionally hide Email if editing */}
                        {!editingStaff && (
                            <div className="col-span-2 mt-2">
                                <label className="block text-[10px] font-medium text-black mb-1">{t('email_address', 'Email Address')} <span className="text-red-500">*</span></label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="email"
                                        required
                                        value={staffForm.email || ''}
                                        onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                                        placeholder="email@example.com"
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0A437A] disabled:bg-gray-50 disabled:text-gray-500 flex-1"
                                        disabled={isEmailVerified}
                                    />
                                    {isEmailVerified ? (
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-success bg-success-50 px-3 py-2.5 rounded-lg shrink-0">
                                            <Check size={14} className="stroke-[3]" /> {t('verified', 'Verified')}
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleVerifyClick(staffForm.email, 'addStaff')}
                                            disabled={isVerifying}
                                            className="px-4 py-2.5 text-xs bg-[#0A437A] text-white hover:bg-secondary cursor-pointer font-medium rounded-lg shrink-0 flex items-center justify-center min-w-[70px]"
                                        >
                                            {isVerifying ? <Loader2 size={14} className="animate-spin" /> : t('verify', 'Verify')}
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {t('Please verify your email address to continue.')}
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </Modal>
    );
};

export default MaintenanceStaffFormModal;
