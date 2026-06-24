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
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-white">
            <div className="w-full sm:w-auto flex-1 sm:max-w-xs">
                <div className="relative w-full flex items-center">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search"
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none placeholder-gray-300 transition-colors"
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                <div className="relative w-28">
                    <Dropdown
                        minWidth=""
                        options={[
                            { value: "All", label: "All" },
                            { value: "Hostel A", label: "Hostel A" },
                            { value: "Hostel B", label: "Hostel B" }
                        ]}
                        value={filterOption || "All"}
                        onChange={(val) => setFilterOption && setFilterOption(val)}
                        triggerClassName="px-4 py-2 text-sm font-medium text-start rounded-lg bg-white border border-gray-200 text-[#333333] hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center w-full"
                    />
                </div>
                
                <button
                    onClick={initiateExport}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                    <Download className="w-4 h-4" /> Export
                </button>
            </div>
        </div>
    );
}
