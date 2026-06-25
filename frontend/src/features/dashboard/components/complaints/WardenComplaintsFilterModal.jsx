import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import Input from '@/components/ui/Input';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function WardenComplaintsFilterModal({ 
    initialRoomNo,
    initialCategory,
    initialDate,
    initialPriority, 
    initialStatus, 
    onClose, 
    onApply 
}) {
    const [roomNo, setRoomNo] = useState(initialRoomNo || '');
    const [category, setCategory] = useState(initialCategory || 'All');
    const [date, setDate] = useState(initialDate || '');
    const [priority, setPriority] = useState(initialPriority || 'All');
    const [status, setStatus] = useState(initialStatus || 'All');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const resetFilters = () => {
        setRoomNo('');
        setCategory('All');
        setDate('');
        setPriority('All');
        setStatus('All');
        onApply({ roomNo: '', category: 'All', date: '', priority: 'All', status: 'All' });
    };

    const handleApply = () => {
        setIsConfirmOpen(false);
        onApply({ roomNo, category, date, priority, status });
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
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Resolved', value: 'Resolved' }
    ];

    const categoryOptions = [
        { label: 'All Categories', value: 'All' },
        { label: 'Mess', value: 'Mess' },
        { label: 'Maintenance', value: 'Maintenance' },
        { label: 'Other', value: 'Other' }
    ];

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Filter Complaints"
            subtitle="Filter specific complaints from the list"
            maxWidth="max-w-md"
            footer={
                <>
                    <button 
                        type="button" 
                        onClick={resetFilters} 
                        className="flex-1 py-2.5 border border-[#0A437A] text-[#0A437A] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Reset
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setIsConfirmOpen(true)} 
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
                        onChange={(e) => setRoomNo(e.target.value)}
                        placeholder="Enter the room no"
                        className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0A437A] transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-sm mb-1.5 font-medium text-gray-700">category</label>
                    <Dropdown
                        options={categoryOptions}
                        value={category}
                        onChange={(value) => setCategory(value)}
                        placeholder="Select"
                        className="w-full"
                        minWidth=""
                        triggerClassName="w-full px-3 py-2.5 text-sm bg-white border-gray-200 focus:border-[#0A437A] cursor-pointer"
                    />
                </div>

                <div>
                    <label className="block text-sm mb-1.5 font-medium text-gray-700">Date</label>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        placeholder="Select"
                        className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0A437A] transition-colors"
                    />
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm mb-1.5 font-medium text-gray-700">Status</label>
                        <Dropdown
                            options={statusOptions}
                            value={status}
                            onChange={(value) => setStatus(value)}
                            placeholder="Select"
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
                            onChange={(value) => setPriority(value)}
                            placeholder="Select"
                            className="w-full"
                            minWidth=""
                            triggerClassName="w-full px-3 py-2.5 text-sm bg-white border-gray-200 focus:border-[#0A437A] cursor-pointer font-medium flex items-center"
                        />
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleApply}
                title="Confirm Filter"
                message="Are you sure you want to apply these filters?"
                confirmText="Yes, Apply"
            />
        </Modal>
    );
}
