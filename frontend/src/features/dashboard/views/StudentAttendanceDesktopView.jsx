import React from 'react';
import PageHeader from "@/components/ui/PageHeader";
import StudentAttendanceStatsCard from "../components/StudentAttendanceStatsCard";
import DataTable from "@/components/ui/DataTable";
import { Filter } from 'lucide-react';
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
    filters,
    pagination,
    setIsFilterModalOpen,
    setIsQRModalOpen
}) => {
    const tableHeaders = ["Date", "Day", "Time", "Status"];

    return (
        <div className="w-full h-full overflow-y-auto md:overflow-hidden p-4 md:p-6 flex flex-col bg-background-secondary">
            <div className="mb-6 shrink-0">
                <PageHeader title={pageTitle} subtitle={pageSubtitle} />
            </div>

            <div className="mb-6 shrink-0">
                <StudentAttendanceStatsCard
                    todayStatus={todayStats}
                    onGenerateQR={() => setIsQRModalOpen(true)}
                />
            </div>

            <DataTable
                headers={tableHeaders}
                items={history}
                loading={loading}
                canSelect={false}
                emptyText="No attendance records found."
                renderRow={(r) => (
                    <>
                        <td className="p-4 text-text-secondary text-sm font-medium">
                            {formatDateReadable(r.date)}
                        </td>
                        <td className="p-4 text-text-secondary text-sm">
                            {formatDay(r.date)}
                        </td>
                        <td className="p-4 text-text-secondary text-sm">
                            {r.markedAt}
                        </td>
                        <td className="p-4">
                            <LeaveStatusBadge status={r.status || 'pending'} />
                        </td>
                    </>
                )}
                page={page}
                setPage={setPage}
                limit={10}
                totalItems={pagination.totalRecords}
                totalPages={pagination.totalPages || 1}
            >
                {/* Custom Toolbar Actions */}
                <button
                    type="button"
                    onClick={() => setIsFilterModalOpen(true)}
                    className={`p-2.5 rounded-xl transition-colors shadow-sm md:shadow-none flex items-center justify-center shrink-0 ${Object.keys(filters).length > 0 ? 'bg-[#0A437A] text-white border-[#0A437A] hover:bg-[#0A437A]/90' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-10 w-10'}`}
                >
                    <Filter className="w-4 h-4" />
                </button>
            </DataTable>
        </div>
    );
};

export default StudentAttendanceDesktopView;
