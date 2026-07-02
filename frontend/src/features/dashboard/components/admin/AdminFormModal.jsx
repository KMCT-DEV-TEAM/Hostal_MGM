import React from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useTranslation } from '@/hooks/useTranslation';

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
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
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
                                placeholder={t('first_name_placeholder')}
                                value={adminForm.name ? adminForm.name.split(' ')[0] : ''}
                                onChange={(e) => setAdminForm({ ...adminForm, name: `${e.target.value} ${adminForm.name ? adminForm.name.split(' ').slice(1).join(' ') || '' : ''}`.trim() })}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('last_name')} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder={t('last_name_placeholder')}
                                value={adminForm.name ? adminForm.name.split(' ').slice(1).join(' ') : ''}
                                onChange={(e) => setAdminForm({ ...adminForm, name: `${adminForm.name ? adminForm.name.split(' ')[0] : ''} ${e.target.value}`.trim() })}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                            />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('phone_number')}</label>
                            <input
                                type="tel"
                                required
                                placeholder={t('phone_placeholder')}
                                value={adminForm.phone}
                                onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                            />
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-semibold text-primary mb-1">{t('role_assignments')}</h3>
                    <h5 className='text-xs text-[#777777] mb-4'>{t('admin_role_desc')}</h5>
                    <div className="border-b border-gray-100 mb-4" />
                    <div>
                        <label className="block text-[10px] font-medium text-black mb-1">{t('organization')} <span className="text-red-500">*</span></label>
                        <select
                            required={!editingAdmin}
                            value={adminForm.organization}
                            onChange={(e) => setAdminForm({ ...adminForm, organization: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A] appearance-none"
                            disabled={!!editingAdmin}
                        >
                            <option value="">{t('select_organization')}</option>
                            {organizations.map(org => (
                                <option key={org._id} value={org._id}>{org.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700" style={{ marginTop: 'calc(100% - 2rem)', right: '1.5rem' }}>
                        </div>
                    </div>
                </section>

                {!editingAdmin && (
                    <section>
                        <h3 className="text-xs font-semibold text-primary mb-1">{t('account_security')}</h3>
                        <h5 className='text-xs text-[#777777] mb-4'>{t('admin_security_desc')}</h5>
                        <div className="border-b border-gray-100 mb-4" />
                        <div>
                            <label className="block text-[10px] font-medium text-black mb-1">{t('email_address')} <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    required
                                    placeholder={t('email_placeholder')}
                                    value={adminForm.email}
                                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
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