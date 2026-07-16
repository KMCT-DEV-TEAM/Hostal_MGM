import React from 'react';
import MobileListContainer from '@/components/MobileUi/MobileListContainer';
import LeaveCard from '../components/cards/LeaveCard';
import { useLocation } from 'react-router-dom';

export default function StudentLeavesMobileView({
    requests,
    loading,
    hasMore,
    onLoadMore,
    searchQuery,
    setSearchQuery,
    onFilterClick,
    openEditModal
}) {
    const location = useLocation();

    const tabs = [
        { label: "Requests", path: `/dashboard/leaves/requests` },
        { label: "History", path: `/dashboard/leaves/history` }
    ];

    return (
        <div className="w-full h-full p-4 overflow-y-auto bg-background-secondary">
            <MobileListContainer
                tabs={tabs}
                showSearch={true}
                searchPlaceholder="Search leaves..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                onFilterClick={onFilterClick}
                data={requests}
                isLoading={loading}
                hasMore={hasMore}
                onLoadMore={onLoadMore}
                emptyMessage="No leave requests found."
                renderItem={(item) => (
                    <LeaveCard
                        data={item}
                        onEdit={openEditModal}
                    />
                )}
            />
        </div>
    );
}
