
import React from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useTranslation } from '@/hooks/useTranslation';
import Dropdown from '@/components/ui/Dropdown';

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
    const [errors, setErrors] = React.useState({ name: '', phone: '', email: '' });
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
                        disabled={isSubmitting}
                        onClick={(e) => {
                            let newErrors = { ...errors };
                            let hasError = false;
                            if (!hostelForm.name) { newErrors.name = 'Hostel Name is required'; hasError = true; }
                            if (!hostelForm.code) { newErrors.code = 'Hostel Code is required'; hasError = true; }
                            if (!hostelForm.hosteltype) { newErrors.hosteltype = 'Hostel Type is required'; hasError = true; }
                            if (!hostelForm.capacity) { newErrors.capacity = 'Capacity is required'; hasError = true; }
                            if (!hostelForm.location) { newErrors.location = 'Address is required'; hasError = true; }
                            if (hostelForm.phone && hostelForm.phone.length !== 10) { newErrors.phone = 'Phone must be exactly 10 digits'; hasError = true; }
                            if (!hostelForm.phone) { newErrors.phone = 'Phone is required'; hasError = true; }
                            if (errors.email) { hasError = true; }
                            
                            setErrors(newErrors);
                            if (hasError) {
                                e.preventDefault();
                            }
                        }}
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
                                pattern="[A-Za-z]+"
                                title="Only letters are allowed"
                                value={hostelForm.name}
                                onChange={(e) => {
                                    const originalVal = e.target.value;
                                    const cleanVal = originalVal.replace(/[^a-zA-Z]/g, '');
                                    if (originalVal !== cleanVal) {
                                        setErrors(prev => ({ ...prev, name: 'Only letters are allowed' }));
                                    } else {
                                        setErrors(prev => ({ ...prev, name: '' }));
                                    }
                                    setHostelForm({ ...hostelForm, name: cleanVal });
                                }}
                                className={`w-full px-3 py-2 bg-gray-50/50 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs focus:outline-none focus:border-[#0A437A]`}
                                placeholder="Enter hostel name"
                            />
                            {errors.name && <p className="text-red-500 text-[10px] mt-1">{errors.name}</p>}
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('hostel_code')} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={hostelForm.code}
                                onChange={(e) => { setHostelForm({ ...hostelForm, code: e.target.value.toUpperCase() }); setErrors(prev => ({ ...prev, code: '' })); }}
                                className={`w-full px-3 py-2 bg-gray-50/50 border ${errors.code ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs focus:outline-none focus:border-[#0A437A]`}
                                placeholder="HST-001"
                            />
                            {errors.code && <p className="text-red-500 text-[10px] mt-1">{errors.code}</p>}
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('hostel_type')} <span className="text-red-500">*</span></label>
                            <Dropdown
                                options={[
                                    { label: 'Boys Hostel', value: 'boys' },
                                    { label: 'Girls Hostel', value: 'girls' }
                                ]}
                                value={hostelForm.hosteltype}
                                onChange={(val) => { setHostelForm({ ...hostelForm, hosteltype: val }); setErrors(prev => ({ ...prev, hosteltype: '' })); }}
                                placeholder="Select Hostel Type"
                                triggerClassName={`w-full px-3 py-2 bg-gray-50/50 border ${errors.hosteltype ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs focus:outline-none focus:border-[#0A437A] text-left`}
                            />
                            {errors.hosteltype && <p className="text-red-500 text-[10px] mt-1">{errors.hosteltype}</p>}
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
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const cleanVal = val.replace(/\s/g, '');
                                    if (val !== cleanVal) {
                                        setErrors(prev => ({ ...prev, email: 'Spaces are not allowed in email' }));
                                    } else {
                                        setErrors(prev => ({ ...prev, email: '' }));
                                    }
                                    setHostelForm({ ...hostelForm, email: cleanVal });
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === ' ') {
                                        e.preventDefault();
                                        setErrors(prev => ({ ...prev, email: 'Spaces are not allowed in email' }));
                                    }
                                }}
                                className={`w-full px-3 py-2 bg-gray-50/50 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs focus:outline-none focus:border-[#0A437A]`}
                                placeholder="hostel@example.com"
                            />
                            {errors.email && <p className="text-red-500 text-[10px] mt-1">{errors.email}</p>}
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('phone_number')}</label>
                            <input
                                type="tel"
                                value={hostelForm.phone}
                                onChange={(e) => {
                                    const originalVal = e.target.value;
                                    const val = originalVal.replace(/\D/g, '');
                                    if (originalVal !== val) {
                                        setErrors(prev => ({ ...prev, phone: 'Only numbers are allowed' }));
                                    } else {
                                        setErrors(prev => ({ ...prev, phone: '' }));
                                    }
                                    if (val.length <= 10) {
                                        setHostelForm({ ...hostelForm, phone: val });
                                    }
                                }}
                                className={`w-full px-3 py-2 bg-gray-50/50 border ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs focus:outline-none focus:border-[#0A437A]`}
                                placeholder="0000000000"
                            />
                            {errors.phone && <p className="text-red-500 text-[10px] mt-1">{errors.phone}</p>}
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('full_address')} <span className="text-red-500">*</span></label>
                            <textarea
                                required
                                rows="3"
                                value={hostelForm.location}
                                onChange={(e) => { setHostelForm({ ...hostelForm, location: e.target.value }); setErrors(prev => ({ ...prev, location: '' })); }}
                                className={`w-full px-3 py-2 bg-gray-50/50 border ${errors.location ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs focus:outline-none focus:border-[#0A437A]`}
                                placeholder={t('full address placeholder')}
                            ></textarea>
                            {errors.location && <p className="text-red-500 text-[10px] mt-1">{errors.location}</p>}
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-semibold text-[#0A437A] mb-1">{t('capacity_details')}</h3>
                    <h5 className="text-[10px] text-gray-500 mb-4">{t('capacity_details_desc')}</h5>
                    <div className="border-b border-gray-100 mb-4" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-black mb-1">{t('total_capacity')} <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={hostelForm.capacity}
                                onChange={(e) => { setHostelForm({ ...hostelForm, capacity: parseInt(e.target.value) || '' }); setErrors(prev => ({ ...prev, capacity: '' })); }}
                                className={`w-full px-3 py-2 bg-gray-50/50 border ${errors.capacity ? 'border-red-500' : 'border-gray-200'} rounded-lg text-xs focus:outline-none focus:border-[#0A437A]`}
                                placeholder="100"
                            />
                            {errors.capacity && <p className="text-red-500 text-[10px] mt-1">{errors.capacity}</p>}
                        </div>
                        
                        {editingHostel && (
                            <div className="col-span-1">
                                <label className="block text-[10px] font-medium text-black mb-1">{t('status')} <span className="text-red-500">*</span></label>
                                <Dropdown
                                    options={[
                                        { value: 'Active', label: 'Active' },
                                        { value: 'Inactive', label: 'Inactive' }
                                    ]}
                                    value={hostelForm.isActive !== undefined ? (hostelForm.isActive ? 'Active' : 'Inactive') : (hostelForm.status || 'Active')}
                                    onChange={(val) => setHostelForm({ ...hostelForm, isActive: val === 'Active' })}
                                    triggerClassName="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A] cursor-pointer text-left"
                                />
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </Modal>
    );
};

export default HostelFormModal;
