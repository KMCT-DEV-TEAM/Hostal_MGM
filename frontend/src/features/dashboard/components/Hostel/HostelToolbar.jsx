import React, { useState } from 'react';
import { Search, Download, Plus, MoreVertical } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';

export default function HostelToolbar({
    statusFilter,
    setStatusFilter,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    initiateExport,
    openAddHostelModal,
    selectedIds = [],
    handleBulkStatusClick
}) {
    const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);

    return (
        <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
            <div className="w-full sm:w-auto flex gap-2 flex-1 sm:max-w-xs">
                <div className="relative w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search hostels..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none placeholder-gray-400 cursor-pointer"
                    />
                </div>
                <button
                    onClick={openAddHostelModal}
                    className="flex sm:hidden items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm hover:bg-secondary transition-colors shrink-0 shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" /> Add
                </button>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end">
                <div className="flex gap-3 w-full sm:w-auto">
                    <Dropdown
                        className="flex-1 sm:flex-none"
                        options={[
                            { label: 'All Status', value: 'All' },
                            { label: 'Active', value: 'Active' },
                            { label: 'Inactive', value: 'Inactive' }
                        ]}
                        value={statusFilter}
                        onChange={(val) => {
                            setStatusFilter(val);
                            setCurrentPage(1);
                        }}
                        placeholder="All Status"
                        minWidth="w-32"
                        triggerClassName="w-full appearance-none bg-white border border-gray-100 md:border-gray-200 rounded-lg px-3 py-2 text-sm text-[#777777] font-medium shadow-sm md:shadow-none focus:border-[#0A437A] cursor-pointer"
                    />

                    <button
                        onClick={initiateExport}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                    
                    <div className="relative">
                        <button
                            onClick={() => setIsBulkMenuOpen(!isBulkMenuOpen)}
                            className="flex items-center justify-center p-2 bg-white border border-gray-200 rounded-lg text-[#777777] hover:bg-gray-50 transition-colors shadow-sm md:shadow-none cursor-pointer"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {isBulkMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-[100] py-1 overflow-hidden">
                                <button
                                    onClick={() => { setIsBulkMenuOpen(false); handleBulkStatusClick && handleBulkStatusClick(true); }}
                                    disabled={selectedIds.length === 0}
                                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Active {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                                </button>
                                <button
                                    onClick={() => { setIsBulkMenuOpen(false); handleBulkStatusClick && handleBulkStatusClick(false); }}
                                    disabled={selectedIds.length === 0}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Inactive {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={openAddHostelModal}
                    className="hidden sm:flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm hover:bg-secondary transition-colors w-full sm:w-auto shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" /> Add New
                </button>
            </div>
        </div>
    );
}
