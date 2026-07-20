import React from 'react';
import MobileListContainer from '@/components/MobileUi/MobileListContainer';
import VisitorCard from '../components/cards/VisitorCard';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

export default function VisitorsMobileView({
    visitors,
    loading,
    hasMore,
    onLoadMore,
    searchQuery,
    setSearchQuery,
    onFilterClick,
    isFilterApplied,
    onAddClick,
    onEdit,
}) {
    const location = useLocation();
    const isHistoryTab = location.pathname.includes('/history');
    const { user } = useAuthStore();
    const isParent = user?.role === 'parent';

    // Set mobile layout configuration dynamically based on role
    useLayoutConfig({
        header: isParent 
            ? { variant: 'dashboard' } 
            : { variant: 'page', title: 'Visitors', showBack: true },
        footer: {
            visible: isParent
        }
    });

    const tabs = [
        { label: "Visitors", path: `/dashboard/visitors` },
        { label: "History", path: `/dashboard/visitors/history` }
    ];

    return (
        <div className="w-full h-full p-4 overflow-y-auto bg-background-secondary">
            <MobileListContainer
                tabs={tabs}
                showSearch={true}
                searchPlaceholder="Search visitors..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                onFilterClick={onFilterClick}
                isFilterApplied={isFilterApplied}
                onAddClick={onAddClick}
                data={visitors}
                isLoading={loading}
                hasMore={hasMore}
                onLoadMore={onLoadMore}
                emptyMessage="No visitors found."
                renderItem={(item) => (
                    <VisitorCard
                        key={item._id || item.id || Math.random()}
                        data={item}
                        onEdit={onEdit}
                        isHistory={isHistoryTab}
                    />
                )}
            />
        </div>
    );
}
