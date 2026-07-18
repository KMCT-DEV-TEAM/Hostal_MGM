
import React, { useEffect, useRef, useCallback, useState } from 'react';
import InfoCard from './InfoCard';
import { Loader2, CheckSquare, Square } from 'lucide-react';

export default function ResponsiveList({
    data,
    cardConfig, // Contains avatar, title, subtitle, status, fields, onEdit mapping functions
    onRowClick,
    selectedIds = [],
    canSelect = false,
    onSelectAll,
    onSelectRow,
    isSelectableFn,
    page = 1,
    totalPages = 1,
    onLoadMore,
    loading = false,
    pageScrollMode = false
}) {
    const [accumulatedData, setAccumulatedData] = useState([]);

    useEffect(() => {
        if (!data || data.length === 0) {
            if (page === 1) setAccumulatedData([]);
            return;
        }

        if (page === 1) {
            setAccumulatedData(data);
        } else {
            setAccumulatedData(prev => {
                const newIds = new Set(data.map(item => item._id || item.id));
                const filteredPrev = prev.filter(item => !newIds.has(item._id || item.id));
                return [...filteredPrev, ...data];
            });
        }
    }, [data, page]);

    const hasMore = page < totalPages;
    const isLoadingMore = loading && page > 1;

    const observer = useRef();
    const loadingRef = useRef(loading);
    const hasMoreRef = useRef(hasMore);
    const onLoadMoreRef = useRef(onLoadMore);

    // Keep refs in sync with props
    useEffect(() => {
        loadingRef.current = loading;
        hasMoreRef.current = hasMore;
        onLoadMoreRef.current = onLoadMore;
    }, [loading, hasMore, onLoadMore]);

    const lastElementRef = useCallback(node => {
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            console.log('[InfiniteScroll] Intersection Observer fired! intersecting:', entries[0].isIntersecting, 'hasMore:', hasMoreRef.current, 'loading:', loadingRef.current);
            if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
                console.log('[InfiniteScroll] Triggering onLoadMore!');
                onLoadMoreRef.current?.();
            }
        }, { rootMargin: '300px' });
        if (node) observer.current.observe(node);
    }, []);

    if ((!accumulatedData || accumulatedData.length === 0) && !loading) return null;

    return (
        <div className={`flex flex-col gap-3 mt-4 md:hidden bg-gray-50/50 ${pageScrollMode ? '' : 'flex-1 overflow-y-auto'}`}>
            {loading && (!accumulatedData || accumulatedData.length === 0) ? (
                Array.from({ length: 3 }).map((_, index) => (
                    <InfoCard key={`skeleton-${index}`} isLoading={true} />
                ))
            ) : (
                <>
                    {canSelect && accumulatedData.length > 0 && selectedIds.length > 0 && (() => {
                        const selectableItems = isSelectableFn ? accumulatedData.filter(item => isSelectableFn(item)) : accumulatedData;
                        if (selectableItems.length === 0) return null;
                        
                        return (
                            <div className={`z-10 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm mb-1 ${pageScrollMode ? 'sticky top-[63px]' : 'sticky top-0'}`}>
                                <button
                                    type="button"
                                    onClick={() => onSelectAll?.(selectableItems.map(item => item._id || item.id))}
                                    className="flex items-center gap-3 focus:outline-none cursor-pointer group"
                                >
                                    {selectedIds.length === selectableItems.length ? (
                                        <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                    ) : (
                                        <Square className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
                                    )}
                                    <span className="text-sm font-medium text-gray-700">
                                        Select All ({selectedIds.length}/{selectableItems.length})
                                    </span>
                                </button>
                            </div>
                        );
                    })()}

                    {accumulatedData.map((item, index) => {
                        const isSelected = selectedIds.includes(item._id || item.id || index);

                        // Evaluate config accessors
                        const avatar = cardConfig.avatar ? cardConfig.avatar(item) : (cardConfig.customIcon ? cardConfig.customIcon(item) : null);
                        const title = cardConfig.title ? cardConfig.title(item) : null;
                        const fields = cardConfig.fields ? cardConfig.fields.map(f => {
                            const Icon = f.icon;
                            return {
                                label: f.label || f.header,
                                icon: Icon ? (typeof Icon === 'function' ? <Icon /> : Icon) : null,
                                value: f.accessor ? f.accessor(item) : (typeof f.value === 'function' ? f.value(item) : f.value)
                            };
                        }).filter(f => f.value !== undefined && f.value !== null && f.value !== '') : [];
                        const status = cardConfig.status ? cardConfig.status(item) : null;
                        const stats = cardConfig.stats ? cardConfig.stats(item) : [];
                        const actionSlot = cardConfig.actionSlot ? cardConfig.actionSlot(item) : (cardConfig.actions ? cardConfig.actions(item) : null);
                        const itemCanSelect = canSelect && (!isSelectableFn || isSelectableFn(item));

                        const card = (
                            <div
                                key={item._id || item.id || index}
                                ref={index === accumulatedData.length - 1 ? lastElementRef : null}
                            >
                                <InfoCard
                                    avatar={avatar}
                                    title={title}
                                    fields={fields}
                                    stats={stats}
                                    statsGridClass={cardConfig.statsGridClass}
                                    status={status}
                                    footer={actionSlot}
                                    onEdit={cardConfig.onEdit ? () => cardConfig.onEdit(item) : undefined}
                                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                                    selected={isSelected}
                                    canSelect={itemCanSelect}
                                    selectionMode={selectedIds.length > 0}
                                    onSelect={() => onSelectRow?.(item._id || item.id || index)}
                                />
                            </div>
                        );

                        return card;
                    })}
                </>
            )}

            {isLoadingMore && (
                Array.from({ length: 2 }).map((_, index) => (
                    <InfoCard key={`skeleton-more-${index}`} isLoading={true} />
                ))
            )}
        </div>
    );
}
