import React from 'react';
import { X, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

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
    if (activeModal !== 'warden') return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
            <form
                onSubmit={handleSaveWarden}
                className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {editingWarden ? t('edit_warden') : t('add_warden')}
                        </h2>
                        <p className="text-xs text-[#777777] mt-0.5">
                            {editingWarden ? t('edit_warden_desc') : t('add_warden_desc')}
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
                        <h3 className="text-sm font-semibold text-primary mb-1">{t('basic_info')}</h3>
                        <h5 className='text-xs text-[#777777] mb-4'>{t('basic_info_desc')}</h5>
                        <div className="border-b border-gray-100 mb-4" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-medium text-black mb-1">{t('first_name')} *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={t('first_name_placeholder')}
                                    value={wardenForm.name ? wardenForm.name.split(' ')[0] : ''}
                                    onChange={(e) => setWardenForm({ ...wardenForm, name: `${e.target.value} ${wardenForm.name ? wardenForm.name.split(' ').slice(1).join(' ') || '' : ''}`.trim() })}
                                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-medium text-black mb-1">{t('last_name')} *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={t('last_name_placeholder')}
                                    value={wardenForm.name ? wardenForm.name.split(' ').slice(1).join(' ') : ''}
                                    onChange={(e) => setWardenForm({ ...wardenForm, name: `${wardenForm.name ? wardenForm.name.split(' ')[0] : ''} ${e.target.value}`.trim() })}
                                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-medium text-black mb-1">{t('phone_number')} *</label>
                                <div className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#0A437A]">
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
                                        value={wardenForm.phone || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) {
                                                setWardenForm({ ...wardenForm, phone: val });
                                            }
                                        }}
                                        placeholder="0000000000"
                                        className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                                    />
                                </div>
                            </div>

                            {/* Conditionally hide Email if editing */}
                            {!editingWarden && (
                                <div className="col-span-2 mt-2">
                                    <label className="block text-[10px] font-medium text-black mb-1">{t('email_address')} *</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="email"
                                            required
                                            placeholder="email@example.com"
                                            value={wardenForm.email || ''}
                                            onChange={(e) => setWardenForm({ ...wardenForm, email: e.target.value })}
                                            disabled={editingWarden}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0A437A] disabled:bg-gray-50 disabled:text-gray-500 flex-1"
                                        />
                                        {isEmailVerified ? (
                                            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-3 py-2.5 rounded-lg shrink-0">
                                                <Check size={14} className="stroke-[3]" /> {t('verified')}
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleVerifyClick('warden')}
                                                disabled={!wardenForm.email || isVerifying || editingWarden}
                                                className={`px-4 py-2.5 text-xs font-medium rounded-lg shrink-0 flex items-center justify-center min-w-[70px] ${!wardenForm.email || editingWarden
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-primary text-white hover:bg-blue-700 cursor-pointer'
                                                    }`}
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

                    {!editingWarden && (
                        <div className="flex justify-end mb-4">
                            <button
                                type="button"
                                onClick={() => setWardenForm({ ...wardenForm, password: Math.random().toString(36).slice(-8) + 'aA1@' })}
                                className="text-xs text-primary font-medium hover:underline cursor-pointer"
                            >
                                {t('generate_password')}
                            </button>
                        </div>
                    )}

                    {!editingWarden && (
                        <section>
                            <h3 className="text-sm font-semibold text-[#0A437A] mb-2">{t('assigned_hostel')}</h3>
                            <h5 className="text-xs text-[#777777] mb-4">{t('assigned_hostel_desc')}</h5>
                            <div className="border-b border-gray-100 mb-4" />

                            <label className="block text-[10px] font-medium text-black mb-1">{t('assign_hostel')}*</label>
                            <div className="relative">
                                <select
                                    required
                                    value={wardenForm.hostel}
                                    onChange={(e) => setWardenForm({ ...wardenForm, hostel: e.target.value })}
                                    className="w-full appearance-none px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-xs text-gray-700 focus:outline-none focus:border-[#0A437A] pr-10 cursor-pointer"
                                >
                                    <option value="" disabled>{t('select_hostel')}</option>
                                    {AVAILABLE_HOSTELS.map(h => (
                                        <option key={h._id || h} value={h._id || h}>{h.name || h}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-50">
                    <button
                        type="submit"
                        disabled={!isEmailVerified && !editingWarden || isSubmitting}
                        className="px-6 py-2 text-xs font-medium text-white bg-[#0A437A] rounded-lg hover:bg-[#083660] transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                        {editingWarden ? t('save_changes') : t('save')}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        {t('cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}
