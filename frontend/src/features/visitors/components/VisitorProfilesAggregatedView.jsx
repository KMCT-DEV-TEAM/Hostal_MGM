import React from 'react';
import DataTable from '@/components/ui/DataTable';

const VisitorProfilesAggregatedView = ({ visitors, loading, searchQuery, onSearch, onRowClick }) => {

    const headers = [
        { key: 'hostel', label: 'Hostel Name' },
        { key: 'hostelCode', label: 'Hostel Code' },
        { key: 'totalVisitors', label: 'Total Visitors' },
        { key: 'approvedVisitors', label: 'Approved' },
        { key: 'pendingApprovals', label: 'Pending' }
    ];

    const renderRow = (visitor) => (
        <>
            <td className="p-4 font-bold text-gray-700 text-sm">{visitor.hostelName || '--'}</td>
            <td className="p-4 text-text-secondary font-medium">{visitor.hostelCode || '--'}</td>
            <td className="p-4 text-text-secondary font-medium">{visitor.totalVisitors || 0}</td>
            <td className="p-4 text-success font-medium">{visitor.approvedVisitors || 0}</td>
            <td className="p-4 text-secondary font-medium">{visitor.pendingApprovals || 0}</td>
        </>
    );

    const renderMobileItem = (visitor) => (
        <div className="flex flex-col gap-2 p-4">
            <div className="flex justify-between items-center">
                <span className="font-medium text-text-primary">{visitor.hostelName || '--'}</span>
                <span className="text-sm text-text-secondary">{visitor.hostelCode || '--'}</span>
            </div>
            <div className="flex gap-4 text-sm mt-1">
                <span className="text-gray-600">Total: {visitor.totalVisitors || 0}</span>
                <span className="text-success">Approved: {visitor.approvedVisitors || 0}</span>
                <span className="text-secondary">Pending: {visitor.pendingApprovals || 0}</span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col flex-1 h-full min-h-0 bg-white md:bg-transparent rounded-xl md:rounded-none">
            <DataTable
                searchQuery={searchQuery}
                headers={headers}
                items={visitors}
                loading={loading}
                emptyText="No visitors found"
                onSearchChange={(e) => onSearch(e.target.value)}
                renderRow={renderRow}
                renderMobileItem={renderMobileItem}
                onRowClick={(item) => onRowClick && onRowClick({ id: item.hostelId, name: item.hostelName })}
                page={1}
                setPage={() => { }}
                limit={10}
                totalItems={visitors?.length}
                totalPages={Math.max(1, Math.ceil(visitors?.length / 10))}
            />
        </div>
    );
};

export default VisitorProfilesAggregatedView;
