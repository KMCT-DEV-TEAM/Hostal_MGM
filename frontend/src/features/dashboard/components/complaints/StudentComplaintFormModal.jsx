import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import ComplaintCategoryService from '@/services/complaintCategory.service';
import { Loader2 } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';

export default function StudentComplaintFormModal({
    editingComplaint,
    isSubmitting,
    onClose,
    onSave,
    onCancel,
    onWithdraw
}) {
    const [formData, setFormData] = useState({
        roomNo: '',
        category: '',
        subject: '',
        description: ''
    });
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await ComplaintCategoryService.getComplaintCategories();
                const fetchedCategories = response.data || [];
                setCategories(fetchedCategories);
                if (fetchedCategories.length > 0 && !editingComplaint) {
                    setFormData(prev => ({ ...prev, category: fetchedCategories[0]._id }));
                }
            } catch (error) {
                console.error("Failed to load categories:", error);
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (editingComplaint) {
            setFormData({
                roomNo: editingComplaint.roomNo || '',
                // Use categoryId from the formatted complaint, or fallback to first category's ID
                category: editingComplaint.categoryId || editingComplaint.category?._id || (categories.length > 0 ? categories[0]._id : ''),
                subject: editingComplaint.subject || '',
                description: editingComplaint.description || ''
            });
        }
    }, [editingComplaint, categories]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal bottomSheetOnMobile={true}
            isOpen={true}
            onClose={onCancel || onClose}
            title={editingComplaint ? "Edit Complaint" : "Add New Complaint"}
            subtitle={editingComplaint ? "Update the details of your complaint" : "Please provide the details of your complaint"}
            maxWidth="max-w-2xl"
            asForm={true}
            onSubmit={handleSubmit}
            footer={
                <div className="flex justify-between items-center w-full gap-3">
                    {editingComplaint ? (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    if (onWithdraw) onWithdraw();
                                }}
                                className="flex-1 px-4 py-2.5 text-[13px] font-medium text-[#0A437A] bg-white border border-[#0A437A] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center"
                            >
                                Withdraw
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 flex items-center justify-center px-4 py-2.5 text-[13px] font-medium text-white bg-[#0A437A] rounded-lg hover:bg-[#073059] transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed text-center"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={onCancel || onClose}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2.5 text-[13px] font-medium text-[#0A437A] bg-white border border-[#0A437A] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 flex items-center justify-center px-4 py-2.5 text-[13px] font-medium text-white bg-[#0A437A] rounded-lg hover:bg-[#073059] transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed text-center"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                            </button>
                        </>
                    )}
                </div>
            }
        >
            <div className="space-y-6">
                <section>
                    <div className="border-b border-gray-100 mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-medium text-text-primary mb-1">Room No <span className="text-danger">*</span></label>
                            <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 focus-within:border-primary">
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
                            <div className="relative">
                                {loadingCategories ? (
                                    <div className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs text-text-primary flex items-center gap-2">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Loading categories...
                                    </div>
                                ) : (
                                    <Dropdown
                                        options={categories.map(cat => ({ value: cat._id, label: cat.name }))}
                                        value={formData.category}
                                        onChange={(val) => setFormData({ ...formData, category: val })}
                                        placeholder="Select category"
                                        minWidth="w-full"
                                        triggerClassName="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs text-text-primary focus:border-[#0A437A] text-start"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[10px] font-medium text-text-primary mb-1">Subject <span className="text-danger">*</span></label>
                            <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 focus-within:border-primary">
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
                            <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 focus-within:border-primary">
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
