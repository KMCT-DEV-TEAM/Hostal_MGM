import React, { useState } from 'react';
import { Search, ChevronDown, Download } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';

export default function ListToolbar({ 
    onSearch, 
    searchPlaceholder = "Search...", 
    filters = [], 
    onExport, 
    extraActions 
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
            <div className="w-full sm:w-auto flex flex-col gap-2 flex-1 sm:max-w-xs">
                <div className="relative w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none placeholder-gray-400 cursor-pointer"
                        placeholder={searchPlaceholder}
                        onChange={(e) => onSearch && onSearch(e.target.value)}
                    />
                </div>
                {filters.length > 0 && (
                    <div className="flex justify-center sm:hidden -mt-1 -mb-2">
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer focus:outline-none"
                        >
                            <ChevronDown className={`w-5 h-5 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                )}
            </div>

            <div
                className={`flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end ${
                    filters.length > 0 && isMobileMenuOpen ? 'flex' : 'hidden sm:flex'
                }`}
            >
                <div className="flex w-full sm:w-auto gap-3">
                    {filters.map((filter, index) => (
                        <Dropdown
                            key={index}
                            className="flex-1 sm:flex-none"
                            options={filter.options}
                            value={filter.value}
                            onChange={filter.onChange}
                            placeholder={filter.placeholder}
                            minWidth={filter.minWidth || "w-32"}
                            triggerClassName="w-full appearance-none bg-white border border-gray-100 md:border-gray-200 rounded-lg px-3 py-2 text-sm text-[#777777] font-medium"
                        />
                    ))}
                </div>

                {onExport && (
                    <button
                        type="button"
                        onClick={onExport}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-text-secondary hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                )}

                {extraActions}
            </div>
        </div>
    );
}
