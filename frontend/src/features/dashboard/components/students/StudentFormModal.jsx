import React from 'react';
import { X } from 'lucide-react';

export default function StudentFormModal({ editingStudent, onClose, onSave }) {
    // If it's the simplified edit modal (from the original code snippet)
    if (editingStudent) {
        return (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                <form 
                    className="bg-white rounded-2xl w-full max-w-4xl p-8 shadow-2xl"
                    onSubmit={(e) => { e.preventDefault(); onSave && onSave(); }}
                >
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Edit Student
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Example of a controlled input field */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium">Full Name *</label>
                        <input
                            defaultValue={editingStudent?.name || ''}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-200">
                        <button type="submit" className="px-6 py-2 bg-[#0A437A] text-white rounded-lg text-xs">
                            Save Changes
                        </button>
                        <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // Add New Student Modal (from the original code snippet)
    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <form
                className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto max-h-[calc(100vh-160px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                onSubmit={(e) => { e.preventDefault(); onSave && onSave(); }}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Add New Student</h2>
                        <p className="text-xs text-gray-400 mt-1">Fill in the details to manually create a new Student</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Basic Info */}
                    <section>
                        <h3 className="text-[14px] font-medium text-primary">Basic Info</h3>
                        <h5 className='text-xs font-medium text-[#777777] mb-4 pb-2 border-b border-gray-200'>Basic contact information of the student</h5>
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="block text-xs mb-1.5 font-medium">Admission No *</label><input required className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary" placeholder="Enter the student id" /></div>
                            <div><label className="block text-xs mb-1.5 font-medium">Full Name *</label><input required className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary" placeholder="Enter your full name" /></div>
                            <div><label className="block text-xs mb-1.5 font-medium">Gender *</label><select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400 outline-none focus:border-secondary"><option>Select gender</option></select></div>
                            <div><label className="block text-xs mb-1.5 font-medium">Date Of Birth *</label><input type="date" className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400 outline-none focus:border-secondary" /></div>
                        </div>
                    </section>

                    {/* Academic Information */}
                    <section>
                        <h3 className="text-[14px] font-medium text-primary ">Academic Information</h3>
                        <h5 className="text-xs font-medium text-[#777777] mb-4 pb-2 border-b border-gray-200">Academic information of the student</h5>
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="block text-xs mb-1.5 font-medium">Organization *</label><select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400 outline-none focus:border-secondary"><option>Select</option></select></div>
                            <div><label className="block text-xs mb-1.5 font-medium">Course *</label><select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400 outline-none focus:border-secondary"><option>Select</option></select></div>
                            <div><label className="block text-xs mb-1.5 font-medium">Department *</label><select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400 outline-none focus:border-secondary"><option>Select</option></select></div>
                            <div><label className="block text-xs mb-1.5 font-medium">Academic Year *</label><select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400 outline-none focus:border-secondary"><option>Select</option></select></div>
                            <div className="col-span-2"><label className="block text-xs mb-1.5 font-medium">Assign Hostel *</label><select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400 outline-none focus:border-secondary"><option>Select an Hostel</option></select></div>
                        </div>
                    </section>

                    {/* Contact & Address */}
                    <section className="w-full">
                        <div className='w-full'>
                            <h3 className="text-[14px] font-medium text-primary">Contact Information</h3>
                            <h5 className="text-xs font-medium text-[#777777] mb-4 pb-2 border-b border-gray-200">Contact information of the student</h5>
                            <div className='flex w-full justify-between gap-6'>
                                <div className="col-span-2 w-[50%]">
                                    <label className="block text-xs font-medium text-black mb-1">Phone Number *</label>
                                    <div className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:border-secondary">
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
                                <div className="col-span-2 w-[50%]">
                                    <label className="block text-xs font-medium text-black mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="Enter the email"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[14px] font-medium text-primary">Address Information</h3>
                        <h5 className="text-xs font-medium text-[#777777] mb-4 pb-2 border-b border-gray-200 ">Address information of the student</h5>
                        <label className="block text-xs mb-1.5 font-medium">Full Address *</label>
                        <textarea className="w-full p-2.5 border border-gray-200 rounded-lg text-xs h-[106px] outline-none focus:border-secondary" placeholder="text your address" />
                    </section>

                    {/* Parent Information */}
                    <section>
                        <h3 className="text-sm w-full font-medium text-primary mb-4 pb-2 border-b border-gray-200 ">Parent Information</h3>
                        <div className="grid grid-cols-2 w-full gap-6">
                            <div><label className="block text-xs mb-1.5 font-medium text-black">Full Name *</label><input placeholder="Enter the name" className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary" /></div>
                            <div><label className="block text-xs mb-1.5 font-medium text-black">Relation *</label><select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400 outline-none focus:border-secondary"><option>Select</option></select></div>
                        </div>
                        <div className='flex w-full justify-between gap-6 mt-6'>
                            <div className="col-span-2 w-[50%]">
                                <label className="block text-xs font-medium text-black mb-1">Phone Number *</label>
                                <div className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:border-secondary">
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
                            <div className="col-span-2 w-[50%]">
                                <label className="block text-xs font-medium text-black mb-1">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter the email"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-200">
                    <button type="submit" className="px-6 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-[#0A437A]/90 transition-colors">Save</button>
                    <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                </div>
            </form>
        </div>
    );
}
