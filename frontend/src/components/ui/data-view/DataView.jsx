import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import DesktopTable from './DesktopTable';
import ResponsiveList from './ResponsiveList';
import { LoadingState, ErrorState, EmptyState } from './States';

export function DataToolbar({
    searchQuery,
    onSearchChange,
    searchPlaceholder = 'Search...',
    startSlot,
    endSlot
}) {
    const hasToolbarContent = onSearchChange || startSlot || endSlot;
    if (!hasToolbarContent) return null;

    return (
        <div className="px-4 py-3 flex flex-col md:flex-row items-start md:items-center rounded-xl md:rounded-t-xl justify-between gap-4   bg-white ">
            <div className="flex w-full md:w-auto items-center gap-3">
                {onSearchChange && (
                    <div className="relative flex-1 md:w-80 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A437A]/20 focus:border-[#0A437A] placeholder-gray-400 text-gray-700 transition-all"
                            placeholder={searchPlaceholder}
                            value={searchQuery || ''}
                            onChange={onSearchChange}
                        />
                    </div>
                )}
                {startSlot}
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                {endSlot}
            </div>
        </div>
    );
}

export function DesktopPagination({
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    totalPages,
    pageScrollMode = false
}) {
    if (!page || !setPage) return null;

    return (
        <div className={`hidden md:flex flex-row p-0 sm:p-4 bg-white border border-gray-50 items-center justify-between text-[10px] sm:text-xs font-medium text-gray-500 rounded-b-xl shadow-sm shrink-0 mt-auto ${pageScrollMode ? 'sticky bottom-0 z-30' : ''}`}>
            <div className="flex items-center gap-3">
                {setLimit && (
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:inline">Rows per page:</span>
                        <Dropdown
                            options={[10, 25, 50, 100]}
                            value={limit}
                            onChange={(val) => {
                                setLimit(val);
                                setPage(1);
                            }}
                            minWidth="w-[70px]"
                            triggerClassName="px-2 py-1 text-xs bg-white 0 focus:border-secondary shadow-sm"
                            placement="top"
                        />
                    </div>
                )}
                <div>
                    <span className="hidden sm:inline">Showing </span>
                    {totalItems === 0 ? 0 : (page - 1) * limit + 1}
                    <span className="hidden sm:inline"> to </span>
                    <span className="sm:hidden">-</span>
                    {Math.min(page * limit, totalItems)} of {totalItems}
                    <span className="hidden sm:inline"> entries</span>
                </div>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(Math.max(page - 1, 1))}
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

                    return visiblePages.map((pageNum) => (
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
                    disabled={page >= totalPages}
                    onClick={() => setPage(Math.min(page + 1, totalPages))}
                    className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

/**
 * DataView - Master orchestrator that takes pure configuration and renders the entire UI structure.
 * No useContext used. Props are strictly passed downwards.
 */
export default function DataView({
    // State
    data = [],
    loading = false,
    error = null,

    // Configurations
    columns = [],
    cardConfig,

    // Search
    searchQuery,
    onSearchChange,
    searchPlaceholder,

    // Selection
    canSelect = false,
    selectedIds = [],
    onSelectAll,
    onSelectRow,

    // Pagination (Desktop)
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    totalPages,

    // Pagination (Mobile Infinite Scroll)
    fetchMore, // Optional: if provided, called instead of setPage(page + 1)

    // Action Slots
    toolbarStartSlot,
    toolbarEndSlot,

    // Row interactions
    onRowClick,

    // UI states
    emptyText = 'No records found',
    className = '',
    pageScrollMode = false
}) {
    const handleLoadMore = useCallback(() => {
        if (loading) return;
        if (fetchMore) {
            fetchMore();
        } else if (setPage && page < totalPages) {
            setPage(page + 1);
        }
    }, [loading, fetchMore, setPage, page, totalPages]);


    const hasMore = page < totalPages;
    const isLoadingMore = loading && page > 1;

    return (
        <div className={`flex flex-col   ${pageScrollMode ? '' : 'h-full overflow-hidden'} ${className}`}>

            <div className={pageScrollMode ? "relative z-30 sticky top-0 rounded-xl   shadow-sm" : "relative z-10 "}>
                <DataToolbar
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    searchPlaceholder={searchPlaceholder}
                    startSlot={toolbarStartSlot}
                    endSlot={toolbarEndSlot}
                />
            </div>

            <div className={`flex-1 relative flex flex-col w-full ${pageScrollMode ? 'bg-gray-50/50 md:bg-white' : 'overflow-hidden bg-gray-50/50 md:bg-white min-h-0'}`}>
                {error ? (
                    <div className="flex-1 flex items-center justify-center">
                        <ErrorState message={error} />
                    </div>
                ) : data?.length === 0 && !loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <EmptyState message={emptyText} />
                    </div>
                ) : (
                    <>
                        <DesktopTable
                            pageScrollMode={pageScrollMode}
                            data={data}
                            columns={columns}
                            onRowClick={onRowClick}
                            selectedIds={selectedIds}
                            onSelectAll={onSelectAll}
                            onSelectRow={onSelectRow}
                            canSelect={canSelect}
                            loading={loading}
                        />

                        {cardConfig && (
                            <ResponsiveList
                                pageScrollMode={pageScrollMode}
                                data={data}
                                cardConfig={cardConfig}
                                onRowClick={onRowClick}
                                selectedIds={selectedIds}
                                canSelect={canSelect}
                                onSelectAll={onSelectAll}
                                onSelectRow={onSelectRow}
                                page={page}
                                totalPages={totalPages}
                                loading={loading}
                                onLoadMore={handleLoadMore}
                            />
                        )}
                    </>
                )}
            </div>

            <DesktopPagination
                pageScrollMode={pageScrollMode}
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                totalItems={totalItems}
                totalPages={totalPages}
            />

        </div>
    );
}
