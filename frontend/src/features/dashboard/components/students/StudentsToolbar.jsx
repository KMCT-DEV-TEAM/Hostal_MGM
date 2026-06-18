import React from 'react';
import { Search, Download, SlidersHorizontal, Plus } from 'lucide-react';

export default function StudentsToolbar({ onSearch, onFilterClick, onExport, onAddClick }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex items-center justify-between">
            <div className="flex gap-3">
                <div className="relative w-64">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input 
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm" 
                        placeholder="Search" 
                        onChange={(e) => onSearch && onSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={onFilterClick}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                    <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                </button>
            </div>
            <div className="flex gap-3">
                <button onClick={onExport} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm">
                    <Download className="w-4 h-4" /> Export
                </button>
                <button onClick={onAddClick} className="flex items-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm">
                    <Plus className="w-4 h-4" /> Add New
                </button>
            </div>
        </div>
    );
}
