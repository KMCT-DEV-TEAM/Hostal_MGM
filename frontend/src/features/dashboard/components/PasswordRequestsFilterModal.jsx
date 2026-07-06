import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function PasswordRequestsFilterModal({
    initialStatus,
    onClose,
    onApply
}) {
    const [status, setStatus] = useState(initialStatus || 'All');
    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [showConfirmApply, setShowConfirmApply] = useState(false);

    const resetFilters = () => {
        setStatus('All');
        setShowConfirmReset(false);
        onApply({ statusFilter: 'All' });
    };

    const handleApply = () => {
        setShowConfirmApply(false);
        onApply({ statusFilter: status });
    };

    const statusOptions = [
        { label: 'All Status', value: 'All' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' }
    ];

    return (
        <>
            <Modal bottomSheetOnMobile={true}
                isOpen={true}
                onClose={onClose}
                title="Filter Requests"
                subtitle="Filter password requests by status"
                maxWidth="max-w-md"
                overflowClass="overflow-visible"
                footer={
                    <div className="flex gap-3 w-full">
                        <button
                            type="button"
                            onClick={() => setShowConfirmReset(true)}
                            className="flex-1 py-2.5 border border-[#0A437A] text-[#0A437A] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowConfirmApply(true)}
                            className="flex-1 py-2.5 bg-[#0A437A] text-white rounded-lg text-sm font-medium hover:bg-[#0A437A]/90 transition-colors cursor-pointer"
                        >
                            Filter
                        </button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm mb-1.5 font-medium text-gray-700">Status</label>
                        <Dropdown
                            options={statusOptions}
                            value={status}
                            onChange={(val) => setStatus(val)}
                            placeholder="Select Status"
                            triggerClassName="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0A437A] transition-colors cursor-pointer"
                        />
                    </div>
                </div>
            </Modal>

            <ConfirmationModal
                isOpen={showConfirmReset}
                onClose={() => setShowConfirmReset(false)}
                onConfirm={resetFilters}
                title="Reset Filters"
                message="Are you sure you want to reset all filters?"
                confirmText="Confirm Reset"
            />

            <ConfirmationModal
                isOpen={showConfirmApply}
                onClose={() => setShowConfirmApply(false)}
                onConfirm={handleApply}
                title="Apply Filters"
                message="Are you sure you want to apply these filters?"
                confirmText="Apply Filters"
            />
        </>
    );
}
