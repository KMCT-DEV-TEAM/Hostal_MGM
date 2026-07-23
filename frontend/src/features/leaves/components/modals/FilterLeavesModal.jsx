import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import DateInput from '@/components/ui/DateInput';
import Dropdown from '@/components/ui/Dropdown';

export default function FilterLeavesModal({
    isOpen,
    onClose,
    pageTitle,
    isOutPass = false,
    isStudent = false,
    isMobile = false,
    filters = {},
    onApply,
    onReset
}) {
    const [localStatus, setLocalStatus] = useState('');
    const [localCategory, setLocalCategory] = useState('');
    const [localPassType, setLocalPassType] = useState('');
    const [localFromDate, setLocalFromDate] = useState('');
    const [localToDate, setLocalToDate] = useState('');

    React.useEffect(() => {
        if (isOpen) {
            setLocalStatus(filters.status || '');
            setLocalCategory(filters.category || '');
            setLocalPassType(filters.passType || '');
            setLocalFromDate(filters.fromDate || '');
            setLocalToDate(filters.toDate || '');
        }
    }, [isOpen, filters]);

    const handleReset = () => {
        setLocalStatus('');
        setLocalCategory('');
        setLocalPassType('');
        setLocalFromDate('');
        setLocalToDate('');
        if (onReset) onReset();
    };

    const handleApply = () => {
        if (onApply) {
            onApply({
                status: localStatus,
                category: localCategory,
                passType: localPassType,
                fromDate: localFromDate,
                toDate: localToDate
            });
        }
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

                <div className={isOutPass || isMobile ? "col-span-1" : "col-span-2"}>
                    <label className="block mb-1.5 text-xs font-medium">Status</label>
                    <Dropdown
                        options={[
                            { label: 'All Status', value: '' },
                            { label: 'Pending Parent', value: 'pending_parent' },
                            { label: 'Pending Admin', value: 'pending_admin' },
                            { label: 'Approved', value: 'approved' },
                            { label: 'Rejected', value: 'rejected' },
                            { label: 'Returned', value: 'returned' },
                            ...(isStudent ? [{ label: 'Cancelled', value: 'cancelled' }] : [])
                        ]}
                        value={localStatus}
                        onChange={(val) => setLocalStatus(val)}
                        placeholder="All Status"
                        triggerClassName="w-full h-10 px-3 border border-gray-200 rounded-md text-xs bg-white text-gray-700 flex justify-between items-center transition-colors focus:border-secondary"
                    />
                </div>
                {isMobile && (
                    <div className="col-span-1">
                        <label className="block mb-1.5 text-xs font-medium">Pass Type</label>
                        <Dropdown
                            options={[
                                { label: 'All Types', value: '' },
                                { label: 'Home Pass', value: 'home_pass' },
                                { label: 'Out Pass', value: 'out_pass' }
                            ]}
                            value={localPassType}
                            onChange={(val) => setLocalPassType(val)}
                            placeholder="All Types"
                            triggerClassName="w-full h-10 px-3 border border-gray-200 rounded-md text-xs bg-white text-gray-700 flex justify-between items-center transition-colors focus:border-secondary"
                        />
                    </div>
                )}
                {(isOutPass || localPassType === 'out_pass') && (
                    <div className="col-span-1">
                        <label className="block mb-1.5 text-xs font-medium">Category</label>
                        <Dropdown
                            options={[
                                { label: 'All Categories', value: '' },
                                { label: 'In House', value: 'in_house' },
                                { label: 'Out House', value: 'out_house' }
                            ]}
                            value={localCategory}
                            onChange={(val) => setLocalCategory(val)}
                            placeholder="All Categories"
                            triggerClassName="w-full h-10 px-3 border border-gray-200 rounded-md text-xs bg-white text-gray-700 flex justify-between items-center transition-colors focus:border-secondary"
                        />
                    </div>
                )}
            </div>
        </Modal>
    );
}
