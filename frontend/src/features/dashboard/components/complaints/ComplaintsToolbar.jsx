import React, { useState } from 'react';
import { Search, ChevronDown, Download, SlidersHorizontal } from 'lucide-react';

export default function ComplaintsToolbar({
    searchQuery,
    setSearchQuery,
    initiateExport,
    openFilterModal
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
            <div className="w-full sm:w-auto flex flex-col gap-2 flex-1 sm:max-w-xs">
                <div className="relative w-full flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search complaints..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none placeholder-gray-400 cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={openFilterModal}
                        className="flex items-center justify-center p-2.5 bg-white border border-gray-200 text-text-secondary rounded-lg hover:bg-gray-50 transition-colors shadow-sm md:shadow-none cursor-pointer"
                        title="Filter"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex justify-center sm:hidden -mt-1 -mb-2">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-1 text-text-secondary hover:text-text-secondary transition-colors cursor-pointer focus:outline-none"
                    >
                        <ChevronDown className={`w-5 h-5 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            <div className={`flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end ${isMobileMenuOpen ? 'flex' : 'hidden sm:flex'}`}>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={initiateExport}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-text-secondary hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>
        </div>
    );
}
