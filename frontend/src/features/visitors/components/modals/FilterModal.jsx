import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import DateInput from '@/components/ui/DateInput';
import Dropdown from '@/components/ui/Dropdown';

export default function FilterModal({
    isOpen,
    onClose,
    filters = {},
    onFilter,
    statusOptions = null,
    showDateFilters = true
}) {
    const [localStatus, setLocalStatus] = useState('');
    const [localFromDate, setLocalFromDate] = useState('');
    const [localToDate, setLocalToDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLocalStatus(filters.status || '');
            setLocalFromDate(filters.fromDate || '');
            setLocalToDate(filters.toDate || '');
        }
    }, [isOpen, filters]);

    const handleReset = () => {
        setLocalStatus('');
        setLocalFromDate('');
        setLocalToDate('');
        if (onFilter) onFilter({ status: '', fromDate: '', toDate: '' });
        onClose();
    };

    const handleApply = () => {
        if (onFilter) {
            onFilter({
                status: localStatus,
                fromDate: localFromDate,
                toDate: localToDate
            });
        }
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Filter Visitors"
            titleSize="text-lg"
            subtitle="Filter specific visitor history records"
            maxWidth="max-w-md"
            overflowClass="overflow-visible"
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleApply}
                        className="px-5 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-secondary transition-colors"
                    >
                        Apply Filter
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-5 py-2 border border-gray-200 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                        Reset
                    </button>
                </div>
            }
        >
            <div className="grid grid-cols-2 gap-5">
                {showDateFilters && (
                    <>
                        <DateInput
                            label="From Date"
                            value={localFromDate}
                            onChange={(e) => setLocalFromDate(e.target.value)}
                        />
                        <DateInput
                            label="To Date"
                            value={localToDate}
                            onChange={(e) => setLocalToDate(e.target.value)}
                        />
                    </>
                )}

                <div className="col-span-2">
                    <label className="block mb-1.5 text-xs font-medium">Status</label>
                    <Dropdown
                        options={statusOptions || [
                            { label: 'All Status', value: '' },
                            { label: 'Checked In', value: 'Checked In' },
                            { label: 'Completed', value: 'Completed' }
                        ]}
                        value={localStatus}
                        onChange={setLocalStatus}
                        placeholder="Select status"
                        triggerClassName="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-xs outline-none focus:border-secondary transition-colors"
                    />
                </div>
            </div>
        </Modal>
    );
}
