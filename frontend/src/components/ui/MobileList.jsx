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
    renderItem,
    hasMore,
    onLoadMore,
    currentPage,
    totalPages
}) {
    const [accumulatedItems, setAccumulatedItems] = useState([]);

    React.useEffect(() => {
        if (currentPage === undefined) {
            setAccumulatedItems(items);
            return;
        }

        if (currentPage === 1) {
            setAccumulatedItems(items);
        } else {
            setAccumulatedItems(prev => {
                const freshMap = new Map(items.map(i => [i._id || i.id, i]));

                const updatedPrev = prev.map(p => {
                    const id = p._id || p.id;
                    if (freshMap.has(id)) {
                        const fresh = freshMap.get(id);
                        freshMap.delete(id);
                        return fresh;
                    }
                    return p;
                });

                return [...updatedPrev, ...Array.from(freshMap.values())];
            });
        }
    }, [items, currentPage]);

    const displayItems = currentPage !== undefined ? accumulatedItems : items;

    const isAllSelected = displayItems.length > 0 && displayItems.every(item => selectedIds.includes(item._id || item.id));
    const [expandedIds, setExpandedIds] = useState([]);
    const observer = React.useRef();

    const [artificialLoading, setArtificialLoading] = useState(false);

    const lastElementRef = React.useCallback(node => {
        if (loading || artificialLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && onLoadMore) {
                setArtificialLoading(true);
                setTimeout(() => {
                    setArtificialLoading(false);
                    onLoadMore();
                }, 2000);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, artificialLoading, hasMore, onLoadMore]);

    const displayLoading = loading || artificialLoading;

    const toggleExpand = (e, id) => {
        e.stopPropagation();
        setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const pressTimer = React.useRef(null);
    const isLongPress = React.useRef(false);

    const startPress = (rowId, item) => {
        if (!canSelect) return;
        if (isSelectableFn && !isSelectableFn(item)) return;

        isLongPress.current = false;
        pressTimer.current = setTimeout(() => {
            if (onSelect) onSelect(rowId);
            isLongPress.current = true;
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        }, 500);
    };

    const cancelPress = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
        setTimeout(() => {
            isLongPress.current = false;
        }, 50);
    };

    return (
        <div className="md:hidden flex flex-col gap-4 mt-4 md:mt-0 flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none px-2 sm:px-0">
            {canSelect && !displayLoading && !error && selectedIds.length > 0 && displayItems.length > 0 && (
                <div className="flex items-center gap-2 px-1 mb-1">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onSelectAll) {
                                const allIds = displayItems.map(i => i._id || i.id);
                                onSelectAll(allIds);
                            }
                        }}
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

            {error ? (
                <div className="text-center text-danger p-8 bg-white rounded-xl shadow-sm">
                    {typeof error === 'object' ? error.message || JSON.stringify(error) : error}
                </div>
            ) : displayItems.length === 0 && !displayLoading ? (
                <div className="text-center text-gray-400 p-8 bg-white rounded-xl shadow-sm">
                    {emptyText}
                </div>
            ) : (
                <>
                    {displayItems.map((item, index) => {
                        const rowId = item._id || item.id;
                        const isSelected = selectedIds.includes(rowId);
                        const isLastItem = index === displayItems.length - 1;

                        if (renderItem) {
                            return (
                                <React.Fragment key={rowId || index}>
                                    <div ref={isLastItem ? lastElementRef : null}>
                                        {renderItem(item, isSelected)}
                                    </div>
                                </React.Fragment>
                            );
                        }

                        return (
                            <div
                                key={rowId || index}
                                ref={isLastItem ? lastElementRef : null}
                                className={`bg-white p-4 rounded-xl shadow-sm flex flex-col relative border transition-all select-none ${isSelected ? 'border-primary bg-blue-50/20' : 'border-gray-100'} ${canSelect ? 'cursor-pointer' : ''}`}
                                onTouchStart={() => startPress(rowId, item)}
                                onTouchEnd={cancelPress}
                                onTouchMove={cancelPress}
                                onMouseDown={() => startPress(rowId, item)}
                                onMouseUp={cancelPress}
                                onMouseLeave={cancelPress}
                                onClick={(e) => {
                                    if (isLongPress.current) {
                                        e.preventDefault();
                                        return;
                                    }
                                    if (canSelect && selectedIds.length > 0) {
                                        if (isSelectableFn && !isSelectableFn(item)) return;
                                        if (onSelect) onSelect(rowId);
                                    }
                                }}
                            >


                                {/* Content */}
                                <div className="flex items-start gap-4">
                                    {iconFn && (
                                        <div className="shrink-0 mt-1">
                                            {iconFn(item)}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0 pr-2">
                                        <div
                                            className="font-bold text-primary text-base mb-1 truncate transition-colors cursor-pointer hover:text-primary"
                                            onClick={(e) => {
                                                if (canSelect && selectedIds.length > 0) {
                                                    // Let the parent card's onClick handle selection
                                                    return;
                                                }
                                                e.stopPropagation();
                                                onViewDetails && onViewDetails(item);
                                            }}
                                        >
                                            {titleFn ? titleFn(item) : (item.name || `Item ${index + 1}`)}
                                        </div>

                                        {(subtitleFn || rightTopFn) && (
                                            <div className="flex flex-col gap-1 text-[10px] sm:text-xs text-gray-500 mb-2">
                                                {subtitleFn && (
                                                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                                                        {subtitleFn(item)}
                                                    </div>
                                                )}
                                                {rightTopFn && (
                                                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                                                        {rightTopFn(item)}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {renderBody && (
                                            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-50 text-[10px] sm:text-xs text-gray-400 w-full min-w-0">
                                                {renderBody(item)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Action Bar: Status & Edit */}
                                {(statusBadgeFn || canEdit) && (
                                    <div className="flex justify-end items-center gap-3 mt-auto pt-2">
                                        {statusBadgeFn && (
                                            <div>
                                                {statusBadgeFn(item)}
                                            </div>
                                        )}
                                        {((typeof canEdit === 'function' ? canEdit(item) : canEdit) && onEdit) ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                                className="text-blue-400 hover:text-primary cursor-pointer shrink-0 z-10 p-1"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        ) : (canEdit === true || (typeof canEdit === 'function')) && onEdit ? (
                                            <div className="shrink-0 z-10 p-1">
                                                <Pencil className="w-4 h-4 text-gray-300 cursor-not-allowed" />
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {displayLoading && (
                        <MobileSkeletonLoader rows={displayItems.length === 0 ? 5 : 1} />
                    )}
                </>
            )}
        </div>
    );
}

export const MobileRow = ({ label, value, valueClass = "text-gray-700 font-medium", icon }) => (
    <div className="flex items-center justify-between gap-2 text-[10px] sm:text-xs text-gray-500 mb-2 w-full min-w-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5 shrink-0">
            {icon && <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">{icon}</div>}
            <span className="font-medium">{label}:</span>
        </div>
        <div className={`text-right truncate min-w-0 ${valueClass}`}>{value}</div>
    </div>
);

export const MobileStatusRow = ({ label = "Status", isActive, onClick }) => (
    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400 mb-1.5 w-full min-w-0">
        <div className="font-medium whitespace-nowrap shrink-0">{label}:</div>
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer ${isActive ? 'bg-success/70 text-success' : 'bg-danger/70 text-danger'}`}
        >
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-success' : 'bg-danger'}`}></div>
            {isActive ? 'Active' : 'Inactive'}
        </button>
    </div>
);

export const MobileCardStatusBadge = ({ status, dotColorClass = "bg-success", bgColorClass = "bg-success/70", textColorClass = "text-success" }) => (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${bgColorClass} ${textColorClass}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${dotColorClass}`}></div>
        {status}
    </div>
);
