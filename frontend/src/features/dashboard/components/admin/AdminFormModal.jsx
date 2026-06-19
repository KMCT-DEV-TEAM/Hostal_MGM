import React from 'react';
import { X, ChevronDown, Loader2 } from 'lucide-react';

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
    if (activeModal !== 'admin') return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
            <form
                onSubmit={handleSaveAdmin}
                className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
                        </h2>
                        <p className="text-xs text-[#777777] mt-0.5">
                            Create a new Admin account
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
                        <h3 className="text-xs font-semibold text-primary mb-1">Basic Info</h3>
                        <h5 className='text-xs text-[#777777] mb-4'>Basic contact information of the Admin</h5>
                        <div className="border-b border-gray-100 mb-4" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-medium text-black mb-1">First Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="First name"
                                    value={adminForm.name ? adminForm.name.split(' ')[0] : ''}
                                    onChange={(e) => setAdminForm({ ...adminForm, name: `${e.target.value} ${adminForm.name ? adminForm.name.split(' ').slice(1).join(' ') || '' : ''}`.trim() })}
                                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-medium text-black mb-1">Last Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Last name"
                                    value={adminForm.name ? adminForm.name.split(' ').slice(1).join(' ') : ''}
                                    onChange={(e) => setAdminForm({ ...adminForm, name: `${adminForm.name ? adminForm.name.split(' ')[0] : ''} ${e.target.value}`.trim() })}
                                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-medium text-gray-500 mb-1">Phone Number *</label>
                                <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50">
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
                                        value={adminForm.phone}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) {
                                                setAdminForm({ ...adminForm, phone: val });
                                            }
                                        }}
                                        className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                                    />
                                </div>
                            </div>

                            {/* Conditionally hide Email if editing */}
                            {!editingAdmin && (
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-medium text-black mb-1">Email Address *</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            required
                                            value={adminForm.email || ''}
                                            onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                                            placeholder="johndoe@example.com"
                                            className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                            disabled={isEmailVerified}
                                        />
                                        {isEmailVerified ? (
                                            <button type="button" className="px-4 py-2 bg-green-50 text-success text-[10px] font-medium rounded-lg flex items-center gap-1 cursor-default whitespace-nowrap">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                Verified
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleVerifyClick(adminForm.email, 'addAdmin')}
                                                disabled={isVerifying}
                                                className="flex items-center justify-center min-w-[70px] px-4 py-2 bg-[#0A437A] text-white text-xs font-medium rounded-lg hover:bg-[#083663] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Conditionally hide Organization section if editing */}
                    {!editingAdmin && (
                        <section>
                            <h3 className="text-xs font-semibold text-[#0A437A] mb-2">Organization</h3>
                            <div className="border-b border-gray-100 mb-4" />
                            <label className="block text-[10px] font-medium text-gray-500 mb-1">Assign Organization *</label>
                            <div className="relative">
                                <select
                                    className="w-full appearance-none bg-gray-50/50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0A437A]"
                                    value={adminForm.organization || ''}
                                    onChange={(e) => setAdminForm({ ...adminForm, organization: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Select an Organization</option>
                                    {organizations.map(org => (
                                        <option key={org._id} value={org._id}>{org.name}</option>
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
                        disabled={isSubmitting}
                        className="flex items-center justify-center min-w-[80px] px-4 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-[#083561] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingAdmin ? 'Save Changes' : 'Save')}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                        Cancel
                    </button>

                </div>
            </form>
        </div>
    );
};

export default AdminFormModal;
