import React from 'react';
import { Search, Download, Plus, ChevronDown } from 'lucide-react';

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
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 flex-shrink-0">
            <div className="relative inline-block w-28">
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1); // Reset to first page when filter changes
                    }}
                    className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A437A] text-gray-600 pr-8 font-medium cursor-pointer"
                >
                    <option value="All">All</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search hostels..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none placeholder-gray-400 cursor-pointer"
                    />
                </div>
                <button
                    onClick={initiateExport}
                    className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-white hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer"
                >
                    <Download className="w-4 h-4" />
                    Export
                </button>
                <button
                    onClick={openAddHostelModal}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg hover:bg-[#083561] transition-colors text-sm font-medium flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Add New
                </button>
            </div>
        </div>
    );
}
