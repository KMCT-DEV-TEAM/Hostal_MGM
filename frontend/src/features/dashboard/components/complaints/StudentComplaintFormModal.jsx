import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';

export default function StudentComplaintFormModal({
    editingComplaint,
    onClose,
    onSave,
    onCancel,
    onWithdraw
}) {
    const [formData, setFormData] = useState({
        roomNo: '',
        category: 'Mess',
        subject: '',
        description: ''
    });

    useEffect(() => {
        if (editingComplaint) {
            setFormData({
                roomNo: editingComplaint.roomNo || '',
                category: editingComplaint.category || 'Mess',
                subject: editingComplaint.subject || '',
                description: editingComplaint.description || ''
            });
        } else {
            setFormData({
                roomNo: '',
                category: 'Mess',
                subject: '',
                description: ''
            });
        }
    }, [editingComplaint]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal
            isOpen={true}
            onClose={onCancel || onClose}
            title={editingComplaint ? "Edit Complaint" : "Add New Complaint"}
            subtitle={editingComplaint ? "Update the details of your complaint" : "Please provide the details of your complaint"}
            maxWidth="max-w-2xl"
            asForm={true}
            onSubmit={handleSubmit}
            footer={
                <div className="flex justify-between items-center w-full">
                    <div>
                        {editingComplaint && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (onWithdraw) onWithdraw();
                                }}
                                className="px-6 py-2 text-xs font-medium text-danger bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                            >
                                Withdraw Complaint
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="px-6 py-2 text-xs font-medium text-white bg-[#0A437A] rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 cursor-pointer"
                        >
                            {editingComplaint ? 'Save Changes' : 'Save'}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel || onClose}
                            className="px-6 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                <section>
                    <div className="border-b border-gray-100 mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-text-primary mb-1">Room No <span className="text-danger">*</span></label>
                            <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 focus-within:border-[#0A437A]">
                                <input
                                    required
                                    type="text"
                                    placeholder="101"
                                    value={formData.roomNo}
                                    onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                                    className="w-full px-3 py-2 outline-none bg-transparent text-xs text-text-primary"
                                />
                            </div>
                        </div>

                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-text-primary mb-1">Category <span className="text-danger">*</span></label>
                            <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 focus-within:border-[#0A437A]">
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 outline-none bg-transparent text-xs text-text-primary appearance-none cursor-pointer"
                                >
                                    <option value="Mess">Mess</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-medium text-text-primary mb-1">Subject <span className="text-danger">*</span></label>
                            <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 focus-within:border-[#0A437A]">
                                <input
                                    required
                                    type="text"
                                    placeholder="Food was cold and not fresh"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-3 py-2 outline-none bg-transparent text-xs text-text-primary"
                                />
                            </div>
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-medium text-text-primary mb-1">Description</label>
                            <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 focus-within:border-[#0A437A]">
                                <textarea
                                    rows={4}
                                    placeholder="Please provide any additional details..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 outline-none bg-transparent text-xs text-text-primary resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </Modal>
    );
}
