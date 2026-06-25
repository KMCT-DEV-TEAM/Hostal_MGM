import React from 'react';
import { Search, Download, SlidersHorizontal } from 'lucide-react';

export default function WardenComplaintsToolbar({
    searchQuery,
    setSearchQuery,
    openFilterModal,
    initiateExport
}) {
    return (
        <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
            <div className="relative w-full sm:w-auto flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Complaints..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none placeholder-gray-400 cursor-pointer"
                />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end">
                <button
                    onClick={openFilterModal}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-[#777777] rounded-lg text-sm hover:bg-gray-50 transition-colors cursor-pointer shadow-sm md:shadow-none"
                >
                    <SlidersHorizontal className="w-4 h-4" /> 
                    <span className="sm:hidden">Filter</span>
                </button>

                <button
                    onClick={initiateExport}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-[#777777] rounded-lg text-sm hover:bg-gray-50 transition-colors flex-1 sm:flex-none cursor-pointer shadow-sm md:shadow-none whitespace-nowrap"
                >
                    <Download className="w-4 h-4" /> Export
                </button>
            </div>
        </div>
    );
}
