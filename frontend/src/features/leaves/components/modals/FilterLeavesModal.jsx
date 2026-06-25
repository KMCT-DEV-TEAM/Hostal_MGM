import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';

export default function FilterLeavesModal({ 
    isOpen, 
    onClose, 
    pageTitle, 
    filterStatus, 
    setFilterStatus, 
    onApply, 
    onReset 
}) {
    // Local state for dates if we want to filter by date later
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    // Local status state so we only apply on button click
    const [localStatus, setLocalStatus] = useState(filterStatus);

    // Sync local state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setLocalStatus(filterStatus);
        }
    }, [isOpen, filterStatus]);

    const handleReset = () => {
        setLocalStatus('All');
        setFromDate('');
        setToDate('');
        if (onReset) onReset();
    };

    const handleApply = () => {
        setFilterStatus(localStatus);
        // If fromDate/toDate logic is needed, pass them up here
        if (onApply) onApply({ filterStatus: localStatus, fromDate, toDate });
    };

    const inputClasses = "w-full h-10 px-3 border border-gray-200 rounded-md text-xs outline-none transition-colors focus:border-secondary bg-white";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Filter ${pageTitle}`}
            titleSize="text-lg"
            subtitle={`Filter specific ${pageTitle} requests`}
            maxWidth="max-w-md"
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
                <div>
                    <label className="block mb-1.5 text-xs font-medium">From Date</label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className={inputClasses}
                    />
                </div>
                <div>
                    <label className="block mb-1.5 text-xs font-medium">To Date</label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className={inputClasses}
                    />
                </div>

                <div className="col-span-2">
                    <label className="block mb-1.5 text-xs font-medium">Status</label>
                    <select
                        value={localStatus}
                        onChange={(e) => setLocalStatus(e.target.value)}
                        className={inputClasses}
                    >
                        <option value="All">All Status</option>
                        <option value="Approved">Approved</option>
                        <option value="Pending">Pending</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>
        </Modal>
    );
}
