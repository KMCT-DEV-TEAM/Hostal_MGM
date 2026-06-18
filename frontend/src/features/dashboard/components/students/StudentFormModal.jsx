import React from 'react';
import Modal from '@/components/ui/Modal';

export default function StudentFormModal({ editingStudent, onClose, onSave }) {
    // If it's the simplified edit modal (from the original code snippet)
    if (editingStudent) {
        return (
            <Modal
                isOpen={true}
                onClose={onClose}
                title="Edit Student"
                maxWidth="max-w-4xl"
                asForm={true}
                onSubmit={(e) => { e.preventDefault(); onSave && onSave(); }}
                footer={
                    <>
                        <button type="submit" className="px-6 py-2 bg-[#0A437A] text-white rounded-lg text-xs hover:bg-[#0A437A]/90 transition-colors">
                            Save Changes
                        </button>
                        <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                    </>
                }
            >
                {/* Example of a controlled input field */}
                <div>
                    <label className="block text-xs mb-1.5 font-medium">Full Name *</label>
                    <input
                        defaultValue={editingStudent?.name || ''}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                        placeholder="Enter your full name"
                    />
                </div>
            </Modal>
        );
    }

    // Add New Student Modal (from the original code snippet)
    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Add New Student"
            subtitle="Fill in the details to manually create a new Student"
            maxWidth="max-w-4xl"
            asForm={true}
            onSubmit={(e) => { e.preventDefault(); onSave && onSave(); }}
            footer={
                <>
                    <button type="submit" className="px-6 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-[#0A437A]/90 transition-colors">Save</button>
                    <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                </>
            }
        >
            <div className="space-y-8">
                {/* Basic Info */}
                <section>
                    <h3 className="text-[14px] font-medium text-primary">Basic Info</h3>
                    <h5 className='text-xs font-medium text-text-secondary mb-4 pb-2 border-b border-gray-200'>Basic contact information of the student</h5>
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
                    <h5 className="text-xs font-medium text-text-secondary mb-4 pb-2 border-b border-gray-200">Academic information of the student</h5>
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
                        <h5 className="text-xs font-medium text-text-secondary mb-4 pb-2 border-b border-gray-200">Contact information of the student</h5>
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
                    <h5 className="text-xs font-medium text-text-secondary mb-4 pb-2 border-b border-gray-200 ">Address information of the student</h5>
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
        </Modal>
    );
}
