import React from 'react';
import { Square, CheckSquare, Search } from 'lucide-react';
import TableSkeletonLoader from '@/components/ui/TableSkeletonLoader';
import MobileList from '@/components/ui/MobileList';
import Pagination from '@/components/ui/Pagination';

/**
 * Reusable layout component for data tables.
 * Combines search, custom toolbar actions, responsive desktop/mobile tables, and pagination.
 */
export default function DataTable({
    // Search Props
    searchQuery = '',
    onSearchChange,
    searchPlaceholder = "Search",

    // Toolbar Props
    toolbarActions, // ReactNode

    // Table Props (Desktop)
    headers = [],
    items = [],
    loading = false,
    error = null,
    emptyText = "No items found.",
    renderRow, // (item, index, isSelected, isLoading) => ReactNode

    // Mobile Props
    renderMobileItem, // (item, isSelected, isLoading) => ReactNode

    // Row Click
    onRowClick, // (item) => void

    // Selection Props
    canSelect = false,
    selectedIds = [],
    onSelectAll,
    onSelect,
    statusLoadingIds = [],

    // Pagination Props
    page,
    setPage,
    limit,
    totalItems,
    totalPages
}) {
    const isAllSelected = items.length > 0 && selectedIds.length === items.length;
    const totalCols = (canSelect ? 1 : 0) + headers.length;

    const hasToolbar = onSearchChange || toolbarActions;

    return (
        <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0">

            {/* Toolbar section */}
            {hasToolbar && (
                <div className="p-4 flex flex-row items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
                    <div className="relative w-full max-w-sm">
                        {onSearchChange && (
                            <>
                                <input
                                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none placeholder-gray-400 font-medium text-gray-700"
                                    placeholder={searchPlaceholder}
                                    value={searchQuery}
                                    onChange={onSearchChange}
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </>
                        )}
                    </div>

                    {toolbarActions && (
                        <div className="flex items-center gap-3">
                            {toolbarActions}
                        </div>
                    )}
                </div>
            )}

            {/* Desktop Grid Layout */}
            <div className="hidden md:block flex-1 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
                <table className="w-full text-start relative whitespace-nowrap">
                    <thead className="sticky top-0 z-10 bg-[#F8FAFC] shadow-sm">
                        <tr className="text-text-primary text-sm font-semibold border-b border-gray-50">
                            {canSelect && (
                                <th className="text-gray-300 p-4 w-12 text-center">
                                    <button
                                        type="button"
                                        onClick={onSelectAll}
                                        className="focus:outline-none flex items-center justify-center cursor-pointer mx-auto"
                                    >
                                        {isAllSelected ? (
                                            <CheckSquare className="h-5 w-5 text-primary" />
                                        ) : (
                                            <Square className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                                        )}
                                    </button>
                                </th>
                            )}
                            {headers.map((h, i) => {
                                if (typeof h === 'object' && h !== null) {
                                    const alignClass = h.align === 'center' ? 'text-center' : h.align === 'end' ? 'text-end' : 'text-start';
                                    return (
                                        <th key={i} className={`p-4 ${alignClass} ${h.className || ''}`}>{h.label}</th>
                                    );
                                }
                                return (
                                    <th key={i} className="p-4 text-start">{h}</th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm text-text-secondary relative">
                        {loading && items.length === 0 ? (
                            <TableSkeletonLoader columns={totalCols} />
                        ) : error ? (
                            <tr>
                                <td colSpan={totalCols} className="p-8 text-center text-red-500 font-medium bg-white">
                                    {typeof error === 'object' ? error.message || JSON.stringify(error) : error}
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={totalCols} className="p-8 text-center text-gray-500 font-medium bg-white">
                                    {emptyText}
                                </td>
                            </tr>
                        ) : (
                            <>
                                {loading && (
                                    <tr>
                                        <td colSpan={totalCols} className="p-0">
                                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 min-h-[100px]">
                                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {items.map((item, index) => {
                                    const rowId = item._id || item.id;
                                    const isSelected = selectedIds.includes(rowId);
                                    const isLoading = statusLoadingIds.includes(rowId);

                                    return (
                                        <tr
                                            key={rowId || index}
                                            onClick={(e) => {
                                                if (onRowClick) onRowClick(item);
                                            }}
                                            className={`transition-colors relative ${onRowClick ? 'cursor-pointer hover:bg-gray-50/80' : 'hover:bg-gray-50/40'} ${isSelected ? 'bg-blue-50/20' : ''
                                                } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                                        >
                                            {canSelect && (
                                                <td className="p-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => onSelect && onSelect(rowId)}
                                                        className="focus:outline-none flex items-center justify-center cursor-pointer mx-auto"
                                                    >
                                                        {isSelected ? (
                                                            <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                                        ) : (
                                                            <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                                                        )}
                                                    </button>
                                                </td>
                                            )}
                                            {renderRow && renderRow(item, index, isSelected, isLoading)}
                                        </tr>
                                    );
                                })}
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            {renderMobileItem && (
                <MobileList
                    items={items}
                    loading={loading}
                    error={error}
                    selectedIds={selectedIds}
                    onSelectAll={onSelectAll}
                    onSelect={onSelect}
                    canSelect={canSelect}
                    statusLoadingIds={statusLoadingIds}
                    emptyText={emptyText}
                    renderItem={renderMobileItem}
                    onRowClick={onRowClick}
                />
            )}

            {/* Pagination */}
            {setPage && (!error && totalItems > 0) && (
                <div className="relative">
                    {loading && items.length > 0 && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10" />}
                    <Pagination
                        page={page}
                        setPage={setPage}
                        limit={limit}
                        totalItems={totalItems}
                        totalPages={totalPages}
                    />
                </div>
            )}

        </div>
    )
}