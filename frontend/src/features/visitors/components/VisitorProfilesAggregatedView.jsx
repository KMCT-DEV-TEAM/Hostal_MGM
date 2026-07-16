import React from 'react';
import DataView from '@/components/ui/data-view/DataView';

const VisitorProfilesAggregatedView = ({ visitors, loading, searchQuery, onSearch, onRowClick, limit, setLimit }) => {

    const columns = [
        {
            key: 'hostel',
            header: 'Hostel Name',
            type: 'user',
            titleAccessor: (item) => item.hostelName || '--',
            avatarAccessor: (item) => item.hostelName || 'H'
        },
        { key: 'hostelCode', header: 'Hostel Code', accessor: (item) => item.hostelCode || '--' },
        { key: 'totalVisitors', header: 'Total Visitors', accessor: (item) => item.totalVisitors || 0 },
        { key: 'approvedVisitors', header: 'Approved', renderCell: (item) => <span className="text-success font-medium">{item.approvedVisitors || 0}</span> },
        { key: 'pendingApprovals', header: 'Pending', renderCell: (item) => <span className="text-secondary font-medium">{item.pendingApprovals || 0}</span> }
    ];

    const cardConfig = {
        avatar: (item) => item.hostelName?.substring(0, 2) || 'H',
        title: (item) => item.hostelName || '--',
        subtitle: (item) => item.hostelCode || '--',
        stats: (item) => [
            { label: "Total", value: item.totalVisitors || 0 },
            { label: "Approved", value: <span className="text-success">{item.approvedVisitors || 0}</span> },
            { label: "Pending", value: <span className="text-secondary">{item.pendingApprovals || 0}</span> }
        ]
    };

    return (
        <DataView
            pageScrollMode={true}
            className="h-full border-none shadow-none bg-transparent"
            searchQuery={searchQuery}
            onSearchChange={(e) => onSearch(e.target.value)}
            columns={columns}
            cardConfig={cardConfig}
            data={visitors}
            loading={loading}
            emptyText="No visitors found"
            onRowClick={(item) => onRowClick && onRowClick({ id: item.hostelId, name: item.hostelName })}
            page={1}
            setPage={() => { }}
            limit={limit}
            setLimit={setLimit}
            totalItems={visitors?.length || 0}
            totalPages={Math.max(1, Math.ceil((visitors?.length || 0) / limit))}
        />
    );
};

export default VisitorProfilesAggregatedView;
