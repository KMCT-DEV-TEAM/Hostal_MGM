
import React from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useTranslation } from '@/hooks/useTranslation';

const HostelFormModal = ({
    activeModal,
    handleCancel,
    editingHostel,
    handleSaveHostel,
    hostelForm,
    setHostelForm,
    isSubmitting
}) => {
    const { t } = useTranslation();
    return (
        <Modal
            isOpen={activeModal === 'hostel'}
            onClose={handleCancel}
            title={editingHostel ? t('edit_hostel') : t('add_hostel')}
            subtitle={t('add_hostel_desc')}
            asForm={true}
            onSubmit={handleSaveHostel}
            maxWidth="max-w-xl"
            bottomSheetOnMobile={true}
            footer={
                <>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center justify-center min-w-[80px] px-4 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-secondary cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 size={14} className="animate-spin mx-auto" /> : (editingHostel ? t('save_changes') : t('save'))}
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
                    <h5 className="text-[10px] text-gray-500 mb-4">{t('basic_info_desc')}</h5>
                    <div className="border-b border-gray-100 mb-4" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('hostel_name')} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={hostelForm.name}
                                onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                placeholder="Enter hostel name"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('hostel_code')} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={hostelForm.code}
                                onChange={(e) => setHostelForm({ ...hostelForm, code: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                placeholder="e.g. HST-001"
                            />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('hostel_type')} <span className="text-red-500">*</span></label>
                            <select
                                required
                                value={hostelForm.hosteltype}
                                onChange={(e) => setHostelForm({ ...hostelForm, hosteltype: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A] appearance-none"
                            >
                                <option value="boys">Boys Hostel</option>
                                <option value="girls">Girls Hostel</option>
                            </select>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-semibold text-[#0A437A] mb-1">{t('contact_location')}</h3>
                    <h5 className="text-[10px] text-gray-500 mb-4">{t('contact_location_desc')}</h5>
                    <div className="border-b border-gray-100 mb-4" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('email_address')}</label>
                            <input
                                type="email"
                                value={hostelForm.email}
                                onChange={(e) => setHostelForm({ ...hostelForm, email: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                placeholder="hostel@example.com"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('phone_number')}</label>
                            <input
                                type="tel"
                                value={hostelForm.phone}
                                onChange={(e) => setHostelForm({ ...hostelForm, phone: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                placeholder="e.g. 9876543210"
                            />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('full_address')} <span className="text-red-500">*</span></label>
                            <textarea
                                required
                                rows="3"
                                value={hostelForm.location}
                                onChange={(e) => setHostelForm({ ...hostelForm, location: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                placeholder={t('full_address_placeholder')}
                            ></textarea>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-semibold text-[#0A437A] mb-1">{t('capacity_details')}</h3>
                    <h5 className="text-[10px] text-gray-500 mb-4">{t('capacity_details_desc')}</h5>
                    <div className="border-b border-gray-100 mb-4" />
                    
                    <div className="grid grid-cols-1 gap-4">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('total_capacity')} <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={hostelForm.capacity}
                                onChange={(e) => setHostelForm({ ...hostelForm, capacity: parseInt(e.target.value) || '' })}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                placeholder="e.g. 100"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </Modal>
    );
};

export default HostelFormModal;
