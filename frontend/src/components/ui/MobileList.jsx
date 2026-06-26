import React from 'react';
import { Square, CheckSquare, Pencil } from 'lucide-react';
import MobileSkeletonLoader from '@/components/ui/MobileSkeletonLoader';

/**
 * Reusable generic MobileList component.
 *
 * @param {Array} items - List of items to display
 * @param {boolean} loading - Loading state indicator
 * @param {string|object} error - Error message or object
 * @param {Array} selectedIds - List of currently selected item IDs
 * @param {Function} onSelectAll - Callback when the Select All button is clicked
 * @param {Function} onSelect - Callback when an individual item's checkbox is clicked
 * @param {Function} onEdit - Callback when the edit button of an item is clicked
 * @param {boolean} canSelect - Show checkbox selection column
 * @param {boolean} canEdit - Show edit button
 * @param {Array} statusLoadingIds - IDs of items whose status update is currently loading
 * @param {string} emptyText - Text to display when there are no items
 * @param {Function} renderItem - Render function for the card content (item, isSelected, isLoading) => ReactNode
 */
export default function MobileList({
    items = [],
    loading = false,
    error = null,
    selectedIds = [],
    onSelectAll,
    onSelect,
    onEdit,
    canSelect = false,
    canEdit = false,
    statusLoadingIds = [],
    emptyText = "No items match the selected filter.",
    renderItem,
    onRowClick
}) {
    const isAllSelected = items.length > 0 && selectedIds.length === items.length;

    return (
        <div className="md:hidden flex flex-col gap-4 mt-4 md:mt-0 flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none px-2 sm:px-0">
            {canSelect && !loading && !error && items.length > 0 && (
                <div className="flex items-center gap-2 px-1 mb-1">
                    <button
                        type="button"
                        onClick={onSelectAll}
                        className="focus:outline-none text-gray-400 cursor-pointer flex items-center gap-2"
                    >
                        {isAllSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                            <Square className="w-5 h-5" />
                        )}
                        <span className="text-sm font-medium text-gray-600">Select All</span>
                    </button>
                </div>
            )}

            {loading ? (
                <MobileSkeletonLoader rows={3} />
            ) : error ? (
                <div className="text-center text-red-500 p-8 bg-white rounded-xl">
                    {typeof error === 'object' ? error.message || JSON.stringify(error) : error}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center text-gray-500 p-8 bg-white rounded-xl border border-gray-100">
                    {emptyText}
                </div>
            ) : (
                items.map((item, index) => {
                    const rowId = item._id || item.id;
                    const isSelected = selectedIds.includes(rowId);
                    const isLoading = statusLoadingIds.includes(rowId);

                    return (
                        <div
                            key={rowId || index}
                            onClick={(e) => {
                                if (onRowClick) onRowClick(item);
                            }}
                            className={`bg-white p-4 rounded-xl shadow-sm flex flex-col relative border transition-all ${
                                isSelected ? 'border-primary bg-blue-50/20' : 'border-gray-100'
                            } ${isLoading ? 'opacity-50 pointer-events-none' : ''} ${onRowClick ? 'cursor-pointer active:bg-gray-50' : ''}`}
                        >
                            {(canSelect || (canEdit && onEdit)) && (
                                <div className="flex justify-between items-start mb-3">
                                    {canSelect && (
                                        <button
                                            type="button"
                                            onClick={() => onSelect && onSelect(rowId)}
                                            className="focus:outline-none text-gray-300 cursor-pointer"
                                        >
                                            {isSelected ? (
                                                <CheckSquare className="w-5 h-5 text-primary" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                    )}
                                    {canEdit && onEdit && (
                                        <button
                                            type="button"
                                            onClick={() => onEdit && onEdit(item)}
                                            className="text-blue-400 hover:text-primary cursor-pointer ms-auto"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {renderItem && renderItem(item, isSelected, isLoading)}
                        </div>
                    );
                })
            )}
        </div>
    );
}
