import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import Input from '@/components/ui/Input';

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

    const resetFilters = () => {
        setRoomNo('');
        setCategory('All');
        setDate('');
        setPriority('All');
        setStatus('All');
        onApply({ roomNo: '', category: 'All', date: '', priority: 'All', status: 'All' });
    };

    const handleApply = () => {
        onApply({ roomNo, category, date, priority, status });
    };

    const priorityOptions = [
        { label: 'All Priority', value: 'All' },
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Low', value: 'Low' }
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
            maxWidth="max-w-md"
            footer={
                <>
                    <button 
                        type="button" 
                        onClick={resetFilters} 
                        className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Reset
                    </button>
                    <button 
                        type="button" 
                        onClick={handleApply} 
                        className="flex-1 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-[#0A437A]/90 transition-colors cursor-pointer"
                    >
                        Filter
                    </button>
                </>
            }
        >
            <div className="space-y-6">
                <div>
                    <label className="block text-xs mb-1.5 font-medium">Room No</label>
                    <Input
                        value={roomNo}
                        onChange={(e) => setRoomNo(e.target.value)}
                        placeholder="Enter Room No"
                        className="w-full text-xs"
                    />
                </div>

                <div>
                    <label className="block text-xs mb-1.5 font-medium">Category</label>
                    <Dropdown
                        options={categoryOptions}
                        value={category}
                        onChange={(value) => setCategory(value)}
                        placeholder="All Categories"
                        className="w-full"
                        minWidth=""
                        triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border-gray-200 focus:border-secondary cursor-pointer"
                    />
                </div>

                <div>
                    <label className="block text-xs mb-1.5 font-medium">Date</label>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full text-xs"
                    />
                </div>

                <div>
                    <label className="block text-xs mb-1.5 font-medium">Priority</label>
                    <Dropdown
                        options={priorityOptions}
                        value={priority}
                        onChange={(value) => setPriority(value)}
                        placeholder="All Priority"
                        className="w-full"
                        minWidth=""
                        triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border-gray-200 focus:border-secondary cursor-pointer"
                    />
                </div>
                
                <div>
                    <label className="block text-xs mb-1.5 font-medium">Status</label>
                    <Dropdown
                        options={statusOptions}
                        value={status}
                        onChange={(value) => setStatus(value)}
                        placeholder="All Status"
                        className="w-full"
                        minWidth=""
                        triggerClassName="w-full px-2.5 py-2.5 text-xs bg-white border-gray-200 focus:border-secondary cursor-pointer"
                    />
                </div>
            </div>
        </Modal>
    );
}
