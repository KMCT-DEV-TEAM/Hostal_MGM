import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';

import Dropdown from '@/components/ui/Dropdown';

export default function ExportFilterModal({ isOpen, onClose, onExport, isExporting }) {
    const [filters, setFilters] = useState({
        isActive: '',
        relationship: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onExport(filters);
    };

    const statusOptions = [
        { label: 'All Statuses', value: '' },
        { label: 'Active Only', value: 'true' },
        { label: 'Inactive Only', value: 'false' },
    ];

    const relationOptions = [
        { label: 'All Relations', value: '' },
        { label: 'Father', value: 'father' },
        { label: 'Mother', value: 'mother' },
        { label: 'Guardian', value: 'guardian' },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Export Parents Data"
            subtitle="Select filters to apply before downloading"
            maxWidth="max-w-md"
            asForm
            onSubmit={handleSubmit}
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                        disabled={isExporting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isExporting}
                        className="px-5 py-2 bg-[#0A437A] text-white rounded-md text-xs font-medium hover:bg-[#083663] disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                    >
                        {isExporting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : 'Export to Excel'}
                    </button>
                </div>
            }
        >
            <div className="grid grid-cols-2 gap-5">
                <div className="relative z-20">
                    <label className="block mb-1.5 text-xs font-medium text-gray-700">Account Status</label>
                    <Dropdown
                        options={statusOptions}
                        value={filters.isActive}
                        onChange={(val) => setFilters(prev => ({ ...prev, isActive: val }))}
                        className="w-full"
                    />
                </div>

                <div className="relative z-10">
                    <label className="block mb-1.5 text-xs font-medium text-gray-700">Relationship</label>
                    <Dropdown
                        options={relationOptions}
                        value={filters.relationship}
                        onChange={(val) => setFilters(prev => ({ ...prev, relationship: val }))}
                        className="w-full"
                    />
                </div>
            </div>
        </Modal>
    );
}
