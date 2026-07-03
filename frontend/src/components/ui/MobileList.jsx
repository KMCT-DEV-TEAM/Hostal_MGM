import React, { useState } from 'react';
import { Pencil, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
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
 * @param {Function} onViewDetails - Callback when the "View Details" button is clicked
 * @param {boolean} canSelect - Show checkbox selection column
 * @param {boolean} canEdit - Show edit button
 * @param {string} emptyText - Text to display when there are no items
 * @param {Function} titleFn - Function to extract the title from an item: (item) => string
 * @param {Function} renderBody - Render function for the expanded fields: (item) => ReactNode
 */
export default function MobileList({
    items = [],
    loading = false,
    error = null,
    selectedIds = [],
    onSelectAll,
    onSelect,
    onEdit,
    onViewDetails,
    canSelect = false,
    canEdit = false,
    emptyText = "No items match the selected filter.",
    titleFn,
    isSelectableFn,
    renderBody
}) {
    const isAllSelected = items.length > 0 && selectedIds.length === items.length;
    const [expandedIds, setExpandedIds] = useState([]);

    const toggleExpand = (e, id) => {
        e.stopPropagation();
        setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="md:hidden flex flex-col gap-4 mt-4 md:mt-0 flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none px-2 sm:px-0">
            {canSelect && !loading && !error && selectedIds.length > 0 && items.length > 0 && (
                <div className="flex items-center gap-2 px-1 mb-1">
                    <button
                        type="button"
                        onClick={onSelectAll}
                        className="focus:outline-none text-gray-400 cursor-pointer flex items-center gap-2"
                    >
                        {isAllSelected ? (
                            <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                        ) : (
                            <Square className="w-5 h-5" />
                        )}
                        <span className="text-xs font-medium text-gray-600">Select All</span>
                    </button>
                </div>
            )}

            {loading ? (
                <MobileSkeletonLoader rows={3} />
            ) : error ? (
                <div className="text-center text-danger p-8 bg-white rounded-xl shadow-sm">
                    {typeof error === 'object' ? error.message || JSON.stringify(error) : error}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center text-gray-400 p-8 bg-white rounded-xl shadow-sm">
                    {emptyText}
                </div>
            ) : (
                items.map((item, index) => {
                    const rowId = item._id || item.id;
                    const isSelected = selectedIds.includes(rowId);
                    const isExpanded = expandedIds.includes(rowId);

                    return (
                        <div 
                            key={rowId || index} 
                            className={`bg-white rounded-xl shrink-0 ${
                                isExpanded 
                                    ? 'overflow-visible shadow-md z-10 relative' 
                                    : 'overflow-hidden shadow-sm'
                            } ${
                                isExpanded 
                                    ? (isSelected ? 'border-x border-t border-b-0 border-[#0A437A]' : 'border-x border-t border-b-0 border-gray-200') 
                                    : (isSelected ? 'border border-[#0A437A]' : 'border border-gray-50')
                            }`}
                        >
                            {/* Header */}
                            <div 
                                className={`flex justify-between items-center p-3 border-b border-gray-50 bg-gray-50/30 cursor-pointer ${isExpanded ? 'rounded-t-xl' : ''}`}
                                onClick={(e) => toggleExpand(e, rowId)}
                            >
                                <div className="flex items-center gap-2">
                                    {canSelect && (
                                        <div className="flex items-center justify-center shrink-0">
                                            {isSelectableFn ? isSelectableFn(item) ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onSelect && onSelect(rowId); }}
                                                    className="focus:outline-none text-gray-300 cursor-pointer flex items-center justify-center shrink-0"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                                    ) : (
                                                        <Square className="w-5 h-5" />
                                                    )}
                                                </button>
                                            ) : (
                                                <button disabled className="focus:outline-none text-gray-300 opacity-50 cursor-not-allowed flex items-center justify-center shrink-0">
                                                    <Square className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onSelect && onSelect(rowId); }}
                                                    className="focus:outline-none text-gray-300 cursor-pointer flex items-center justify-center shrink-0"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                                    ) : (
                                                        <Square className="w-5 h-5" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <span className="font-medium text-text-secondary text-[11px]">
                                        {titleFn ? titleFn(item) : (item.name || `Item ${index + 1}`)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {canEdit && onEdit && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0 ml-1">
                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Expandable Content */}
                            {isExpanded && (
                                <div className="flex flex-col bg-gray-50 animate-in slide-in-from-top-2 duration-200 rounded-b-xl">
                                    <div className="flex flex-col text-[11px] rounded-b-xl">
                                        {renderBody && renderBody(item)}
                                    </div>
                                    {onViewDetails && (
                                        <button
                                            onClick={() => onViewDetails(item)}
                                            className="w-full py-3 bg-[#0A437A] text-white font-semibold text-[13px] hover:bg-secondary transition-colors cursor-pointer rounded-b-xl"
                                        >
                                            View Details
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}

export const MobileRow = ({ label, value, valueClass = "text-text-secondary" }) => (
    <div className="flex border-b border-gray-50/50 bg-white items-center min-h-[40px]">
        <div className="w-1/3 py-2.5 px-3 text-text-secondary font-medium border-r border-gray-50/50 break-words">{label}</div>
        <div className={`w-2/3 py-2.5 px-3 flex items-center gap-1 ${valueClass}`}>
            <span className="shrink-0">:</span> 
            <div className="flex-1 min-w-0 break-words">{value}</div>
        </div>
    </div>
);

export const MobileStatusRow = ({ label = "Status", isActive, onClick }) => (
    <div className="flex border-b border-gray-50/50 bg-white items-center min-h-[40px]">
        <div className="w-1/3 py-2.5 px-3 text-text-secondary font-medium border-r border-gray-50/50">{label}</div>
        <div className="w-2/3 py-2.5 px-3 flex items-center gap-1">
            <span className="mr-1">:</span>
            <button 
                type="button"
                onClick={onClick}
                className="flex items-center font-medium cursor-pointer text-text-secondary"
            >
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                {isActive ? 'Active' : 'Inactive'}
            </button>
        </div>
    </div>
);
