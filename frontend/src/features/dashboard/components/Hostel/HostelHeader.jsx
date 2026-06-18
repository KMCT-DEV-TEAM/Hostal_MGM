import React from 'react';

export default function HostelHeader({ selectedIds, handleBulkStatusClick }) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Hostel</h1>
                <p className="text-sm text-gray-500 mt-1">Manage all hostel</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 mr-2">
                        <button
                            onClick={() => handleBulkStatusClick(true)}
                            className="px-3 py-2 bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                        >
                            Active ({selectedIds.length})
                        </button>
                        <button
                            onClick={() => handleBulkStatusClick(false)}
                            className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                        >
                            Inactive ({selectedIds.length})
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
