import React, { useState } from 'react';
import { Search, Download, Plus } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';

export default function ParentsToolbar({ onSearch, onFilterChange, onExport, canCreate }) {
    const [statusFilter, setStatusFilter] = useState('');
    const [relationFilter, setRelationFilter] = useState('');

    const statusOptions = [
        { label: 'All Status', value: '' },
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' }
    ];

    const relationOptions = [
        { label: 'All Relations', value: '' },
        { label: 'Father', value: 'Father' },
        { label: 'Mother', value: 'Mother' },
        { label: 'Guardian', value: 'Guardian' }
    ];

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex items-center justify-between">
            <div className="flex gap-3">
                <Dropdown
                    options={statusOptions}
                    value={statusFilter}
                    onChange={(val) => {
                        setStatusFilter(val);
                        onFilterChange?.('isActive', val === 'Active' ? 'true' : val === 'Inactive' ? 'false' : '');
                    }}
                    placeholder="All Status"
                    minWidth="w-[140px]"
                />
                <Dropdown
                    options={relationOptions}
                    value={relationFilter}
                    onChange={(val) => {
                        setRelationFilter(val);
                        onFilterChange?.('relationship', val === 'Father' ? 'father' : val === 'Mother' ? 'mother' : val === 'Guardian' ? 'guardian' : '');
                    }}
                    placeholder="All Relations"
                    minWidth="w-[140px]"
                />
            </div>
            <div className="flex gap-3">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 outline-none focus:border-secondary"
                        placeholder="Search"
                        onChange={(e) => onSearch && onSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-sm font-medium text-gray-700"
                >
                    <Download className="w-4 h-4" /> Export
                </button>
            </div>
        </div>
    );
}
