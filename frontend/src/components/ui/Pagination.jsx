import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
    page,
    setPage,
    limit,
    totalItems,
    totalPages,
}) {
    return (
        <div className="hidden md:flex flex-row p-3 sm:p-4 bg-white border border-gray-50 items-center justify-between text-[10px] sm:text-xs font-medium text-gray-500 rounded-b-xl shadow-sm shrink-0 mt-auto">
            <div>
                <span className="hidden sm:inline">Showing </span>
                {totalItems === 0 ? 0 : (page - 1) * limit + 1}
                <span className="hidden sm:inline"> to </span>
                <span className="sm:hidden">-</span>
                {Math.min(page * limit, totalItems)} of {totalItems}
                <span className="hidden sm:inline"> entries</span>
            </div>

            <div className="flex items-center gap-1">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {(() => {
                    let startPage = Math.max(1, page - 1);
                    let endPage = Math.min(totalPages, page + 1);

                    if (endPage - startPage < 2) {
                        if (startPage === 1) {
                            endPage = Math.min(totalPages, 3);
                        } else if (endPage === totalPages) {
                            startPage = Math.max(1, totalPages - 2);
                        }
                    }

                    const visiblePages = [];
                    for (let i = startPage; i <= endPage; i++) {
                        visiblePages.push(i);
                    }

                    return visiblePages.map(pageNum => (
                        <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer ${page === pageNum
                                ? 'bg-[#0A437A] text-white shadow-sm font-bold'
                                : 'border border-transparent text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {pageNum}
                        </button>
                    ));
                })()}

                <button
                    disabled={page === totalPages || totalPages === 0}
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
