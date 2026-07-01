import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import DateInput from '@/components/ui/DateInput';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function LogsFilterModal({
    initialStartDate,
    initialEndDate,
    initialStatus,
    onClose,
    onApply
}) {
    const [startDate, setStartDate] = useState(initialStartDate || '');
    const [endDate, setEndDate] = useState(initialEndDate || '');
    const [status, setStatus] = useState(initialStatus || 'All');
    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [errors, setErrors] = useState({});

    const resetFilters = () => {
        setStartDate('');
        setEndDate('');
        setStatus('All');
        setShowConfirmReset(false);
        setErrors({});
        onApply({ startDate: '', endDate: '', statusFilter: 'All' });
    };

    const handleFilterClick = () => {
        const isNothingApplied = !startDate && !endDate && status === 'All';
        
        if (isNothingApplied) {
            setErrors({});
            handleApply();
            return;
        }

        const newErrors = {};
        if (!startDate) newErrors.startDate = 'From date is required';
        if (!endDate) newErrors.endDate = 'To date is required';
        if (status === 'All') newErrors.status = 'Status is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});
        handleApply();
    };

    const handleApply = () => {
        onApply({ startDate, endDate, statusFilter: status });
    };

    const statusOptions = [
        { label: 'All Status', value: 'All' },
        { label: 'Success', value: 'Success' },
        { label: 'Error', value: 'Error' },
        { label: 'Warning', value: 'Warning' }
    ];

    return (
        <>
            <Modal bottomSheetOnMobile={true}
                isOpen={true}
                onClose={onClose}
                title="Filter Logs"
                subtitle="Search logs by specific filters"
                maxWidth="max-w-md"
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
                            onClick={handleFilterClick}
                            className="flex-1 py-2.5 bg-[#0A437A] text-white rounded-lg text-sm font-medium hover:bg-[#0A437A]/90 transition-colors cursor-pointer"
                        >
                            Search
                        </button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm mb-1.5 font-medium text-gray-700">From Date</label>
                        <DateInput
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setErrors(prev => ({ ...prev, startDate: null })); }}
                            placeholder="Select from date"
                            className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0A437A] transition-colors"
                        />
                        {errors.startDate && <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium animate-in fade-in">{errors.startDate}</p>}
                    </div>

                    <div>
                        <label className="block text-sm mb-1.5 font-medium text-gray-700">To Date</label>
                        <DateInput
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setErrors(prev => ({ ...prev, endDate: null })); }}
                            placeholder="Select to date"
                            className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0A437A] transition-colors"
                        />
                        {errors.endDate && <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium animate-in fade-in">{errors.endDate}</p>}
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
        </>
    );
}
