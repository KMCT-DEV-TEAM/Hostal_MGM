import React from 'react';

export default function HostelHeader({ selectedIds, handleBulkStatusClick }) {
    return (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-6 flex-shrink-0">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Hostel</h1>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Manage all hostel</p>
            </div>

            <div className="flex items-center gap-3">
                {selectedIds.length > 0 && (
                    <button
                        onClick={() => handleBulkStatusClick(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-success text-success bg-green-50/40 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium cursor-pointer"
                    >
                        Active ({selectedIds.length})
                    </button>
                )}

                {selectedIds.length > 0 && (
                    <button
                        onClick={() => handleBulkStatusClick(false)}
                        className="flex items-center gap-2 px-4 py-2 border border-danger text-danger bg-red-50/40 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium cursor-pointer"
                    >
                        Inactive ({selectedIds.length})
                    </button>
                )}
            </div>
        </div>
    );
}
