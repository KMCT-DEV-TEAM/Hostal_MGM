import React from 'react';
import MobileListContainer from '@/components/MobileUi/MobileListContainer';
import VisitorCard from '../components/cards/VisitorCard';
import { useLocation } from 'react-router-dom';

export default function VisitorsMobileView({
    visitors,
    loading,
    hasMore,
    onLoadMore,
    searchQuery,
    setSearchQuery,
    onAddClick,
    onEdit,
}) {
    const location = useLocation();

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
                    />
                )}
            />
        </div>
    );
}
