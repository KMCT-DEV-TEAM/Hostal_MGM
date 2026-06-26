import React, { useState } from 'react';
import { Search, ChevronDown, Download } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';

export default function ComplaintsToolbar({
    searchQuery,
    setSearchQuery,
    initiateExport,
    filterOption,
    setFilterOption
}) {
    return (
        <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
            <div className="w-full sm:w-auto flex-1 sm:max-w-xs">
                <div className="relative w-full flex items-center">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search"
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none placeholder-gray-400 cursor-pointer"
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                <div className="relative w-28">
                    <Dropdown
                        minWidth=""
                        options={[
                            { value: "All", label: "All Status" },
                            { value: "Hostel A", label: "Hostel A" },
                            { value: "Hostel B", label: "Hostel B" }
                        ]}
                        value={filterOption || "All"}
                        onChange={(val) => setFilterOption && setFilterOption(val)}
                        triggerClassName="w-full px-3 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm text-[#777777] font-medium shadow-sm md:shadow-none focus:border-[#0A437A] cursor-pointer"
                    />
                </div>
                
                <button
                    onClick={initiateExport}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                >
                    <Download className="w-4 h-4" /> Export
                </button>
            </div>
        </div>
    );
}
