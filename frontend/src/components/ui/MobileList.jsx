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
    subtitleFn,
    iconFn,
    rightTopFn,
    statusBadgeFn,
    isSelectableFn,
    renderBody,
    renderItem
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

                    if (renderItem) {
                        return (
                            <React.Fragment key={rowId || index}>
                                {renderItem(item, isSelected)}
                            </React.Fragment>
                        );
                    }

                    return (
                        <div
                            key={rowId || index}
                            className={`bg-white rounded-xl shrink-0 mb-4 shadow-sm border transition-all ${isExpanded
                                    ? 'overflow-visible z-10 relative'
                                    : 'overflow-hidden'
                                } ${isSelected ? 'border-primary bg-blue-50/20' : 'border-gray-100'}`}
                        >
                            {/* Header */}
                            {/* Header */}
                            <div
                                className={`flex flex-col p-4 cursor-pointer ${isExpanded ? 'border-b border-gray-50' : ''}`}
                                onClick={(e) => toggleExpand(e, rowId)}
                            >
                                <div className="flex items-start justify-between w-full">
                                    <div className="flex items-start gap-3 w-full">
                                        {canSelect && (
                                            <div className="mt-1 flex items-center justify-center shrink-0">
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
                                        {iconFn && (
                                            <div className="shrink-0 mt-1">
                                                {iconFn(item)}
                                            </div>
                                        )}
                                        <div className="flex flex-col flex-1 min-w-0 pr-2">
                                            <span className="font-bold text-primary text-base mb-1 truncate transition-colors">
                                                {titleFn ? titleFn(item) : (item.name || `Item ${index + 1}`)}
                                            </span>
                                            {subtitleFn && (
                                                <span className="text-[10px] sm:text-xs text-gray-500 mb-1 truncate">
                                                    {subtitleFn(item)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {rightTopFn && (
                                        <div className="shrink-0 text-gray-400 text-xs ml-2 mt-1 whitespace-nowrap">
                                            {rightTopFn(item)}
                                        </div>
                                    )}
                                </div>

                                {/* Bottom section: Status + Actions */}
                                {(statusBadgeFn || onEdit || renderBody) && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex-1">
                                            {statusBadgeFn && statusBadgeFn(item)}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {((typeof canEdit === 'function' ? canEdit(item) : canEdit) && onEdit) ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                            ) : (
                                                (canEdit === true || (typeof canEdit === 'function')) && onEdit ? (
                                                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                                        <Pencil className="w-3.5 h-3.5 text-gray-300 cursor-not-allowed" />
                                                    </div>
                                                ) : null
                                            )}

                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Expandable Content */}
                            {isExpanded && (
                                <div className="flex flex-col animate-in slide-in-from-top-2 fade-in duration-200 rounded-b-2xl p-4 pt-2">
                                    <div className="flex flex-col gap-1.5 text-xs">
                                        {renderBody && renderBody(item)}
                                    </div>
                                    {onViewDetails && (
                                        <button
                                            onClick={() => onViewDetails(item)}
                                            className="w-full mt-4 py-2 bg-[#0A437A]/5 text-[#0A437A] font-semibold text-[13px] hover:bg-[#0A437A]/10 transition-colors cursor-pointer rounded-lg border border-[#0A437A]/10"
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

export const MobileRow = ({ label, value, valueClass = "text-gray-900 font-medium" }) => (
    <div className="flex justify-between items-start py-1.5 border-b border-gray-50/50 last:border-0 min-h-[32px]">
        <span className="text-gray-400 font-medium whitespace-nowrap mr-4">{label}</span>
        <div className={`text-right break-words flex-1 ${valueClass}`}>{value}</div>
    </div>
);

export const MobileStatusRow = ({ label = "Status", isActive, onClick }) => (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-50/50 last:border-0 min-h-[32px]">
        <span className="text-gray-400 font-medium">{label}</span>
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium cursor-pointer ${
                isActive ? 'bg-green-50/70 text-green-600' : 'bg-red-50/70 text-red-600'
            }`}
        >
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isActive ? 'Active' : 'Inactive'}
        </button>
    </div>
);

export const MobileCardStatusBadge = ({ status, dotColorClass = "bg-blue-500", bgColorClass = "bg-blue-50", textColorClass = "text-blue-600" }) => (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${bgColorClass} ${textColorClass}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${dotColorClass}`}></div>
        {status}
    </div>
);
