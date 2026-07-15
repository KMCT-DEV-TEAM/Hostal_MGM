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
                    <h3 className="text-xs font-semibold text-primary mb-1">{t('basic_info')}</h3>
                    <h5 className='text-xs text-[#777777] mb-4'>{t('Enter the basic contact information for this staff member.')}</h5>
                    <div className="border-b border-gray-100 mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('first_name')} <span className="text-red-500">*</span></label>
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
                            <label className="block text-[10px] font-medium text-black mb-1">{t('last_name')} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder={t('Enter Last Name')}
                                value={staffForm.name ? staffForm.name.split(' ').slice(1).join(' ') : ''}
                                onChange={(e) => setStaffForm({ ...staffForm, name: `${staffForm.name ? staffForm.name.split(' ')[0] : ''} ${e.target.value}`.trim() })}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                            />
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('phone_number')} <span className="text-red-500">*</span></label>
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

                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('Specialization')}</label>
                            <input
                                type="text"
                                placeholder={t('Plumbing')}
                                value={staffForm.specialization || ''}
                                onChange={(e) => setStaffForm({ ...staffForm, specialization: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                            />
                        </div>
                    </div>
                </section>

                {userRole === 'super_admin' && (
                    <section>
                        <h3 className="text-xs font-semibold text-primary mb-1">{t('Organization Assignment')}</h3>
                        <h5 className='text-xs text-[#777777] mb-4'>{t('Assign this staff member to an organization.')}</h5>
                        <div className="border-b border-gray-100 mb-4" />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
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
                            
                            {editingStaff && (
                                <div>
                                    <label className="block text-[10px] font-medium text-black mb-1">{t('status')} <span className="text-red-500">*</span></label>
                                    <Dropdown
                                        options={[
                                            { value: 'Active', label: 'Active' },
                                            { value: 'Inactive', label: 'Inactive' }
                                        ]}
                                        value={staffForm.isActive !== undefined ? (staffForm.isActive ? 'Active' : 'Inactive') : (staffForm.status || 'Active')}
                                        onChange={(val) => setStaffForm({ ...staffForm, isActive: val === 'Active' })}
                                        triggerClassName="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A] cursor-pointer text-left"
                                    />
                                </div>
                            )}
                        </div>
                    </section>
                )}
                
                {userRole !== 'super_admin' && editingStaff && (
                    <section>
                        <h3 className="text-xs font-semibold text-primary mb-1">{t('Settings')}</h3>
                        <div className="border-b border-gray-100 mb-4" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-medium text-black mb-1">{t('status')} <span className="text-red-500">*</span></label>
                                <Dropdown
                                    options={[
                                        { value: 'Active', label: 'Active' },
                                        { value: 'Inactive', label: 'Inactive' }
                                    ]}
                                    value={staffForm.isActive !== undefined ? (staffForm.isActive ? 'Active' : 'Inactive') : (staffForm.status || 'Active')}
                                    onChange={(val) => setStaffForm({ ...staffForm, isActive: val === 'Active' })}
                                    triggerClassName="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A] cursor-pointer text-left"
                                />
                            </div>
                        </div>
                    </section>
                )}

                {!editingStaff && (
                    <section>
                        <h3 className="text-xs font-semibold text-primary mb-1">{t('security')}</h3>
                        <h5 className='text-xs text-[#777777] mb-4'>{t('verify_email_desc')}</h5>
                        <div className="border-b border-gray-100 mb-4" />
                        <div>
                            <label className="block text-[10px] font-medium text-black mb-1">{t('email_address')} <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    required
                                    value={staffForm.email || ''}
                                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                                    placeholder="email@example.com"
                                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0A437A] disabled:bg-gray-100 disabled:text-gray-500"
                                    disabled={isEmailVerified}
                                />
                                {isEmailVerified ? (
                                    <button type="button" className="px-4 py-2 bg-green-50 text-success text-[10px] font-medium rounded-lg flex items-center gap-1 cursor-default whitespace-nowrap">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        {t('verified')}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleVerifyClick(staffForm.email, 'addStaff')}
                                        disabled={isVerifying}
                                        className="flex items-center justify-center min-w-[70px] px-4 py-2 bg-[#0A437A] text-white text-xs font-medium rounded-lg hover:bg-secondary transition-colors whitespace-nowrap cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isVerifying ? <Loader2 size={14} className="animate-spin" /> : t('verify')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </Modal>
    );
};

export default MaintenanceStaffFormModal;
