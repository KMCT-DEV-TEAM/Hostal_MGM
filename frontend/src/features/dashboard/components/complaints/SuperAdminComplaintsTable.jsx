import React from 'react';

export default function SuperAdminComplaintsTable({
    complaints,
    onRowClick
}) {
    return (
        <div className="hidden md:block h-full overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-start relative">
                <thead className="sticky top-0 z-10 bg-[#FAFAFA]">
                    <tr className="text-[#333333] text-sm font-semibold border-b border-gray-100">
                        <th className="p-4 px-6 text-start font-semibold">Organization</th>
                        <th className="p-4 px-6 text-start font-semibold">Hostel</th>
                        <th className="p-4 px-6 text-start font-semibold">warden</th>
                        <th className="p-4 px-6 text-center font-semibold">Total Complaints</th>
                        <th className="p-4 px-6 text-center font-semibold">Pending</th>
                        <th className="p-4 px-6 text-center font-semibold">In progress</th>
                        <th className="p-4 px-6 text-center font-semibold">Resolved</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {complaints.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="p-8 text-center text-[#777777]">No records found</td>
                        </tr>
                    ) : (
                        complaints.map((complaint, index) => (
                            <tr 
                                key={complaint.id} 
                                className={`transition-colors cursor-pointer hover:bg-gray-100/50 ${index % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}
                                onClick={() => onRowClick && onRowClick(complaint)}
                            >
                                <td className="p-4 px-6 text-start font-medium text-[#777777]">
                                    {complaint.organization}
                                </td>
                                <td className="p-4 px-6 text-start text-[#777777]">
                                    {complaint.hostel}
                                </td>
                                <td className="p-4 px-6 text-start text-[#777777]">
                                    {complaint.warden}
                                </td>
                                <td className="p-4 px-6 text-center text-[#777777]">
                                    {complaint.totalComplaints}
                                </td>
                                <td className="p-4 px-6 text-center text-[#777777]">
                                    {complaint.pending}
                                </td>
                                <td className="p-4 px-6 text-center text-[#777777]">
                                    {complaint.inProgress}
                                </td>
                                <td className="p-4 px-6 text-center text-[#777777]">
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
