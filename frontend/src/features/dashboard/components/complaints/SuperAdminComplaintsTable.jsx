import React from 'react';

export default function SuperAdminComplaintsTable({
    complaints,
    onRowClick,
    showWarden = false
}) {
    return (
        <div className="hidden md:block h-full overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-start relative">
                <thead className="sticky top-0 z-10 bg-[#FAFBFD] shadow-sm">
                    <tr className="bg-[#FAFBFD] border-b border-gray-100 text-gray-400 text-xs tracking-wider uppercase font-semibold">
                        <th className="p-4 px-6 text-start normal-case text-sm font-semibold text-[#222222]">Organization</th>
                        <th className="p-4 px-6 text-start normal-case text-sm font-semibold text-[#222222]">Hostel</th>
                        {showWarden && <th className="p-4 px-6 text-start normal-case text-sm font-semibold text-[#222222]">Warden</th>}
                        <th className="p-4 px-6 text-center normal-case text-sm font-semibold text-[#222222]">Total Complaints</th>
                        <th className="p-4 px-6 text-center normal-case text-sm font-semibold text-[#222222]">Pending</th>
                        <th className="p-4 px-6 text-center normal-case text-sm font-semibold text-[#222222]">In progress</th>
                        <th className="p-4 px-6 text-center normal-case text-sm font-semibold text-[#222222]">Resolved</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                    {complaints.length === 0 ? (
                        <tr>
                            <td colSpan={showWarden ? "7" : "6"} className="p-8 text-center text-gray-400">No records found</td>
                        </tr>
                    ) : (
                        complaints.map((complaint, index) => (
                            <tr 
                                key={complaint.id} 
                                className="hover:bg-gray-50/40 transition-colors cursor-pointer"
                                onClick={() => onRowClick && onRowClick(complaint)}
                            >
                                <td className="p-4 px-6 text-start font-medium text-text-secondary">
                                    {complaint.organization}
                                </td>
                                <td className="p-4 px-6 text-start text-text-secondary">
                                    {complaint.hostel}
                                </td>
                                {showWarden && (
                                    <td className="p-4 px-6 text-start text-text-secondary">
                                        {complaint.warden}
                                    </td>
                                )}
                                <td className="p-4 px-6 text-center text-text-secondary">
                                    {complaint.totalComplaints}
                                </td>
                                <td className="p-4 px-6 text-center text-text-secondary">
                                    {complaint.pending}
                                </td>
                                <td className="p-4 px-6 text-center text-text-secondary">
                                    {complaint.inProgress}
                                </td>
                                <td className="p-4 px-6 text-center text-text-secondary">
                                    {complaint.resolved}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
