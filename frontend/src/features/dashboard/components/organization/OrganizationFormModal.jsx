import React from 'react';
import { X, Loader2 } from 'lucide-react';

const OrganizationFormModal = ({
    isModalOpen,
    setIsModalOpen,
    isEditMode,
    formData,
    handleInputChange,
    handleSubmit,
    handleCancel,
    isSubmitting
}) => {
    if (!isModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <form
                onSubmit={handleSubmit}
                className="
                    bg-white
                    rounded-2xl
                    w-full
                    max-w-3xl
                    max-h-[90vh]
                    overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                    p-8
                    shadow-2xl
                    animate-in
                    fade-in
                    zoom-in-95
                    duration-200
                "
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {isEditMode ? 'Edit Organization' : 'Add New Organization'}
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">
                            {isEditMode ? 'Update the details for this organization' : 'Fill in the details to manually create a new organization'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="space-y-8">
                    <section>
                        <h3 className="text-[14px] font-medium text-primary">Basic Info</h3>
                        <h5 className='text-xs font-medium text-[#777777] mb-4 pb-2 border-b border-gray-200 '>Basic details of the organization</h5>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-xs mb-1.5 font-medium">Organization Name *</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0A437A]"
                                    placeholder="Enter organization name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs mb-1.5 font-medium">Code *</label>
                                <input
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0A437A]"
                                    placeholder="e.g. KMCTENG"
                                />
                            </div>
                            <div>
                                <label className="block text-xs mb-1.5 font-medium">Organization Number *</label>
                                <input
                                    name="organisationNumber"
                                    value={formData.organisationNumber}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0A437A]"
                                    placeholder="e.g. ORG001"
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[14px] font-medium text-primary">Contact & Address</h3>
                        <h5 className="text-xs font-medium text-[#777777] mb-4 pb-2 border-b border-gray-200">Contact information of the organization</h5>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-medium text-black mb-1">Email Address *</label>
                                <input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    type="email"
                                    required
                                    placeholder="info@example.com"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-black mb-1">Phone Number *</label>
                                <div className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#0A437A]">
                                    <div className="px-2 py-2 border-r border-gray-200 flex items-center gap-1 text-xs text-black bg-gray-50">
                                        <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-4 h-3" />
                                        +91
                                    </div>
                                    <input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 10) {
                                                handleInputChange({ target: { name: 'phone', value } });
                                            }
                                        }}
                                        type="text"
                                        required
                                        maxLength="10"
                                        pattern="[0-9]{10}"
                                        title="Please enter exactly 10 digits"
                                        placeholder="9876543210"
                                        className="w-full px-3 py-2 text-xs outline-none"
                                    />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-black mb-1">Full Address *</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    rows="3"
                                    placeholder="Enter complete address"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 text-xs font-medium text-white bg-[#0A437A] rounded-lg hover:bg-[#083660] transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            {isEditMode ? 'Save changes' : 'Save'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>

                    </div>
                </div>
            </form>
        </div>
    );
};

export default OrganizationFormModal;
