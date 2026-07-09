import React from 'react';
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
    const [errors, setErrors] = React.useState({ firstName: '', lastName: '', phone: '' });

    return (
        <Modal
            isOpen={activeModal === 'admin'}
            onClose={handleCancel}
            title={editingAdmin ? t('edit_admin') : t('add_admin')}
            subtitle={t('add_admin_desc')}
            asForm={true}
            onSubmit={handleSaveAdmin}
            maxWidth="max-w-xl"
            overflowClass="overflow-visible"
            bottomSheetOnMobile={true}
            footer={
                <>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={(!isEmailVerified && !editingAdmin) || isSubmitting || (adminForm.phone?.length !== 10) || !!errors.firstName || !!errors.lastName || !!errors.email}
                        className="flex items-center justify-center min-w-[80px] px-4 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-secondary disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editingAdmin ? t('save_changes') : t('save'))}
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
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('first_name')} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                pattern="[A-Za-z]+"
                                title="Only letters are allowed"
                                placeholder={t('first_name_placeholder')}
                                value={adminForm.name ? adminForm.name.split(' ')[0] : ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/[^a-zA-Z]/.test(val)) {
                                        setErrors(prev => ({ ...prev, firstName: 'Only letters are allowed' }));
                                    } else {
                                        setErrors(prev => ({ ...prev, firstName: '' }));
                                    }
                                    setAdminForm({ ...adminForm, name: `${val} ${adminForm.name ? adminForm.name.split(' ').slice(1).join(' ') || '' : ''}`.trim() });
                                }}
                                className={`w-full px-3 py-2 bg-gray-50/50 border ${errors.firstName ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs focus:outline-none focus:border-[#0A437A]`}
                            />
                            {errors.firstName && <p className="text-red-500 text-[10px] mt-1">{errors.firstName}</p>}
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('last_name')} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                pattern="[A-Za-z]+"
                                title="Only letters are allowed"
                                placeholder={t('last_name_placeholder')}
                                value={adminForm.name ? adminForm.name.split(' ').slice(1).join(' ') : ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/[^a-zA-Z]/.test(val)) {
                                        setErrors(prev => ({ ...prev, lastName: 'Only letters are allowed' }));
                                    } else {
                                        setErrors(prev => ({ ...prev, lastName: '' }));
                                    }
                                    setAdminForm({ ...adminForm, name: `${adminForm.name ? adminForm.name.split(' ')[0] : ''} ${val}`.trim() });
                                }}
                                className={`w-full px-3 py-2 bg-gray-50/50 border ${errors.lastName ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs focus:outline-none focus:border-[#0A437A]`}
                            />
                            {errors.lastName && <p className="text-red-500 text-[10px] mt-1">{errors.lastName}</p>}
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('phone_number')} <span className="text-red-500">*</span></label>
                            <div className={`flex border ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-lg overflow-hidden focus-within:border-[#0A437A]`}>
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
                                    value={adminForm.phone || ''}
                                    onChange={(e) => {
                                        const originalVal = e.target.value;
                                        const val = originalVal.replace(/\D/g, '');
                                        if (originalVal !== val) {
                                            setErrors(prev => ({ ...prev, phone: 'Only numbers are allowed' }));
                                        } else {
                                            setErrors(prev => ({ ...prev, phone: '' }));
                                        }
                                        if (val.length <= 10) {
                                            setAdminForm({ ...adminForm, phone: val });
                                        }
                                    }}
                                    placeholder="0000000000"
                                    className="w-full px-3 py-2 outline-none bg-gray-50/50 text-xs"
                                />
                            </div>
                            {errors.phone && <p className="text-red-500 text-[10px] mt-1">{errors.phone}</p>}
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-semibold text-primary mb-1">{t('admin_org_assignment')}</h3>
                    <h5 className='text-xs text-[#777777] mb-4'>{t('admin_org_assignment_desc')}</h5>
                    <div className="border-b border-gray-100 mb-4" />
                    <div>
                        <label className="block text-[10px] font-medium text-black mb-1">{t('organization')} <span className="text-red-500">*</span></label>
                        {!!editingAdmin ? (
                            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-500 cursor-not-allowed flex items-center justify-between">
                                <span>{organizations.find(o => o._id === adminForm.organization)?.name || t('select_organization')}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down w-4 h-4 text-gray-400"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                        ) : (
                            <Dropdown
                                options={organizations.map(org => ({ value: org._id, label: org.name }))}
                                value={adminForm.organization}
                                onChange={(val) => setAdminForm({ ...adminForm, organization: val })}
                                placeholder={t('select_organization')}
                                triggerClassName="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A] cursor-pointer text-left"
                            />
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
                                            if (/\s/.test(val)) {
                                                setErrors(prev => ({ ...prev, email: 'Spaces are not allowed in email' }));
                                            } else {
                                                setErrors(prev => ({ ...prev, email: '' }));
                                            }
                                            setAdminForm({ ...adminForm, email: val });
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === ' ') {
                                                e.preventDefault();
                                                setErrors(prev => ({ ...prev, email: 'Spaces are not allowed in email' }));
                                            } else {
                                                setErrors(prev => ({ ...prev, email: '' }));
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