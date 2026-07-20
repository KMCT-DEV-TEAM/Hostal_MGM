import React, { useState, useEffect } from 'react';
import { Search, Download, Plus, ChevronDown } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';

export default function ListToolbar({
    searchQuery = "",
    onSearchChange,
    searchPlaceholder = "Search...",

    // Status filter props
    statusFilter,
    onStatusFilterChange,
    statusOptions = [
        { value: "All", label: "All Status" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
    ],
    statusPlaceholder = "All Status",

    // Action buttons
    onExport,
    onAdd,
    addButtonLabel = "Add New",

    // Any extra filters (like Role, Hostel, etc) passed as JSX
    extraFilters,

    // Any extra actions (like Bulk Menu) passed as JSX
    children,
    isStudentOrParent
}) {
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== searchQuery && onSearchChange) {
                onSearchChange(localSearch);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [localSearch, searchQuery, onSearchChange]);

    // Sync local search when parent resets it
    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    return (
        <div className="p-0 px-3  md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
            <div className="w-full sm:w-auto flex flex-col gap-2 flex-1 sm:max-w-xs">
                {onSearchChange && !isStudentOrParent && (
                    <div className="relative w-full">
                        <Search className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none placeholder-gray-400 cursor-pointer"
                        />
                    </div>
                )}
                {/* Mobile Expand Toggle - only show if there are actions/filters */}
                {(onStatusFilterChange || onExport || onAdd || extraFilters || children) && (
                    <div className="flex justify-center sm:hidden -mt-1 -mb-2">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer focus:outline-none"
                        >
                            <ChevronDown className={`w-5 h-5 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                )}
            </div>

            <div className={`flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end ${isMobileMenuOpen ? 'flex' : 'hidden sm:flex'}`}>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
                    {extraFilters}

                    {onStatusFilterChange && (
                        <div className="flex-1 sm:flex-none">
                            <Dropdown
                                className="w-full sm:w-auto"
                                options={statusOptions}
                                value={statusFilter}
                                onChange={onStatusFilterChange}
                                placeholder={statusPlaceholder}
                                minWidth="min-w-[120px]"
                                triggerClassName="w-full px-3 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm text-[#777777] font-medium shadow-sm md:shadow-none focus:border-[#0A437A] cursor-pointer"
                            />
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    {children}

                    {onExport && (
                        <button
                            onClick={onExport}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" /> Export
                        </button>
                    )}

                    {onAdd && (
                        <button
                            onClick={onAdd}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm hover:bg-secondary transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> {addButtonLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
