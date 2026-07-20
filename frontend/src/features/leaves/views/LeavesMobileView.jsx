import React from 'react';
import MobileListContainer from '@/components/MobileUi/MobileListContainer';
import LeaveCard from '../components/cards/LeaveCard';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

export default function LeavesMobileView({
    requests,
    loading,
    hasMore,
    onLoadMore,
    searchQuery,
    setSearchQuery,
    onFilterClick,
    isFilterApplied,
    onAddClick,
    openEditModal,
    statsData
}) {
    const location = useLocation();
    const isHistoryTab = location.pathname.includes('/history');
    const { user } = useAuthStore();
    const isParent = user?.role === 'parent';

    // useLayoutConfig({
    //     header: isParent 
    //         ? { variant: 'dashboard' } 
    //         : { variant: 'page', title: 'Leaves', showBack: true },
    //     footer: {
    //         visible: isParent
    //     }
    // });

    const tabs = [
        { label: "Requests", path: `/dashboard/leaves/requests` },
        { label: "History", path: `/dashboard/leaves/history` }
    ];

    const stats = isHistoryTab
        ? [
            { label: "Total", value: statsData?.total || "0", valueColor: "text-primary" },
            { label: "Completed", value: (statsData?.completed < 10 && statsData?.completed > 0 ? "0" : "") + (statsData?.completed || "0"), valueColor: "text-success" },
            { label: "Rejected", value: (statsData?.rejected < 10 && statsData?.rejected > 0 ? "0" : "") + (statsData?.rejected || "0"), valueColor: "text-danger" }
        ]
        : [
            { label: "Total", value: statsData?.total || "0", valueColor: "text-primary" },
            { label: "Approved", value: (statsData?.approved < 10 && statsData?.approved > 0 ? "0" : "") + (statsData?.approved || "0"), valueColor: "text-green-600" },
            { label: "Pending", value: (statsData?.pending < 10 && statsData?.pending > 0 ? "0" : "") + (statsData?.pending || "0"), valueColor: "text-orange-400" }
        ];

    return (
        <div className="w-full h-full p-4 overflow-y-auto bg-background-secondary">
            <MobileListContainer
                tabs={tabs}
                stats={stats}
                showSearch={true}
                searchPlaceholder="Search leaves..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                onFilterClick={onFilterClick}
                isFilterApplied={isFilterApplied}
                onAddClick={onAddClick}
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
