import React, { useEffect, useRef, useCallback, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Search, Filter, Plus } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import MobileStatsCard from './MobileStatsCard';
import MobileSkeletonLoader from '@/components/ui/MobileSkeletonLoader';

export default function MobileListContainer({
    // Tabs (Route-based)
    tabs = [], // [{ label: 'My Requests', path: '/leaves/my-requests' }, ...]

    // Stats (Optional)
    stats, // Array of stat objects

    // Search & Filter
    showSearch = false,
    searchPlaceholder = "Search...",
    searchValue = "",
    onSearchChange,
    onFilterClick, // If provided, shows the filter button
    isFilterApplied = false, // If true, highlights the filter button
    onAddClick, // If provided, shows a floating action button

    // List & Pagination
    data = [],
    renderItem,
    isLoading = false,
    hasMore = false,
    onLoadMore,
    emptyMessage = "No items found."
}) {
    const observer = useRef(null);
    const location = useLocation();

    // Debounce Logic
    const [localSearch, setLocalSearch] = useState(searchValue || "");
    const debouncedSearch = useDebounce(localSearch, 500);

    // Sync external override (e.g. parent clears search)
    useEffect(() => {
        if (searchValue !== debouncedSearch) {
            setLocalSearch(searchValue || "");
        }
    }, [searchValue]);

    // Emit debounced value back to parent
    useEffect(() => {
        if (onSearchChange && debouncedSearch !== searchValue) {
            onSearchChange(debouncedSearch);
        }
    }, [debouncedSearch]);

    // Infinite Scroll Intersection Observer
    const lastElementRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                if (onLoadMore) onLoadMore();
            }
        });

        if (node) observer.current.observe(node);
    }, [isLoading, hasMore, onLoadMore]);

    return (
        <div className="w-full flex flex-col gap-4">
            {/* Conditional Route-based Tabs */}
            {tabs && tabs.length > 0 && (
                <div className="bg-white rounded-xl p-1.5 flex shadow-sm border border-gray-50 shrink-0">
                    {tabs.map((tab) => {
                        // Check if current route matches tab path exactly or starts with it
                        const isActive = location.pathname === tab.path;
                        return (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                replace
                                className={`flex-1 text-center py-2.5 text-sm font-semibold rounded-lg transition-colors ${isActive
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-text-secondary hover:bg-gray-50'
                                    }`}
                                // Prevent default active class from NavLink to strictly use custom logic if needed
                                style={{ textDecoration: 'none' }}
                            >
                                {tab.label}
                            </NavLink>
                        );
                    })}
                </div>
            )}

            {/* Conditional Search and Filter */}
            {showSearch && (
                <div className="flex gap-3 shrink-0">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                        />
                    </div>
                    {onFilterClick && (
                        <button
                            onClick={onFilterClick}
                            className={`w-12 h-12 rounded-[14px] flex items-center justify-center shadow-sm active:scale-95 transition-all ${isFilterApplied
                                ? 'bg-primary border-primary text-white'
                                : 'bg-white border border-gray-100 text-gray-600'
                                }`}
                        >
                            <Filter className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}

            {/* Optional Stats Card */}
            {stats && stats.length > 0 && (
                <MobileStatsCard stats={stats} isLoading={isLoading && data.length === 0} />
            )}

            {/* List Content */}
            <div className="flex flex-col gap-4 pb-20">
                {data.map((item, index) => {
                    const isLast = index === data.length - 1;
                    return (
                        <div
                            key={item._id || item.id || index}
                            ref={isLast ? lastElementRef : null}
                        >
                            {renderItem(item, index)}
                        </div>
                    );
                })}


                {/* Loading Indicator */}
                {isLoading && (
                    <div className="py-2">
                        <MobileSkeletonLoader rows={data.length === 0 ? 5 : 1} />
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && data.length === 0 && (
                    <div className="bg-white rounded-[24px] p-8 text-center border border-gray-50 shadow-sm flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-6 h-6 text-text-secondary" />
                        </div>
                        <p className="text-text-secondary font-medium">{emptyMessage}</p>
                    </div>
                )}
            </div>
            {/* Floating Action Button */}
            {onAddClick && (
                <button
                    onClick={onAddClick}
                    className="fixed bottom-28 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(var(--primary-rgb),0.4)] active:scale-95 transition-transform z-50"
                >
                    <Plus className="w-6 h-6" strokeWidth={2.5} />
                </button>
            )}
        </div>
    );
}
