import React from 'react';
import { Filter, Pencil } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import LeaveStatusBadge from '../components/badges/LeaveStatusBadge';
import LeaveReturnBadge from '../components/badges/LeaveReturnBadge';
import LeaveStatsCards from '../components/stats/LeaveStatsCards';
import { formatDateReadable } from '@/utils/formatters';

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
    setViewId
}) {
    const limit = 10;
    
    const tableHeaders = isHomePass
        ? ["Leave Period", "Days", "Status", "Return", "Action"]
        : ["Date", "Type", "In", "Out", "Status", "Return", "Action"];

    return (
        <div className="w-full h-full overflow-hidden p-6 flex flex-col bg-background-secondary">
            <div className="mb-6 shrink-0">
                <PageHeader title={pageTitle} subtitle={pageSubtitle} />
            </div>

            <LeaveStatsCards stats={statsData} isStudent />

            <DataTable
                onAdd={() => openEditModal(null)}
                addText="Apply"
                headers={tableHeaders}
                items={requests}
                loading={loading}
                canSelect={false}
                emptyText="No leave records found."
                onRowClick={(item) => setViewId(item._id)}
                renderRow={(r) => (
                    <>
                        {isHomePass ? (
                            <>
                                <td className="p-4 text-text-secondary text-sm font-medium">
                                    {formatDateReadable(r.fromDate)} - {formatDateReadable(r.toDate)}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.totalDays ? `${r.totalDays} days` : '-----'}
                                </td>
                            </>
                        ) : (
                            <>
                                <td className="p-4 text-text-secondary text-sm font-medium">
                                    {formatDateReadable(r.date)}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.outPassCategory === 'in_house' ? 'In House' : (r.outPassCategory === 'out_house' ? 'Out House' : 'Out Pass')}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.expectedReturnTime || '-----'}
                                </td>
                                <td className="p-4 text-text-secondary text-sm">
                                    {r.outTime || '-----'}
                                </td>
                            </>
                        )}
                        <td className="p-4">
                            <LeaveStatusBadge status={r.status} />
                        </td>
                        <td className="p-4">
                            <LeaveReturnBadge returnTracking={r.returnTracking} />
                        </td>
                        <td className="p-4">
                            {['pending_parent', 'pending_warden', 'approved'].includes(r.status) ? (
                                <button onClick={(e) => { e.stopPropagation(); openEditModal(r); }} className="text-accent hover:text-primary transition-colors cursor-pointer relative z-10">
                                    <Pencil className="w-4 h-4" />
                                </button>
                            ) : (
                                <span className="text-gray-300 cursor-not-allowed">
                                    <Pencil className="w-4 h-4" />
                                </span>
                            )}
                        </td>
                    </>
                )}
                page={page}
                setPage={setPage}
                limit={limit}
                totalItems={totalItems}
                totalPages={totalPages || 1}
            >
                {/* Custom Toolbar Actions */}
                <button
                    type="button"
                    onClick={() => setIsFilterModalOpen(true)}
                    className={`p-2.5 border rounded-xl transition-colors shadow-sm md:shadow-none flex items-center justify-center ${Object.values(filters).some(Boolean) ? 'bg-[#0A437A] text-white border-[#0A437A] hover:bg-[#0A437A]/90' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-10 w-10'}`}
                >
                    <Filter className="w-4 h-4" />
                </button>
            </DataTable>
        </div>
    );
}
