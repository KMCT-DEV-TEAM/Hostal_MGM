import React, { useState } from 'react';
import { Download, Filter } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import FilterModal from './modals/FilterModal';
import VisitDetailsModal from './modals/VisitDetailsModal';
import { formatDateReadable, formatTime } from '@/utils/formatters';
import StatusBadge from '@/components/ui/StatusBadge';
import InfoCard from '@/components/ui/InfoCard';
const VisitorDetailedView = ({ visitors, loading, searchQuery, filters, onSearch, onFilter, onRefresh, canExport, onExportClick, userRole }) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedVisitId, setSelectedVisitId] = useState(null);

    const headers = React.useMemo(() => {
        const baseCols = [
            { key: 'date', label: 'Date' },
            { key: 'visitorName', label: 'Visitors Name' }
        ];

        if (userRole !== 'student') {
            baseCols.push({ key: 'visitingStudent', label: 'Visiting Student' });
        }

        if (['super_admin', 'admin', 'warden'].includes(userRole)) {
            baseCols.push({ key: 'roomNo', label: 'Room NO' });
        }

        if (['warden', 'super_admin'].includes(userRole)) {
            baseCols.push({ key: 'organization', label: 'Organization' });
        } else if (['admin', 'parent'].includes(userRole)) {
            baseCols.push({ key: 'hostel', label: 'Hostel' });
        }

        baseCols.push(
            { key: 'checkIn', label: 'Check In' },
            { key: 'checkOut', label: 'Check Out' },
            { key: 'status', label: 'Status' }
        );

        return baseCols;
    }, [userRole]);

    const renderRow = (visitor) => (
        <>
            <td className="p-4 text-text-secondary font-medium">{formatDateReadable(visitor.checkInTime)}</td>
            <td className="p-4 flex items-center gap-3 text-gray-700">
                <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                    {(visitor.visitorName || 'U').charAt(0)}
                </div>
                <span className="text-sm font-semibold">{visitor.visitorName || 'Unknown'}</span>
            </td>

            {userRole !== 'student' && (
                <td className="p-4 text-text-secondary font-medium">{visitor.studentNames || '--'}</td>
            )}

            {['super_admin', 'admin', 'warden'].includes(userRole) && (
                <td className="p-4 text-text-secondary font-medium">{visitor.roomNumber || visitor.roomNo || '--'}</td>
            )}

            {['warden', 'super_admin'].includes(userRole) && (
                <td className="p-4 text-text-secondary font-medium">{visitor.organizationName || '--'}</td>
            )}
            {['admin', 'parent'].includes(userRole) && (
                <td className="p-4 text-text-secondary font-medium">{visitor.hostelName || '--'}</td>
            )}

            <td className="p-4 text-text-secondary font-medium">{formatTime(visitor.checkInTime)}</td>
            <td className="p-4 text-text-secondary font-medium">{visitor.checkOutTime ? formatTime(visitor.checkOutTime) : '--------'}</td>
            <td className="p-4">
                <StatusBadge status={visitor.status} />
            </td>
        </>
    );


    const hasActiveFilters = filters && (filters.status || filters.fromDate || filters.toDate);



    return (
        <div className="flex flex-col flex-1 h-full min-h-0 bg-white md:bg-transparent rounded-xl md:rounded-none relative">
            <DataTable
                searchQuery={searchQuery}
                headers={headers}
                items={visitors}
                loading={loading}
                emptyText="No visitors found"
                onSearchChange={(e) => onSearch(e.target.value)}
                onExport={canExport ? onExportClick : undefined}
                renderRow={renderRow}
                renderMobileItem={(visitor) => {
                    const visitorName = visitor.visitorName || visitor.name || 'Unknown';
                    return (
                        <div className="mb-2">
                            <InfoCard
                                avatar={visitorName}
                                title={visitorName}
                                onClick={() => { setSelectedVisitId(visitor.visitId || visitor._id || visitor.id) }}
                                subtitle={formatDateReadable(visitor.checkInTime)}
                                status={{ text: visitor.status, color: "green" }}
                                fields={[
                                    { label: "In", value: formatTime(visitor.checkInTime) },
                                    { label: "Out", value: visitor.checkOutTime ? formatTime(visitor.checkOutTime) : '---' },
                                    { label: "Visiting", value: `${visitor.visitingStudent || visitor.studentNames || '--'} (${visitor.roomNo || visitor.roomNumber || '--'})` },
                                ]}
                            />
                        </div>
                    );
                }}
                onRowClick={(row) => setSelectedVisitId(row.visitId || row._id || row.id)}
                page={1}
                setPage={() => { }}
                limit={10}
                totalItems={visitors?.length}
                totalPages={Math.max(1, Math.ceil(visitors?.length / 10))}
            >
                {/* Custom Toolbar Actions */}
                <div className="flex items-center gap-2 relative shrink-0">
                    <Button
                        variant={hasActiveFilters ? "primary" : "outline"}
                        size="md"
                        fullWidth={false}
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="!p-2.5 shadow-sm md:shadow-none bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 h-10 w-10 flex items-center justify-center"
                    >
                        <Filter className="w-4 h-4" />
                    </Button>

                    <FilterModal
                        isOpen={isFilterOpen}
                        onClose={() => setIsFilterOpen(false)}
                        filters={filters}
                        onFilter={onFilter}
                    />
                </div>
            </DataTable>

            <VisitDetailsModal
                isOpen={!!selectedVisitId}
                onClose={() => setSelectedVisitId(null)}
                visitId={selectedVisitId}
            />
        </div>
    );
};

export default VisitorDetailedView;
