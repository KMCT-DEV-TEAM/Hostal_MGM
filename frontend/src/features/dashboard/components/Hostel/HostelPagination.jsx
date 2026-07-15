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
        <div className="hidden md:flex flex-row p-3 sm:p-4 bg-white border border-gray-50 items-center justify-between text-[10px] sm:text-xs font-medium text-gray-500 rounded-b-xl shadow-sm shrink-0 mt-auto">
            <div>
                <span className="hidden sm:inline">Showing </span>
                {totalHostels === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                <span className="hidden sm:inline"> to </span>
                <span className="sm:hidden">-</span>
                {Math.min(currentPage * itemsPerPage, totalHostels)} of {totalHostels}
                <span className="hidden sm:inline"> entries</span>
            </div>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
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
                                ? 'bg-[#0A437A] text-white shadow-sm font-bold'
                                : 'border border-transparent text-gray-600 hover:bg-gray-50'
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
                    className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
