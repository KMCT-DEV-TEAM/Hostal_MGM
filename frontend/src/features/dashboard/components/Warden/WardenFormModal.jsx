import React from 'react';
import { X, ChevronDown } from 'lucide-react';

export default function WardenFormModal({
    activeModal,
    setActiveModal,
    editingWarden,
    handleSaveWarden,
    handleCancel,
    AVAILABLE_HOSTELS
}) {
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
                            {editingWarden ? 'Edit Warden' : 'Add New Warden'}
                        </h2>
                        <p className="text-xs text-[#777777] mt-0.5">
                            {editingWarden ? 'Edit Warden account details' : 'Create a new Warden account'}
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
                        <h3 className="text-sm font-semibold text-primary mb-1">Basic Info</h3>
                        <h5 className='text-xs text-[#777777] mb-4'>Basic contact information of the Warden</h5>
                        <div className="border-b border-gray-100 mb-4" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-medium text-black mb-1">First Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="First name"
                                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-medium text-black mb-1">Last Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Last name"
                                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-medium text-black mb-1">Phone Number *</label>
                                <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 focus-within:border-[#0A437A]">
                                    <div className="px-2 py-2 border-r border-gray-200 flex items-center gap-1 text-xs text-black">
                                        <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-4 h-3" />
                                        +91
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        placeholder="00000 00000"
                                        className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                                    />
                                </div>
                            </div>

                            {/* Conditionally hide Email if editing */}
                            {!editingWarden && (
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-medium text-black mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="warden@example.com"
                                        className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Conditionally hide Organization section if editing */}
                    {!editingWarden && (
                        <section>
                            <h3 className="text-sm font-semibold text-[#0A437A] mb-2">Hostel Assignment</h3>
                            <h5 className='text-xs text-[#777777]'>Assign an Hostel to this administrator</h5>
                            <div className="border-b border-gray-100 mb-4" />
                            <label className="block text-[10px] font-medium text-black mb-1">Assign Hostel*</label>
                            <div className="relative">
                                <select className="w-full appearance-none bg-gray-50/50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-[#777777] focus:outline-none focus:border-[#0A437A] cursor-pointer">
                                    <option>Select an organization</option>
                                    {AVAILABLE_HOSTELS.map(h => (
                                        <option key={h} value={h}>{h}</option>
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
                        className="px-4 py-2 bg-[rgb(10,67,122)] text-white rounded-lg text-xs font-medium hover:bg-[#083561] cursor-pointer"
                    >
                        {editingWarden ? 'Save Changes' : 'Save'}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-primary hover:bg-gray-50 cursor-pointer"
                    >
                        Cancel
                    </button>

                </div>
            </form>
        </div>
    );
}
