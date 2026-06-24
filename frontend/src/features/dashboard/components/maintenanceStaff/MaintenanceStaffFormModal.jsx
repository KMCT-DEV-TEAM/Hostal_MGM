import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const MaintenanceStaffFormModal = ({
    activeModal,
    setActiveModal,
    editingStaff,
    staffForm,
    setStaffForm,
    handleSaveStaff,
    handleCancel,
    isEmailVerified,
    handleVerifyClick,
    isSubmitting,
    isVerifying
}) => {
    const { t } = useTranslation();
    if (activeModal !== 'staff') return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
            <form
                onSubmit={handleSaveStaff}
                className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {editingStaff ? t('edit_maintenance_staff', 'Edit Maintenance Staff') : t('add_maintenance_staff', 'Add Maintenance Staff')}
                        </h2>
                        <p className="text-xs text-[#777777] mt-0.5">
                            {t('maintenance_staff_desc', 'Enter the details of the maintenance staff member.')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Form Sections */}
                <div className="space-y-6">
                    <section>
                        <h3 className="text-xs font-semibold text-[#0A437A] mb-1">{t('basic_info', 'Basic Info')}</h3>
                        <div className="border-b border-gray-100 mb-4" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-medium text-black mb-1">{t('first_name', 'First Name')} *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={t('first_name_placeholder', 'Enter First Name')}
                                    value={staffForm.name ? staffForm.name.split(' ')[0] : ''}
                                    onChange={(e) => setStaffForm({ ...staffForm, name: `${e.target.value} ${staffForm.name ? staffForm.name.split(' ').slice(1).join(' ') || '' : ''}`.trim() })}
                                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-medium text-black mb-1">{t('last_name', 'Last Name')} *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={t('last_name_placeholder', 'Enter Last Name')}
                                    value={staffForm.name ? staffForm.name.split(' ').slice(1).join(' ') : ''}
                                    onChange={(e) => setStaffForm({ ...staffForm, name: `${staffForm.name ? staffForm.name.split(' ')[0] : ''} ${e.target.value}`.trim() })}
                                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                />
                            </div>
                            
                            <div className="col-span-1">
                                <label className="block text-[10px] font-medium text-black mb-1">{t('phone_number', 'Phone Number')} *</label>
                                <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 focus-within:border-[#0A437A]">
                                    <div className="px-2 py-2 border-r border-gray-200 flex items-center gap-1 text-xs text-gray-600">
                                        <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-4 h-3" />
                                        +91
                                    </div>
                                    <input
                                        type="tel"
                                        required
                                        pattern="[0-9]{10}"
                                        maxLength="10"
                                        title="Please enter a valid 10-digit phone number"
                                        placeholder="0000000000"
                                        value={staffForm.phone}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) {
                                                setStaffForm({ ...staffForm, phone: val });
                                            }
                                        }}
                                        className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                                    />
                                </div>
                            </div>
                            
                            <div className="col-span-1">
                                <label className="block text-[10px] font-medium text-black mb-1">{t('specialization', 'Specialization')}</label>
                                <input
                                    type="text"
                                    placeholder={t('specialization_placeholder', 'e.g. Plumbing, Electrical')}
                                    value={staffForm.specialization || ''}
                                    onChange={(e) => setStaffForm({ ...staffForm, specialization: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                />
                            </div>

                            {/* Conditionally hide Email if editing */}
                            {!editingStaff && (
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-[10px] font-medium text-black mb-1">{t('email_address', 'Email Address')} *</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            required
                                            value={staffForm.email || ''}
                                            onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                                            placeholder="email@example.com"
                                            className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                            disabled={isEmailVerified}
                                        />
                                        {isEmailVerified ? (
                                            <button type="button" className="px-4 py-2 bg-green-50 text-success text-[10px] font-medium rounded-lg flex items-center gap-1 cursor-default whitespace-nowrap">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                {t('verified', 'Verified')}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleVerifyClick(staffForm.email, 'addStaff')}
                                                disabled={isVerifying}
                                                className="flex items-center justify-center min-w-[70px] px-4 py-2 bg-[#0A437A] text-white text-xs font-medium rounded-lg hover:bg-secondary transition-colors whitespace-nowrap cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : t('verify', 'Verify')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-50">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center justify-center min-w-[80px] px-4 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-secondary disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingStaff ? t('save_changes', 'Save Changes') : t('save', 'Save'))}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                        {t('cancel', 'Cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MaintenanceStaffFormModal;
