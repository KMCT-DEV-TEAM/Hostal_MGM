import React from 'react';
import Modal from '@/components/ui/Modal';

export default function ParentFormModal({ editingParent, onClose, onSave }) {
    const isEdit = !!editingParent;

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={isEdit ? 'Edit Parent' : 'Add New Parent'}
            titleSize="text-lg"
            subtitle="Edit the details of parent"
            maxWidth="max-w-xl"
            asForm
            onSubmit={(e) => {
                e.preventDefault();
                onSave?.();
            }}
            footer={
                <>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-secondary transition-colors"
                    >
                        Save
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </>
            }
        >
            <div className="space-y-6">

                {/* Basic Info */}
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="md:col-span-2">
                            <label className="block text-xs mb-1.5 font-medium">
                                Full Name *
                            </label>

                            <input
                                required
                                defaultValue={editingParent?.name || ''}
                                placeholder="Enter full name"
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                            />
                        </div>

                    </div>
                </section>

                {/* Contact */}
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Phone */}
                        <div>
                            <label className="block text-xs mb-1.5 font-medium">
                                Phone Number *
                            </label>

                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-secondary">
                                <div className="px-3 py-2 border-r border-gray-200 flex items-center gap-2 text-xs whitespace-nowrap">
                                    <img
                                        src="https://flagcdn.com/w20/in.png"
                                        alt="India"
                                        className="w-4 h-3"
                                    />
                                    +91
                                </div>

                                <input
                                    type="text"
                                    required
                                    defaultValue={editingParent?.phone || ''}
                                    placeholder="00000 00000"
                                    className="w-full px-3 py-2 outline-none text-xs"
                                />
                            </div>
                        </div>

                        {/* Relation */}
                        <div>
                            <label className="block text-xs mb-1.5 font-medium">
                                Relation *
                            </label>

                            <select
                                defaultValue={editingParent?.relation || ''}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                            >
                                <option value="">Select Relation</option>
                                <option value="Father">Father</option>
                                <option value="Mother">Mother</option>
                                <option value="Guardian">Guardian</option>
                            </select>
                        </div>

                    </div>
                </section>

            </div>
        </Modal>
    );
}