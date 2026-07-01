import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import DateInput from '@/components/ui/DateInput';
import Dropdown from '@/components/ui/Dropdown';

export default function FilterAttendanceModal({
    isOpen,
    onClose,
    filters = {},
    onApply,
    onReset
}) {
    const [localFromDate, setLocalFromDate] = useState('');
    const [localToDate, setLocalToDate] = useState('');
    const [localRoom, setLocalRoom] = useState('');
    const [localStatus, setLocalStatus] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLocalFromDate(filters.fromDate || '');
            setLocalToDate(filters.toDate || '');
            setLocalRoom(filters.room || '');
            setLocalStatus(filters.status || '');
        }
    }, [isOpen, filters]);

    const handleReset = () => {
        setLocalFromDate('');
        setLocalToDate('');
        setLocalRoom('');
        setLocalStatus('');
        if (onReset) onReset();
    };

    const handleApply = () => {
        if (onApply) {
            onApply({
                fromDate: localFromDate,
                toDate: localToDate,
                room: localRoom,
                status: localStatus
            });
        }
    };

    return (
        <Modal bottomSheetOnMobile={true}
            isOpen={isOpen}
            onClose={onClose}
            title="Filter Attendance list"
            titleSize="text-lg"
            subtitle="Filter specific attendance from the list"
            maxWidth="max-w-md"
            overflowClass="overflow-visible"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-5 py-2 border border-gray-200 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        className="px-5 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-secondary transition-colors"
                    >
                        Filter
                    </button>
                </div>
            }
        >
            <div className="grid grid-cols-2 gap-5 mt-4">
                <DateInput
                    label="From"
                    value={localFromDate}
                    onChange={(e) => setLocalFromDate(e.target.value)}
                />
                <DateInput
                    label="To"
                    value={localToDate}
                    onChange={(e) => setLocalToDate(e.target.value)}
                />

                {/* <div className="col-span-2">
                    <label className="block mb-1.5 text-xs font-medium">Room No</label>
                    <input
                        type="text"
                        placeholder="Enter the room no"
                        value={localRoom}
                        onChange={(e) => setLocalRoom(e.target.value)}
                        className="w-full h-10 px-3 border border-gray-200 rounded-md text-xs outline-none transition-colors focus:border-secondary bg-white"
                    />
                </div> */}

                <div className="col-span-1">
                    <label className="block mb-1.5 text-xs font-medium">Status</label>
                    <Dropdown
                        options={[
                            { label: 'All Status', value: '' },
                            { label: 'Present', value: 'present' },
                            { label: 'Absent', value: 'absent' },
                            { label: 'Not Marked', value: 'not_marked' }
                        ]}
                        value={localStatus}
                        onChange={(val) => setLocalStatus(val)}
                        placeholder="Select status"
                        triggerClassName="w-full h-10 px-3 border border-gray-200 rounded-md text-xs bg-gray-50 text-gray-700 flex justify-between items-center transition-colors focus:border-secondary"
                    />
                </div>
            </div>
        </Modal>
    );
}
