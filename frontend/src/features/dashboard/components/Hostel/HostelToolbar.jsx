import React from 'react';
import { Search, Download, Plus, ChevronDown } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';

export default function HostelToolbar({
    statusFilter,
    setStatusFilter,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    initiateExport,
    openAddHostelModal
}) {
    return (
        <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
            <div className="relative w-full sm:w-auto flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search hostels..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none cursor-pointer"
                />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end">
                <Dropdown
                    options={[
                        { label: 'All', value: 'All' },
                        { label: 'Active', value: 'Active' },
                        { label: 'Inactive', value: 'Inactive' }
                    ]}
                    value={statusFilter}
                    onChange={(val) => {
                        setStatusFilter(val);
                        setCurrentPage(1); // Reset to first page when filter changes
                    }}
                    placeholder="Select Status"
                    minWidth="w-32"
                    triggerClassName="w-full appearance-none bg-transparent rounded-lg px-3 py-2 text-sm text-[#777777] font-medium outline-none border border-gray-100 md:border-gray-200 shadow-sm md:shadow-none focus:border-[#0A437A] cursor-pointer"
                />

                <button
                    onClick={initiateExport}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                >
                    <Download className="w-4 h-4" /> Export
                </button>
                <button
                    onClick={openAddHostelModal}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm hover:bg-[#083663] transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" /> Add New
                </button>
            </div>
        </div>
    );
}
