import React from 'react';
import DataView from '@/components/ui/data-view/DataView';

const VisitorHistoryAggregatedView = ({ visitors, loading, searchQuery, onSearch, onHostelFilter, onRowClick, limit, setLimit }) => {

    const columns = [
        { 
            key: 'hostel', 
            header: 'Hostel', 
            type: 'user', 
            titleAccessor: (visitor) => visitor.hostelName || '--',
            avatarAccessor: (visitor) => visitor.hostelName || 'H'
        },
        { key: 'warden', header: 'Warden', accessor: (visitor) => visitor.wardenName || '--' },
        { key: 'totalVisitors', header: 'Total Visitors', accessor: (visitor) => visitor.totalVisits || 0 },
        { key: 'inside', header: 'Inside', renderCell: (visitor) => <span className="text-success font-medium">{visitor.inside || 0}</span> },
        { key: 'completed', header: 'Completed', renderCell: (visitor) => <span className="text-secondary font-medium">{visitor.completed || 0}</span> }
    ];

    const cardConfig = {
        avatar: (visitor) => visitor.hostelName?.substring(0, 2) || 'H',
        title: (visitor) => visitor.hostelName || '--',
        subtitle: (visitor) => `Warden: ${visitor.wardenName || '--'}`,
        stats: (visitor) => [
            { label: "Total", value: visitor.totalVisits || 0 },
            { label: "Inside", value: <span className="text-success">{visitor.inside || 0}</span> },
            { label: "Completed", value: <span className="text-secondary">{visitor.completed || 0}</span> }
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
            totalPages={Math.max(1, Math.ceil((visitors?.length || 0) / (limit || 10)))}
        />
    );
};

export default VisitorHistoryAggregatedView;
