import React from 'react';
import { Search, Download, Plus } from 'lucide-react';

export default function ParentsToolbar({ onSearch, onExport, onAddClick }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex items-center justify-between">
            <div className="flex gap-3">
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-secondary">
                    <option>All</option>
                </select>
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-secondary">
                    <option>Relation</option>
                </select>
            </div>
            <div className="flex gap-3">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 outline-none focus:border-secondary"
                        placeholder="Search"
                        onChange={(e) => onSearch && onSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-sm font-medium text-gray-700"
                >
                    <Download className="w-4 h-4" /> Export
                </button>
            </div>
        </div>
    );
}
