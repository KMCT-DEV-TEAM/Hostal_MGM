import React from 'react';
import Modal from '@/components/ui/Modal';

export default function ParentFormModal({
    editingParent,
    onClose,
    onSave,
}) {
    const isEdit = !!editingParent;

    return (
        <Modal
            isOpen
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
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="px-5 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-secondary"
                    >
                        {isEdit ? 'Save Changes' : 'Save'}
                    </button>
                </div>
            }
        >
            <div className="grid grid-cols-2 gap-5">

                {/* Full Name */}
                <div className={isEdit ? 'col-span-2' : ''}>
                    <label className="block mb-1.5 text-xs font-medium">
                        Full Name *
                    </label>

                    <input
                        required
                        defaultValue={editingParent?.name || ''}
                        placeholder="Enter full name"
                        className="w-full h-10 px-3 border border-gray-200 rounded-md text-xs outline-none focus:border-secondary"
                    />
                </div>

                {/* Email - Add only */}
                {!isEdit && (
                    <div>
                        <label className="block mb-1.5 text-xs font-medium">
                            Email Address *
                        </label>

                        <input
                            type="email"
                            required
                            defaultValue={editingParent?.email || ''}
                            placeholder="Enter email address"
                            className="w-full h-10 px-3 border border-gray-200 rounded-md text-xs outline-none focus:border-secondary"
                        />
                    </div>
                )}

                {/* Phone */}
                <div>
                    <label className="block mb-1.5 text-xs font-medium">
                        Phone Number *
                    </label>

                    <div className="flex h-10 border border-gray-200 rounded-md overflow-hidden focus-within:border-secondary">
                        <div className="px-3 border-r border-gray-200 flex items-center gap-2 text-xs shrink-0">
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
                            className="flex-1 px-3 text-xs outline-none"
                        />
                    </div>
                </div>

                {/* Relation */}
                <div>
                    <label className="block mb-1.5 text-xs font-medium">
                        Relation *
                    </label>

                    <select
                        defaultValue={editingParent?.relation || ''}
                        className="w-full h-10 px-3 border border-gray-200 rounded-md text-xs outline-none focus:border-secondary"
                    >
                        <option value="">Select Relation</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                    </select>
                </div>

            </div>
        </Modal>
    );
}
