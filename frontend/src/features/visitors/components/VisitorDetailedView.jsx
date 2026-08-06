import React, { useState } from 'react';
import { Download, Filter, Calendar, Users, Building, DoorOpen, LogIn, LogOut } from 'lucide-react';
import DataView from '@/components/ui/data-view/DataView';
import Button from '@/components/ui/Button';
import FilterModal from './modals/FilterModal';
import VisitDetailsModal from './modals/VisitDetailsModal';
import { formatDateReadable, formatTime } from '@/utils/formatters';
import StatusBadge from '@/components/ui/StatusBadge';

const VisitorDetailedView = ({ visitors, loading, searchQuery, filters, onSearch, onFilter, onRefresh, canExport, onExportClick, userRole, limit, setLimit, onUpdateVisit }) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedVisitId, setSelectedVisitId] = useState(null);

    const columns = [
        {
            key: 'date',
            header: 'Date',
            accessor: (visitor) => formatDateReadable(visitor.checkInTime),
            icon: Calendar
        },
        {
            key: 'visitorName',
            header: 'Visitors Name',
            type: 'user',
            titleAccessor: (visitor) => visitor.visitorName || 'Unknown',
            avatarAccessor: (visitor) => visitor.visitorName ? visitor.visitorName.split(' ').map(n => n[0]).join('').toUpperCase() : 'V'
        },
        ...(userRole !== 'student' ? [{
            key: 'visitingStudent',
            header: 'Visiting Student',
            accessor: (visitor) => visitor.studentNames || '--',
            icon: Users
        }] : []),
        ...(['super_admin', 'admin', 'warden'].includes(userRole) ? [{
            key: 'roomNo',
            header: 'Room NO',
            accessor: (visitor) => visitor.roomNumber || visitor.roomNo || '--',
            icon: DoorOpen
        }] : []),
        ...(['warden', 'super_admin'].includes(userRole) ? [{
            key: 'organization',
            header: 'Organization',
            accessor: (visitor) => visitor.organizationName || '--',
            icon: Building
        }] : []),
        ...(['admin', 'parent'].includes(userRole) ? [{
            key: 'hostel',
            header: 'Hostel',
            accessor: (visitor) => visitor.hostelName || '--',
            icon: Building
        }] : []),
        {
            key: 'checkIn',
            header: 'Check In',
            accessor: (visitor) => formatTime(visitor.checkInTime),
            icon: LogIn
        },
        {
            key: 'checkOut',
            header: 'Check Out',
            accessor: (visitor) => visitor.checkOutTime ? formatTime(visitor.checkOutTime) : '--------',
            icon: LogOut
        },
        {
            key: 'status',
            header: 'Status',
            renderCell: (visitor) => <StatusBadge status={visitor.status} />
        }
    ];

    const cardConfig = {
        avatar: (visitor) => visitor.visitorName ? visitor.visitorName.split(' ').map(n => n[0]).join('').toUpperCase() : 'V',
        title: (visitor) => visitor.visitorName || 'Unknown',
        subtitle: (visitor) => formatDateReadable(visitor.checkInTime),
        status: (visitor) => ({ text: visitor.status || 'Unknown', color: "green" }),
        fields: [
            { icon: LogIn, label: "In", accessor: (visitor) => formatTime(visitor.checkInTime) },
            { icon: LogOut, label: "Out", accessor: (visitor) => visitor.checkOutTime ? formatTime(visitor.checkOutTime) : '---' },
            { icon: Users, label: "Visiting", accessor: (visitor) => `${visitor.visitingStudent || visitor.studentNames || '--'} (${visitor.roomNo || visitor.roomNumber || '--'})` }
        ],
        onClick: (visitor) => setSelectedVisitId(visitor.visitId || visitor._id || visitor.id)
    };

    const hasActiveFilters = filters && (filters.status || filters.fromDate || filters.toDate);

    const toolbarEndSlot = (
        <div className="flex items-center gap-2 relative shrink-0">

            {canExport && (
                <Button
                    variant="outline"
                    size="md"
                    fullWidth={false}
                    onClick={onExportClick}
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden ">Export</span>
                </Button>
            )}
            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                onFilter={onFilter}
            />
        </div>
    );


    const addButton = <Button
        variant={hasActiveFilters ? "primary" : "outline"}
        size="md"
        fullWidth={false}
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        className={`!p-2.5 h-10 w-10 flex items-center justify-center ${hasActiveFilters ? '' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
    >
        <Filter className="w-8 h-4" />
    </Button>
    return (
        <div className="flex flex-col flex-1 h-full min-h-0 bg-transparent rounded-none relative">
            <DataView
                pageScrollMode={true}
                className="h-full border-none shadow-none bg-transparent"
                searchQuery={searchQuery}
                onSearchChange={(e) => onSearch(e.target.value)}
                searchPlaceholder="Search visitors..."
                toolbarEndSlot={toolbarEndSlot}
                columns={columns}
                cardConfig={cardConfig}
                data={visitors}
                loading={loading}
                emptyText="No visitors found"
                onRowClick={(row) => setSelectedVisitId(row.visitId || row._id || row.id)}
                page={1}
                setPage={() => { }}
                addButton={addButton}
                limit={limit}
                setLimit={setLimit}
                totalItems={visitors?.length || 0}
                totalPages={Math.max(1, Math.ceil((visitors?.length || 0) / (limit || 10)))}
            />

            <VisitDetailsModal
                isOpen={!!selectedVisitId}
                onClose={() => setSelectedVisitId(null)}
                visitId={selectedVisitId}
                onUpdateVisit={onUpdateVisit}
            />
        </div>
    );
};

export default VisitorDetailedView;
