import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HostelPagination({
    currentPage,
    totalPages,
    totalHostels,
    itemsPerPage,
    handlePageChange
}) {
    return (
        <div className="p-4 bg-white border-t border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-medium text-gray-500 flex-shrink-0">
            <div className="text-center sm:text-left">
                Showing {totalHostels === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalHostels)} of {totalHostels} entries
            </div>

            <div className="flex items-center justify-center sm:justify-end gap-1">
                <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, index) => {
                    const pageNum = index + 1;
                    return (
                        <button
                            key={pageNum}
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer ${currentPage === pageNum
                                ? "bg-[#0A437A] text-white border border-[#0A437A] shadow-sm"
                                : "text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200"
                                }`}
                        >
                            {pageNum}
                        </button>
                    );
                })}

                <button
                    type="button"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
