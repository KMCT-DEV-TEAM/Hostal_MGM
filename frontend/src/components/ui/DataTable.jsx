import React from 'react';
import { Square, CheckSquare, Search, Plus, Download, Trash2 } from 'lucide-react';
import TableSkeletonLoader from '@/components/ui/TableSkeletonLoader';
import MobileList from '@/components/ui/MobileList';
import Pagination from '@/components/ui/Pagination';
import Dropdown from '@/components/ui/Dropdown';

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
    onAdd,
    addText = "Add New",
    onExport,
    exportText = "Export",
    filterOptions,
    filterValue,
    onFilterChange,
    filterPlaceholder = "Filter",
    onDeleteSelected,
    deleteText = "Delete",

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

    const getFlattenedChildren = (children) => {
        const flat = [];
        React.Children.forEach(children, (child) => {
            if (child && child.type === React.Fragment) {
                flat.push(...getFlattenedChildren(child.props.children));
            } else if (child !== null && child !== undefined && child !== false) {
                flat.push(child);
            }
        });
        return flat;
    };

    const btnDelete = onDeleteSelected && selectedIds?.length > 0 ? (
        <button
            key="delete"
            onClick={onDeleteSelected}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-danger hover:bg-red-100 transition-colors shrink-0 shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
        >
            <Trash2 className="w-4 h-4" />
            {deleteText} {selectedIds.length > 0 ? `( ${selectedIds.length} )` : ''}
        </button>
    ) : null;

    const ddFilter = filterOptions ? (
        <Dropdown
            key="filter"
            options={filterOptions}
            value={filterValue}
            onChange={onFilterChange}
            placeholder={filterPlaceholder}
            minWidth="w-[140px]"
        />
    ) : null;

    const btnExport = onExport ? (
        <button
            key="export"
            onClick={onExport}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors shrink-0 shadow-sm md:shadow-none cursor-pointer whitespace-nowrap font-medium"
        >
            <Download className="w-4 h-4" />
            {exportText}
        </button>
    ) : null;

    const btnAdd = onAdd ? (
        <button
            key="add"
            onClick={onAdd}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-xl text-sm font-medium hover:bg-[#0A437A]/90 transition-colors shrink-0 shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
        >
            <Plus className="w-4 h-4" />
            {addText}
        </button>
    ) : null;

    const customActions = getFlattenedChildren(toolbarActions);

    // Build Desktop Actions: Delete -> Custom -> Filter -> Export -> Add
    const desktopActions = [];
    if (btnDelete) desktopActions.push(btnDelete);
    desktopActions.push(...customActions);
    if (ddFilter) desktopActions.push(ddFilter);
    if (btnExport) desktopActions.push(btnExport);
    if (btnAdd) desktopActions.push(btnAdd);

    // Build Mobile Actions
    let mobilePrimaryAction = null;
    const mobileSecondaryActions = [];

    // Primary mobile action preference: Add > Filter > Export > Custom
    if (btnAdd) {
        mobilePrimaryAction = btnAdd;
    } else if (ddFilter) {
        mobilePrimaryAction = ddFilter;
    } else if (btnExport) {
        mobilePrimaryAction = btnExport;
    } else if (customActions.length > 0) {
        mobilePrimaryAction = customActions[0];
    }

    // Secondary mobile actions: Everything else
    if (btnDelete) mobileSecondaryActions.push(btnDelete);
    if (customActions.length > 0) {
        if (mobilePrimaryAction === customActions[0]) {
            mobileSecondaryActions.push(...customActions.slice(1));
        } else {
            mobileSecondaryActions.push(...customActions);
        }
    }
    if (ddFilter && mobilePrimaryAction !== ddFilter) mobileSecondaryActions.push(ddFilter);
    if (btnExport && mobilePrimaryAction !== btnExport) mobileSecondaryActions.push(btnExport);
    if (btnAdd && mobilePrimaryAction !== btnAdd) mobileSecondaryActions.push(btnAdd);

    const hasToolbar = onSearchChange || desktopActions.length > 0;

    return (
        <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0">

            {/* Toolbar section */}
            {hasToolbar && (
                <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
                    {/* Top Row for Mobile (Search + Primary Action) / Left side for Desktop */}
                    <div className="flex w-full md:w-auto items-center gap-1">
                        {onSearchChange && (
                            <div className="relative flex-1 md:w-80 shrink-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none placeholder-gray-400 font-medium text-gray-700"
                                    placeholder={searchPlaceholder}
                                    value={searchQuery}
                                    onChange={onSearchChange}
                                />
                            </div>
                        )}

                        {/* Primary Action on Mobile */}
                        {mobilePrimaryAction && (
                            <div className="md:hidden shrink-0">
                                {mobilePrimaryAction}
                            </div>
                        )}
                    </div>

                    {/* Secondary Actions on Mobile / All Actions on Desktop */}
                    {desktopActions.length > 0 && (
                        <div className="flex flex-col md:flex-row items-center w-full md:w-auto pb-1 md:pb-0">
                            {/* Mobile: skip primaryAction */}
                            <div className="flex md:hidden items-center gap-3 w-full [&>*]:flex-1 [&_button]:justify-center">
                                {mobileSecondaryActions}
                            </div>
                            {/* Desktop: show all actions */}
                            <div className="hidden md:flex items-center gap-3 w-auto">
                                {desktopActions}
                            </div>
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
                        {loading ? (
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSelect && onSelect(rowId);
                                                        }}
                                                        className="focus:outline-none flex items-center justify-center cursor-pointer mx-auto"
                                                    >
                                                        {isSelected ? (
                                                            <CheckSquare className="w-5 h-5 text-primary" />
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