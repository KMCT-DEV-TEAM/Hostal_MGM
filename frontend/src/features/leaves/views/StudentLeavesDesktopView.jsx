import React from 'react';
import { Filter, Pencil, Plus, Calendar, Clock } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import DataView from '@/components/ui/data-view/DataView';
import LeaveStatusBadge from '../components/badges/LeaveStatusBadge';
import LeaveReturnBadge from '../components/badges/LeaveReturnBadge';
import LeaveStatsCards from '../components/stats/LeaveStatsCards';
import { formatDateReadable, formatTime } from '@/utils/formatters';

export default function StudentLeavesDesktopView({
    pageTitle,
    pageSubtitle,
    isHomePass,
    statsData,
    requests,
    loading,
    totalItems,
    totalPages,
    page,
    setPage,
    filters,
    setIsFilterModalOpen,
    openEditModal,
    setViewId,
    searchQuery,
    setSearchQuery
}) {
    const limit = 10;

    const columns = isHomePass ? [
        {
            key: "leavePeriod",
            header: "Leave Period",
            accessor: (r) => `${formatDateReadable(r.fromDate)} - ${formatDateReadable(r.toDate)}`,
            renderCell: (r) => (
                <span className="font-medium text-text-secondary text-sm">
                    {formatDateReadable(r.fromDate)} - {formatDateReadable(r.toDate)}
                </span>
            )
        },
        {
            key: "days",
            header: "Days",
            accessor: (r) => r.totalDays ? `${r.totalDays} days` : '-----',
        },
        {
            key: "status",
            header: "Status",
            renderCell: (r) => <LeaveStatusBadge status={r.status} />
        },
        {
            key: "returnTracking",
            header: "Return",
            renderCell: (r) => <LeaveReturnBadge returnTracking={r.returnTracking} />
        },
        {
            key: "action",
            header: "Action",
            align: "center",
            renderCell: (r) => (
                <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                    {['pending_parent', 'pending_warden', 'approved'].includes(r.status) ? (
                        <button onClick={() => openEditModal(r)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit Request">
                            <Pencil className="w-4 h-4" />
                        </button>
                    ) : (
                        <span className="p-1.5 text-gray-300 cursor-not-allowed">
                            <Pencil className="w-4 h-4" />
                        </span>
                    )}
                </div>
            )
        }
    ] : [
        {
            key: "date",
            header: "Date",
            accessor: (r) => formatDateReadable(r.date),
            renderCell: (r) => (
                <span className="font-medium text-text-secondary text-sm">
                    {formatDateReadable(r.date)}
                </span>
            )
        },
        {
            key: "type",
            header: "Type",
            accessor: (r) => r.outPassCategory === 'in_house' ? 'In House' : (r.outPassCategory === 'out_house' ? 'Out House' : 'Out Pass')
        },
        {
            key: "inTime",
            header: "In",
            accessor: (r) => (r.expectedReturnTime || r.expectedReturnAt || r.returnTime) ? formatTime(r.expectedReturnTime || r.expectedReturnAt || r.returnTime) : '-----'
        },
        {
            key: "outTime",
            header: "Out",
            accessor: (r) => (r.outTime || r.fromDate) ? formatTime(r.outTime || r.fromDate) : '-----'
        },
        {
            key: "status",
            header: "Status",
            renderCell: (r) => <LeaveStatusBadge status={r.status} />
        },
        {
            key: "returnTracking",
            header: "Return",
            renderCell: (r) => <LeaveReturnBadge returnTracking={r.returnTracking} />
        },
        {
            key: "action",
            header: "Action",
            align: "center",
            renderCell: (r) => (
                <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                    {['pending_parent', 'pending_warden', 'approved'].includes(r.status) ? (
                        <button onClick={() => openEditModal(r)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit Request">
                            <Pencil className="w-4 h-4" />
                        </button>
                    ) : (
                        <span className="p-1.5 text-gray-300 cursor-not-allowed">
                            <Pencil className="w-4 h-4" />
                        </span>
                    )}
                </div>
            )
        }
    ];

    const cardConfig = {
        avatar: () => isHomePass ? "HP" : "OP",
        title: (r) => isHomePass ? 'Home Leave Application' : (r.outPassCategory === 'in_house' ? 'In House Permission' : 'Out House Permission'),
        subtitle: (r) => isHomePass
            ? (r.totalDays ? `${r.totalDays} Day${r.totalDays > 1 ? 's' : ''}` : '')
            : (r.expectedReturnTime && r.outTime ? `${r.outTime} - ${r.expectedReturnTime}` : ''),
        status: (r) => null, // LeaveStatusBadge will be rendered custom if needed, or we just rely on fields
        fields: isHomePass ? [
            { label: "Duration", accessor: (r) => `${formatDateReadable(r.fromDate)} - ${formatDateReadable(r.toDate)}`, icon: Calendar },
            { label: "Status", render: (r) => <LeaveStatusBadge status={r.status} /> }
        ] : [
            { label: "Date", accessor: (r) => formatDateReadable(r.date), icon: Calendar },
            { label: "Status", render: (r) => <LeaveStatusBadge status={r.status} /> }
        ],
        onEdit: (r) => ['pending_parent', 'pending_warden', 'approved'].includes(r.status) ? () => openEditModal(r) : undefined,
    };

    const addButton = (
        <button
            onClick={() => openEditModal(null)}
            className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-[#0A437A] text-white rounded-xl text-sm font-medium hover:bg-[#0A437A]/90 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
            <Plus className="w-4 h-4" />
            Apply <span className="hidden sm:inline">Leave</span>
        </button>
    );

    const toolbarEndSlot = (
        <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className={`flex items-center justify-center p-2 rounded-xl transition-colors shadow-sm border h-full ${Object.values(filters).some(Boolean) ? 'bg-[#0A437A] text-white border-[#0A437A] hover:bg-[#0A437A]/90' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
            <Filter className="w-4 h-4" />
        </button>
    );

    return (
        <div className="p-4 md:p-6 flex-1 flex flex-col relative">
            <div className="mb-6 shrink-0 hidden md:block">
                <PageHeader title={pageTitle} subtitle={pageSubtitle} />
            </div>

            <div className="hidden md:block">
                <LeaveStatsCards stats={statsData} isStudent />
            </div>

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col mt-4 md:mt-6">
                <DataView
                    addButton={addButton}
                    pageScrollMode={true}
                    data={requests}
                    columns={columns}
                    cardConfig={cardConfig}
                    loading={loading}
                    error={null}
                    searchQuery={searchQuery}
                    onSearchChange={(e) => setSearchQuery(e.target.value)}
                    searchPlaceholder="Search leaves..."
                    canSelect={false}
                    onRowClick={(item) => setViewId(item._id)}
                    toolbarEndSlot={toolbarEndSlot}
                    page={page}
                    setPage={setPage}
                    limit={limit}
                    setLimit={() => { }} // Read-only limit for now
                    totalItems={totalItems}
                    totalPages={totalPages}
                    emptyText="No leave records found matching your search."
                    className="h-full border-none shadow-none"
                />
            </div>
        </div>
    );
}
