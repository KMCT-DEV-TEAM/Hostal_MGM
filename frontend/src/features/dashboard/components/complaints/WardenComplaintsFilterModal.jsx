import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import Input from '@/components/ui/Input';
import DateInput from '@/components/ui/DateInput';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function WardenComplaintsFilterModal({
    initialRoomNo,
    initialCategory,
    initialStartDate,
    initialEndDate,
    initialPriority,
    initialStatus,
    categories = [],
    onClose,
    onApply
}) {
    const [roomNo, setRoomNo] = useState(initialRoomNo || '');
    const [category, setCategory] = useState(initialCategory || 'All');
    const [startDate, setStartDate] = useState(initialStartDate || '');
    const [endDate, setEndDate] = useState(initialEndDate || '');
    const [priority, setPriority] = useState(initialPriority || 'All');
    const [status, setStatus] = useState(initialStatus || 'All');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [errors, setErrors] = useState({});

    const resetFilters = () => {
        setRoomNo('');
        setCategory('All');
        setStartDate('');
        setEndDate('');
        setPriority('All');
        setStatus('All');
        setShowConfirmReset(false);
        setErrors({});
        onApply({ roomNo: '', category: 'All', startDate: '', endDate: '', priority: 'All', status: 'All' });
    };

    const handleFilterClick = () => {
        setErrors({});
        
        if (startDate && endDate) {
            const start = new Date(startDate).setHours(0,0,0,0);
            const end = new Date(endDate).setHours(0,0,0,0);
            if (start > end) {
                setErrors({ endDate: "End date must be after start date" });
                return;
            }
        }

        setIsConfirmOpen(true);
    };

    const handleApply = () => {
        setIsConfirmOpen(false);
        onApply({ roomNo, category, startDate, endDate, priority, status });
    };

    const priorityOptions = [
        { label: 'All Priority', value: 'All' },
        { label: <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-danger"></span>High</span>, value: 'High' },
        { label: <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-warning"></span>Medium</span>, value: 'Medium' },
        { label: <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-400"></span>Low</span>, value: 'Low' }
    ];

    const statusOptions = [
        { label: 'All Status', value: 'All' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Awaiting', value: 'Awaiting' },
        { label: 'In progress', value: 'In progress' },
        { label: 'Rejected', value: 'Rejected' },
        { label: 'Incomplete', value: 'Incomplete' },
        { label: 'Resolved', value: 'Resolved' }
    ];

    const categoryOptions = [
        { label: 'All Categories', value: 'All' },
        ...categories.map(cat => ({ label: cat.name, value: cat.name }))
    ];

    return (
        <>
            <Modal bottomSheetOnMobile={true}
                isOpen={true}
                onClose={onClose}
                title="Filter Complaints"
                subtitle="Filter specific complaints from the list"
                maxWidth="max-w-md"
                zIndex={60}
                overflowClass="overflow-visible"
                footer={
                    <>
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
                            Filter
                        </button>
                    </>
                }
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm mb-1.5 font-medium text-gray-700">Room No</label>
                        <Input
                            value={roomNo}
                            onChange={(e) => { setRoomNo(e.target.value); setErrors(prev => ({ ...prev, roomNo: null })); }}
                            placeholder="Enter the room no"
                            className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0A437A] transition-colors"
                        />
                        {errors.roomNo && <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium animate-in fade-in">{errors.roomNo}</p>}
                    </div>

                    <div>
                        <label className="block text-sm mb-1.5 font-medium text-gray-700">Category</label>
                        <Dropdown
                            options={categoryOptions}
                            value={category}
                            onChange={(value) => { setCategory(value); setErrors(prev => ({ ...prev, category: null })); }}
                            placeholder="Select"
                            error={errors.category}
                            className="w-full"
                            minWidth=""
                            triggerClassName="w-full px-3 py-2.5 text-sm bg-white border-gray-200 focus:border-[#0A437A] cursor-pointer"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm mb-1.5 font-medium text-gray-700">Start Date</label>
                            <DateInput
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setErrors(prev => ({ ...prev, startDate: null })); }}
                                placeholder="Select start date"
                                className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0A437A] transition-colors"
                            />
                            {errors.startDate && <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium animate-in fade-in">{errors.startDate}</p>}
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm mb-1.5 font-medium text-gray-700">End Date</label>
                            <DateInput
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setErrors(prev => ({ ...prev, endDate: null })); }}
                                placeholder="Select end date"
                                className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0A437A] transition-colors"
                            />
                            {errors.endDate && <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium animate-in fade-in">{errors.endDate}</p>}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm mb-1.5 font-medium text-gray-700">Status</label>
                            <Dropdown
                                options={statusOptions}
                                value={status}
                                onChange={(value) => { setStatus(value); setErrors(prev => ({ ...prev, status: null })); }}
                                placeholder="Select"
                                error={errors.status}
                                className="w-full"
                                minWidth=""
                                triggerClassName="w-full px-3 py-2.5 text-sm bg-white border-gray-200 focus:border-[#0A437A] cursor-pointer"
                            />
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm mb-1.5 font-medium text-gray-700">Priority</label>
                            <Dropdown
                                options={priorityOptions}
                                value={priority}
                                onChange={(value) => { setPriority(value); setErrors(prev => ({ ...prev, priority: null })); }}
                                placeholder="Select"
                                error={errors.priority}
                                className="w-full"
                                minWidth=""
                                triggerClassName="w-full px-3 py-2.5 text-sm bg-white border-gray-200 focus:border-[#0A437A] cursor-pointer font-medium flex items-center"
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleApply}
                title="Confirm Filter"
                message="Are you sure you want to apply these filters?"
                confirmText="Apply"
            />

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
