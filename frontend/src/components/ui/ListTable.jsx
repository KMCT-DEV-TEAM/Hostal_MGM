import React from 'react';
import { Square, CheckSquare } from 'lucide-react';
import TableSkeletonLoader from '@/components/ui/TableSkeletonLoader';

/**
 * Reusable generic ListTable component.
 *
 * @param {Array} headers - Array of headers (strings or objects: { label, align, className })
 * @param {Array} items - List of items to display
 * @param {boolean} loading - Loading state indicator
 * @param {string|object} error - Error message or object
 * @param {Array} selectedIds - List of currently selected item IDs
 * @param {Function} onSelectAll - Callback when the Select All button is clicked
 * @param {Function} onSelect - Callback when an individual item's checkbox is clicked
 * @param {boolean} canSelect - Show checkbox selection column
 * @param {Array} statusLoadingIds - IDs of items whose status update is currently loading
 * @param {string} emptyText - Text to display when there are no items
 * @param {Function} renderRow - Render function for the rest of the row's <td> elements (item, index, isSelected, isLoading) => ReactNode
 */
export default function ListTable({
    headers = [],
    items = [],
    loading = false,
    error = null,
    selectedIds = [],
    onSelectAll,
    onSelect,
    canSelect = false,
    statusLoadingIds = [],
    emptyText = "No items match the selected filter.",
    isSelectableFn,
    renderRow,
    currentPage,
    hasMore,
    onLoadMore
}) {
    const [accumulatedItems, setAccumulatedItems] = React.useState([]);
    const [displayLoading, setDisplayLoading] = React.useState(false);
    const observer = React.useRef();

    React.useEffect(() => {
        if (currentPage === 1) {
            setAccumulatedItems(items);
        } else {
            setAccumulatedItems(prev => {
                const newItems = [...prev];
                const existingIds = new Set(prev.map(i => i._id || i.id));
                items.forEach(item => {
                    if (!existingIds.has(item._id || item.id)) {
                        newItems.push(item);
                    }
                });
                return newItems;
            });
        }
    }, [items, currentPage]);

    const displayItems = currentPage !== undefined ? accumulatedItems : items;

    React.useEffect(() => {
        if (loading && displayItems.length > 0) {
            setDisplayLoading(true);
        } else if (!loading) {
            const timer = setTimeout(() => {
                setDisplayLoading(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [loading, displayItems.length]);

    const lastElementRef = React.useCallback(node => {
        if (loading || displayLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                if (onLoadMore) onLoadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, displayLoading, hasMore, onLoadMore]);

    const isAllSelected = displayItems.length > 0 && selectedIds.length === displayItems.length;
    const totalCols = (canSelect ? 1 : 0) + headers.length;

    return (
        <div className="hidden md:block flex-1 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
            <table className="w-full text-start relative">
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
                <tbody className="divide-y divide-gray-50 text-sm text-text-secondary">
                    {loading && displayItems.length === 0 ? (
                        <TableSkeletonLoader columns={totalCols} rows={5} />
                    ) : error && displayItems.length === 0 ? (
                        <tr>
                            <td colSpan={totalCols} className="p-8 text-center text-red-500 font-medium">
                                {typeof error === 'object' ? error.message || JSON.stringify(error) : error}
                            </td>
                        </tr>
                    ) : displayItems.length === 0 ? (
                        <tr>
                            <td colSpan={totalCols} className="p-8 text-center text-gray-500 font-medium bg-white">
                                {emptyText}
                            </td>
                        </tr>
                    ) : (
                        <>
                            {displayItems.map((item, index) => {
                                const rowId = item._id || item.id;
                                const isSelected = selectedIds.includes(rowId);
                                const isLoading = statusLoadingIds.includes(rowId);

                                return (
                                    <tr
                                        key={rowId || index}
                                        ref={index === displayItems.length - 1 ? lastElementRef : null}
                                        className={`hover:bg-gray-50/40 transition-colors ${
                                            isSelected ? 'bg-blue-50/20' : ''
                                        } ${isLoading ? 'opacity-50 pointer-events-none' : ''} relative`}
                                    >
                                        {canSelect && (
                                            <td className="p-4 text-center">
                                                {isSelectableFn ? isSelectableFn(item) ? (
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
                                                ) : (
                                                    <button disabled className="focus:outline-none flex items-center justify-center mx-auto text-gray-300 opacity-50 cursor-not-allowed">
                                                        <Square className="w-5 h-5" />
                                                    </button>
                                                ) : (
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
                                                )}
                                            </td>
                                        )}
                                        {renderRow && renderRow(item, index, isSelected, isLoading)}
                                    </tr>
                                );
                            })}
                            {displayLoading && displayItems.length > 0 && (
                                <TableSkeletonLoader columns={totalCols} rows={1} />
                            )}
                        </>
                    )}
                </tbody>
            </table>
        </div>
    );
}
