import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

export default function StudentComplaintsHeader({ showKPIs, setShowKPIs }) {
    return (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-6 flex-shrink-0">
            <div>
                <h1 className="text-[22px] font-bold text-black">My Complaints</h1>
                <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5">Raise hostel-related issues and track their status until resolution.</p>
            </div>
            
            <div className="flex items-center self-end sm:self-auto">
                <button
                    onClick={() => setShowKPIs(!showKPIs)}
                    className="flex items-center gap-2 p-2 text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                >
                    {showKPIs ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
}
