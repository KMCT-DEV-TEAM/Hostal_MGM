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
        <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
            <div className="relative w-full sm:w-auto flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none"
                    placeholder="Search Parents..."
                    onChange={(e) => onSearch && onSearch(e.target.value)}
                />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end">
                <Dropdown
                    options={statusOptions}
                    value={statusFilter}
                    onChange={(val) => {
                        setStatusFilter(val);
                        onFilterChange?.('isActive', val === 'Active' ? 'true' : val === 'Inactive' ? 'false' : '');
                    }}
                    placeholder="All Status"
                    minWidth="w-32"
                />
                <Dropdown
                    options={relationOptions}
                    value={relationFilter}
                    onChange={(val) => {
                        setRelationFilter(val);
                        onFilterChange?.('relationship', val === 'Father' ? 'father' : val === 'Mother' ? 'mother' : val === 'Guardian' ? 'guardian' : '');
                    }}
                    placeholder="All Relations"
                    minWidth="w-32"
                />
                <button
                    onClick={onExport}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-text-secondary hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                >
                    <Download className="w-4 h-4" /> Export
                </button>
            </div>
        </div>
    );
}
