import React, { useState } from 'react';
import PhoneInput from '@/components/ui/PhoneInput';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useTranslation } from '@/hooks/useTranslation';
import Dropdown from '@/components/ui/Dropdown';

const AdminFormModal = ({
    activeModal,
    setActiveModal,
    editingAdmin,
    adminForm,
    setAdminForm,
    handleSaveAdmin,
    handleCancel,
    organizations = [],
    isEmailVerified,
    handleVerifyClick,
    isSubmitting,
    isVerifying
}) => {
    const { t } = useTranslation();
    const [errors, setErrors] = React.useState({});

    return (
        <Modal
            isOpen={activeModal === 'admin'}
            onClose={handleCancel}
            title={editingAdmin ? t('edit_admin') : t('add_admin')}
            subtitle={t('add_admin_desc')}
            asForm={true}
            onSubmit={handleSaveAdmin}
            maxWidth="max-w-xl"
            bottomSheetOnMobile={true}
            footer={
                <>
                    <button
                        disabled={isSubmitting}
                        onClick={(e) => {
                            let newErrors = { ...errors };
                            let hasError = false;
                            if (!adminForm.name || !adminForm.name.trim()) { newErrors.firstName = 'Name is required'; hasError = true; }
                            if (!adminForm.phone) { newErrors.phone = 'Phone number is required'; hasError = true; }
                            else if (adminForm.phone.length !== 10) { newErrors.phone = 'Phone number must be exactly 10 digits'; hasError = true; }
                            if (!adminForm.email) { newErrors.email = 'Email is required'; hasError = true; }
                            else if (!isEmailVerified && !editingAdmin) { newErrors.email = 'Please verify your email'; hasError = true; }
                            if (!adminForm.organization) { newErrors.organization = 'Organization is required'; hasError = true; }
                            
                            setErrors(newErrors);
                            if (hasError) {
                                e.preventDefault();
                            }
                        }}
                        className="flex items-center justify-center min-w-[80px] px-4 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-secondary disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editingAdmin ? t('save_changes') : t('save'))}
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
                    <h3 className="text-xs font-semibold text-primary mb-1">{t('basic_info')}</h3>
                    <h5 className='text-xs text-[#777777] mb-4'>{t('admin_basic_info_desc')}</h5>
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
                                value={adminForm.name || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const cleanVal = val.replace(/[^a-zA-Z\s]/g, '');
                                    if (val !== cleanVal) {
                                        setErrors(prev => ({ ...prev, name: 'Only letters and spaces are allowed' }));
                                    } else {
                                        setErrors(prev => ({ ...prev, name: '' }));
                                    }
                                    setAdminForm({ ...adminForm, name: cleanVal });
                                }}
                                className={`w-full px-3 py-2 bg-gray-50/50 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs focus:outline-none focus:border-[#0A437A]`}
                            />
                            {errors.name && <p className="text-red-500 text-[10px] mt-1">{errors.name}</p>}
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('phone_number')} <span className="text-red-500">*</span></label>
                            <PhoneInput
                                name="phone"
                                value={adminForm.phone || ''}
                                onChange={(val) => {
                                    setAdminForm({ ...adminForm, phone: val });
                                    setErrors(prev => ({ ...prev, phone: '' }));
                                }}
                            />
                            {errors.phone && <p className="text-red-500 text-[10px] mt-1">{errors.phone}</p>}
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-semibold text-primary mb-1">{t('admin_org_assignment')}</h3>
                    <h5 className='text-xs text-[#777777] mb-4'>{t('admin_org_assignment_desc')}</h5>
                    <div className="border-b border-gray-100 mb-4" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-medium text-black mb-1">{t('organization')} <span className="text-red-500">*</span></label>
                            <Dropdown
                                options={organizations.map(org => ({ value: org.id, label: org.name }))}
                                value={adminForm.organization}
                                onChange={(val) => { setAdminForm({ ...adminForm, organization: val }); setErrors(prev => ({ ...prev, organization: '' })); }}
                                placeholder={t('select_organization')}
                                triggerClassName={`w-full px-3 py-2 bg-gray-50/50 border ${errors.organization ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs focus:outline-none focus:border-[#0A437A] cursor-pointer text-left`}
                            />
                            {errors.organization && <p className="text-red-500 text-[10px] mt-1">{errors.organization}</p>}
                        </div>

                        {editingAdmin && (
                            <div>
                                <label className="block text-[10px] font-medium text-black mb-1">{t('status')} <span className="text-red-500">*</span></label>
                                <Dropdown
                                    options={[
                                        { value: 'Active', label: 'Active' },
                                        { value: 'Inactive', label: 'Inactive' }
                                    ]}
                                    value={adminForm.isActive !== undefined ? (adminForm.isActive ? 'Active' : 'Inactive') : (adminForm.status || 'Active')}
                                    onChange={(val) => setAdminForm({ ...adminForm, isActive: val === 'Active' })}
                                    triggerClassName="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A] cursor-pointer text-left"
                                />
                            </div>
                        )}
                    </div>
                </section>

                {!editingAdmin && (
                    <section>
                        <h3 className="text-xs font-semibold text-primary mb-1">{t('security')}</h3>
                        <h5 className='text-xs text-[#777777] mb-4'>{t('verify_email_desc')}</h5>
                        <div className="border-b border-gray-100 mb-4" />
                        <div>
                            <label className="block text-[10px] font-medium text-black mb-1">{t('email_address')} <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <input
                                        type="email"
                                        required
                                        placeholder={t('email@gmail.com')}
                                        value={adminForm.email}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const cleanVal = val.replace(/\s/g, '');
                                            if (val !== cleanVal) {
                                                setErrors(prev => ({ ...prev, email: 'Spaces are not allowed in email' }));
                                            } else {
                                                setErrors(prev => ({ ...prev, email: '' }));
                                            }
                                            setAdminForm({ ...adminForm, email: cleanVal });
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === ' ') {
                                                e.preventDefault();
                                                setErrors(prev => ({ ...prev, email: 'Spaces are not allowed in email' }));
                                            }
                                        }}
                                        className={`w-full px-3 py-2 bg-gray-50/50 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs focus:outline-none focus:border-[#0A437A]`}
                                        disabled={isEmailVerified}
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
                                        onClick={() => handleVerifyClick(adminForm.email, 'addAdmin')}
                                        disabled={isVerifying}
                                        className="flex items-center justify-center min-w-[70px] px-4 py-2 bg-[#0A437A] text-white text-xs font-medium rounded-lg hover:bg-secondary transition-colors whitespace-nowrap cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : t('verify')}
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

export default AdminFormModal;
