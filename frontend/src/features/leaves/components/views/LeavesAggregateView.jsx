import React from 'react';
import DataView from '@/components/ui/data-view/DataView';

export default function LeavesAggregateView({
    hostelData,
    loading,
    searchQuery,
    setSearchQuery,
    onHostelClick,
    page,
    setPage,
    pagination
}) {
    const columns = [
        {
            key: "hostel",
            header: "Hostel",
            type: "user",
            titleAccessor: (item) => item.hostel || item.name,
            avatarAccessor: (item) => item.hostel || item.name,
        },
        {
            key: "total",
            header: "Total Request",
            accessor: (item) => item.leaves || ((item.pending || 0) + (item.approved || 0) + (item.rejected || 0)) || 0,
        },
        {
            key: "pending",
            header: "Pending",
            accessor: (item) => item.pending || 0,
        },
        {
            key: "approved",
            header: "Approved",
            accessor: (item) => item.approved || 0,
        },
        {
            key: "rejected",
            header: "Rejected",
            accessor: (item) => item.rejected || 0,
        }
    ];

    const cardConfig = {
        avatar: (item) => (item.hostel || item.name)?.substring(0, 2).toUpperCase() || 'HO',
        title: (item) => item.hostel || item.name,
        stats: (item) => [
            { label: "Total", value: item.leaves || ((item.pending || 0) + (item.approved || 0) + (item.rejected || 0)) || 0 },
            { label: "Pending", value: item.pending || 0 },
            { label: "Approved", value: item.approved || 0 },
            { label: "Rejected", value: item.rejected || 0 }
        ]
    };

    return (
        <DataView
            pageScrollMode={true}
            className="h-full border-none shadow-none"
            data={hostelData}
            columns={columns}
            cardConfig={cardConfig}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
            searchPlaceholder="Search hostels..."
            onRowClick={(item) => onHostelClick(item._id || item.id)}
            page={page}
            setPage={setPage}
            limit={10}
            totalItems={pagination?.totalRecords || hostelData?.length || 0}
            totalPages={pagination?.totalPages || 1}
            emptyText="No hostels found."
        />
    );
}
