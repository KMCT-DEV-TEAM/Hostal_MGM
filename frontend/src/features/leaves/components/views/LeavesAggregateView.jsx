import React from 'react';
import DataTable from '@/components/ui/DataTable';
import InfoCard from '@/components/ui/InfoCard';

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
                <div className="mb-2">
                    <InfoCard
                        title={r.hostel || r.name}
                        stats={[
                            // { label: "Total", value: r.leaves || (r.pending + r.approved + r.rejected) || 0 },
                            { label: "Pending", value: r.pending || 0 },
                            { label: "Approved", value: r.approved || 0 },
                            { label: "Rejected", value: r.rejected || 0 }
                        ]}
                        onClick={() => onHostelClick(r._id || r.id)}
                    />
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
