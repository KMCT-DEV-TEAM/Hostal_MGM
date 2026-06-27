import React from 'react';
import DataTable from '@/components/ui/DataTable';

export default function LeavesAggregateView({
    hostelData,
    loading,
    searchQuery,
    setSearchQuery,
    onHostelClick,
    page,
    setPage,
    pagination
}) {
    const tableHeaders = ["Hostel", "Total Request", "Pending", "Approved", "Rejected"];

    return (
        <DataTable
            searchQuery={searchQuery}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
            searchPlaceholder="Search hostels..."
            loading={loading}
            onRowClick={(r) => onHostelClick(r._id || r.id)}
            headers={tableHeaders}
            items={hostelData}
            canSelect={false}
            emptyText="No hostels found."
            renderRow={(r) => (
                <>
                    <td className="p-4 text-text-secondary font-medium">
                        {r.hostel || r.name}
                    </td>
                    <td className="p-4 text-text-secondary text-center sm:text-left">
                        {r.leaves || (r.pending + r.approved + r.rejected) || 0}
                    </td>
                    <td className="p-4 text-text-secondary text-center sm:text-left">
                        {r.pending || 0}
                    </td>
                    <td className="p-4 text-text-secondary text-center sm:text-left">
                        {r.approved || 0}
                    </td>
                    <td className="p-4 text-text-secondary text-center sm:text-left">
                        {r.rejected || 0}
                    </td>
                </>
            )}
            renderMobileItem={(r) => (
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-[#0A437A]">
                            {r.hostel || r.name}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50 text-xs text-text-secondary font-semibold">
                        <div>Total: {r.total || 0}</div>
                        <div>Pending: {r.pending || 0}</div>
                        <div>Approved: {r.approved || 0}</div>
                    </div>
                </div>
            )}
            page={page}
            setPage={setPage}
            limit={10}
            totalItems={pagination?.totalRecords || hostelData?.length || 0}
            totalPages={pagination?.totalPages || 1}
        />
    );
}
