import React from 'react';
import PageHeader from "@/components/ui/PageHeader";
import StudentAttendanceStatsCard from "../components/StudentAttendanceStatsCard";
import DataView from '@/components/ui/data-view/DataView';
import { Filter, Calendar, Clock } from 'lucide-react';
import { formatDateReadable, formatDay } from '@/utils/formatters';
import LeaveStatusBadge from '@/features/leaves/components/badges/LeaveStatusBadge';

const StudentAttendanceDesktopView = ({
    pageTitle,
    pageSubtitle,
    todayStats,
    history,
    loading,
    page,
    setPage,
    limit,
    setLimit,
    filters,
    pagination,
    setIsFilterModalOpen,
    setIsQRModalOpen
}) => {
    const columns = [
        {
            key: 'date',
            header: 'Date',
            accessor: (r) => formatDateReadable(r.date),
            icon: Calendar
        },
        {
            key: 'day',
            header: 'Day',
            accessor: (r) => formatDay(r.date),
            icon: Calendar
        },
        {
            key: 'time',
            header: 'Time',
            accessor: (r) => r.markedAt || '--',
            icon: Clock
        },
        {
            key: 'status',
            header: 'Status',
            renderCell: (r) => <LeaveStatusBadge status={r.status || 'pending'} />
        }
    ];

    const cardConfig = {
        title: (r) => formatDay(r.date),
        subtitle: (r) => formatDateReadable(r.date),
        status: (r) => ({
            text: r.status || 'pending',
            color: r.status === 'present' ? 'green' : r.status === 'absent' ? 'red' : 'gray'
        }),
        fields: [
            { icon: Clock, accessor: (r) => r.markedAt || '--' }
        ]
    };

    const toolbarEndSlot = (
        <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className={`p-2.5 rounded-xl transition-colors shadow-sm md:shadow-none flex items-center justify-center shrink-0 border ${Object.keys(filters).length > 0 ? 'bg-[#0A437A] text-white border-[#0A437A] hover:bg-[#0A437A]/90' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-10 w-10'}`}
        >
            <Filter className="w-4 h-4" />
        </button>
    );

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-text-primary flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="mb-6 shrink-0">
                    <PageHeader title={pageTitle} subtitle={pageSubtitle} />
                </div>

                <div className="mb-6 shrink-0">
                    <StudentAttendanceStatsCard
                        todayStatus={todayStats}
                        onGenerateQR={() => setIsQRModalOpen(true)}
                    />
                </div>

                <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col">
                    <DataView
                        pageScrollMode={true}
                        className="h-full border-none shadow-none bg-transparent"
                        toolbarEndSlot={toolbarEndSlot}
                        columns={columns}
                        cardConfig={cardConfig}
                        data={history}
                        loading={loading}
                        emptyText="No attendance records found."
                        page={page}
                        setPage={setPage}
                        limit={limit}
                        setLimit={setLimit}
                        totalPages={pagination?.totalPages || 1}
                        totalItems={pagination?.totalRecords || pagination?.totalItems || 0}
                    />
                </div>
            </div>
        </div>
    );
};

export default StudentAttendanceDesktopView;
