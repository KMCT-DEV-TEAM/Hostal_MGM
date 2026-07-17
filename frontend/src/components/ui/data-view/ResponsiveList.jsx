
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
    const lastElementRef = useCallback(node => {
        if (isLoadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && onLoadMore) {
                onLoadMore();
            }
        }, { rootMargin: '100px' });
        if (node) observer.current.observe(node);
    }, [isLoadingMore, hasMore, onLoadMore]);

    if ((!accumulatedData || accumulatedData.length === 0) && !loading) return null;

    return (
        <div className={`flex flex-col gap-3 mt-4 md:hidden bg-gray-50/50 ${pageScrollMode ? '' : 'flex-1 overflow-y-auto'}`}>
            {loading && (!accumulatedData || accumulatedData.length === 0) ? (
                Array.from({ length: 3 }).map((_, index) => (
                    <InfoCard key={`skeleton-${index}`} isLoading={true} />
                ))
            ) : (
                <>
                    {canSelect && accumulatedData.length > 0 && selectedIds.length > 0 && (
                <div className={`z-10 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm mb-1 ${pageScrollMode ? 'sticky top-[63px]' : 'sticky top-0'}`}>
                    <button
                        type="button"
                        onClick={() => onSelectAll?.(accumulatedData.map(item => item._id || item.id))}
                        className="flex items-center gap-3 focus:outline-none cursor-pointer group"
                    >
                        {selectedIds.length === accumulatedData.length ? (
                            <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                        ) : (
                            <Square className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-700">
                            Select All ({selectedIds.length}/{accumulatedData.length})
                        </span>
                    </button>
                </div>
            )}

            {accumulatedData.map((item, index) => {
                const isSelected = selectedIds.includes(item._id || item.id || index);

                // Evaluate config accessors
                const avatar = cardConfig.avatar ? cardConfig.avatar(item) : null;
                const title = cardConfig.title ? cardConfig.title(item) : null;
                const fields = cardConfig.fields ? cardConfig.fields.map(f => {
                    const Icon = f.icon;
                    return {
                        label: f.label || f.header,
                        icon: Icon ? (typeof Icon === 'function' ? <Icon /> : Icon) : null,
                        value: f.accessor ? f.accessor(item) : (typeof f.value === 'function' ? f.value(item) : f.value)
                    };
                }).filter(f => f.value) : [];
                const status = cardConfig.status ? cardConfig.status(item) : null;
                const stats = cardConfig.stats ? cardConfig.stats(item) : [];

                const card = (
                    <InfoCard
                        key={item._id || item.id || index}
                        avatar={avatar}
                        title={title}
                        fields={fields}
                        stats={stats}
                        status={status}
                        onEdit={cardConfig.onEdit ? () => cardConfig.onEdit(item) : undefined}
                        onClick={onRowClick ? () => onRowClick(item) : undefined}
                        selected={isSelected}
                        canSelect={canSelect}
                        selectionMode={selectedIds.length > 0}
                        onSelect={() => onSelectRow?.(item._id || item.id || index)}
                    />
                );

                if (index === accumulatedData.length - 1) {
                    return <div ref={lastElementRef} key="last-item">{card}</div>;
                }
                return card;
            })}
            </>
            )}

            {isLoadingMore && (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0A437A]" />
                </div>
            )}
        </div>
    );
}
