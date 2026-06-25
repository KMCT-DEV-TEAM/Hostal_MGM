import React, { useState } from 'react';
import { Search, ChevronDown, Download, Plus } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';

export default function StudentComplaintsToolbar({
    statusFilter,
    setStatusFilter,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    openAddComplaintModal
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
            <div className="w-full sm:w-auto flex flex-col gap-2 flex-1 sm:max-w-xs">
                <div className="relative w-full">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (setCurrentPage) setCurrentPage(1);
                        }}
                        placeholder="Search Complaints..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none placeholder-gray-400 cursor-pointer"
                    />
                </div>
                <div className="flex justify-center sm:hidden -mt-1 -mb-2">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-1 text-text-secondary hover:text-text-secondary/80 transition-colors cursor-pointer focus:outline-none"
                    >
                        <ChevronDown className={`w-5 h-5 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            <div className={`flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end ${isMobileMenuOpen ? 'flex' : 'hidden sm:flex'}`}>
                <div className="flex gap-3 w-full sm:w-auto">
                    <Dropdown
                        className="flex-1 sm:flex-none"
                        options={[
                            { label: 'All Status', value: 'All' },
                            { label: 'Pending', value: 'Pending' },
                            { label: 'In Progress', value: 'In progress' },
                            { label: 'Resolved', value: 'Resolved' }
                        ]}
                        value={statusFilter}
                        onChange={(val) => {
                            setStatusFilter(val);
                            if (setCurrentPage) setCurrentPage(1); // Reset to first page when filter changes
                        }}
                        placeholder="All"
                        minWidth="w-32"
                        triggerClassName="w-full px-3 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm text-[#777777] font-medium shadow-sm md:shadow-none focus:border-[#0A437A] cursor-pointer"
                    />

                </div>
                <button
                    onClick={openAddComplaintModal}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm hover:bg-secondary transition-colors w-full sm:w-auto shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" /> Add New
                </button>
            </div>
        </div>
    );
}
