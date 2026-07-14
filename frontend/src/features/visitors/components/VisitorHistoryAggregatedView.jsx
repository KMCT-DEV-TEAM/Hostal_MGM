import React from 'react';
import { Download } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';
import InfoCard from '@/components/ui/InfoCard';

const VisitorHistoryAggregatedView = ({ visitors, loading, searchQuery, onSearch, onHostelFilter, onRowClick }) => {

    const headers = [
        { key: 'hostel', label: 'Hostel' },
        { key: 'warden', label: 'Warden' },
        { key: 'totalVisitors', label: 'Total Visitors' },
        { key: 'inside', label: 'Inside' },
        { key: 'completed', label: 'Completed' }
    ];

    const renderRow = (visitor) => (
        <>
            <td className="p-4 font-bold text-gray-700 text-sm">{visitor.hostelName}</td>
            <td className="p-4 text-text-secondary font-medium">{visitor.wardenName || '--'}</td>
            <td className="p-4 text-text-secondary font-medium">{visitor.totalVisits || 0}</td>
            <td className="p-4 text-success font-medium">{visitor.inside || 0}</td>
            <td className="p-4 text-secondary font-medium">{visitor.completed || 0}</td>
        </>
    );

    const renderMobileItem = (visitor) => (
        <div className="">
            <InfoCard
                title={visitor.hostelName || '--'}
                subtitle={`Warden: ${visitor.wardenName || '--'}`}
                onClick={() => onRowClick && onRowClick({ id: visitor.hostelId, name: visitor.hostelName })}
                stats={[
                    { label: "Total", value: visitor.totalVisits || 0 },
                    { label: "Inside", value: <span className="text-success">{visitor.inside || 0}</span> },
                    { label: "Completed", value: <span className="text-secondary">{visitor.completed || 0}</span> }
                ]}
            />
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

export default VisitorHistoryAggregatedView;
