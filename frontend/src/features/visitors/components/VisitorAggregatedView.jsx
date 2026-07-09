import React from 'react';
import { Download } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';

const VisitorAggregatedView = ({ visitors, loading, searchQuery, onSearch, onHostelFilter, onRowClick, canExport, onExportClick }) => {

    const headers = [
        { key: 'date', label: 'Date' },
        { key: 'hostel', label: 'Hostel' },
        { key: 'warden', label: 'Warden' },
        { key: 'totalVisitors', label: 'Total Visitors' },
        { key: 'inside', label: 'Inside' },
        { key: 'completed', label: 'Completed' }
    ];

    const renderRow = (visitor) => (
        <>
            <td className="p-4 text-text-secondary font-medium">{visitor.date}</td>
            <td className="p-4 font-bold text-gray-700 text-sm">{visitor.hostel}</td>
            <td className="p-4 text-text-secondary font-medium">{visitor.warden}</td>
            <td className="p-4 text-text-secondary font-medium">{visitor.totalVisitors}</td>
            <td className="p-4 text-success font-medium">{visitor.inside}</td>
            <td className="p-4 text-secondary font-medium">{visitor.completed}</td>
        </>
    );

    const renderMobileItem = (visitor) => (
        <div className="flex flex-col gap-2 p-4">
            <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{visitor.hostel}</span>
                <span className="text-sm text-gray-500">{visitor.date}</span>
            </div>
            <div className="text-sm text-gray-600">Warden: {visitor.warden}</div>
            <div className="flex gap-4 text-sm mt-1">
                <span className="text-gray-600">Total: {visitor.totalVisitors}</span>
                <span className="text-green-600">Inside: {visitor.inside}</span>
                <span className="text-blue-600">Completed: {visitor.completed}</span>
            </div>
        </div>
    );

    const toolbarActions = (
        <div className="flex items-center gap-2">
            <Dropdown
                options={[
                    { value: '', label: 'All' },
                    { value: 'Hostel A', label: 'Hostel A' },
                    { value: 'Hostel B', label: 'Hostel B' }
                ]}
                onChange={(val) => onHostelFilter(val)}
                placeholder="All Hostels"
                triggerClassName="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none min-w-[120px]"
            />

            {canExport && (
                <Button variant="outline" size="sm" fullWidth={false} className="hidden sm:flex" onClick={onExportClick}>
                    <Download className="w-4 h-4" /> Export
                </Button>
            )}
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
                toolbarActions={toolbarActions}
                renderRow={renderRow}
                renderMobileItem={renderMobileItem}
                onRowClick={(item) => onRowClick && onRowClick(item.hostel)}
                page={1}
                setPage={() => { }}
                limit={10}
                totalItems={visitors?.length}
                totalPages={Math.max(1, Math.ceil(visitors?.length / 10))}
            />
        </div>
    );
};

export default VisitorAggregatedView;
