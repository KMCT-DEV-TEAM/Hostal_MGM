import React, { useEffect, useState } from 'react';
import { Search, Download, SlidersHorizontal, Plus } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export default function StudentsToolbar({ canCreate, searchValue = '', onSearch, onFilterClick, onExport, onAddClick }) {
    const [searchTerm, setSearchTerm] = useState(searchValue);
    const debouncedSearchTerm = useDebounce(searchTerm, 400);

    useEffect(() => {
        setSearchTerm(searchValue);
    }, [searchValue]);

    useEffect(() => {
        onSearch?.(debouncedSearchTerm);
    }, [debouncedSearchTerm, onSearch]);

    return (
        <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
            <div className="relative w-full sm:w-auto flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none"
                    placeholder="Search Students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end">
                <button
                    onClick={onFilterClick}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-text-secondary hover:bg-gray-50 transition-colors shadow-sm md:shadow-none cursor-pointer"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="sm:hidden">Filter</span>
                </button>

                <button
                    onClick={onExport}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-text-secondary hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                >
                    <Download className="w-4 h-4" /> Export
                </button>

                {canCreate && (
                    <button
                        onClick={onAddClick}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm hover:bg-[#083561] transition-colors flex-1 sm:flex-none cursor-pointer whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" /> Add New
                    </button>
                )}
            </div>
        </div>
    );
}