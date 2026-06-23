import React from 'react';
import { Pencil } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';

export default function ComplaintsTable({
    complaints
}) {
    return (
        <div className="hidden md:block flex-1 overflow-auto bg-white rounded-xl border border-gray-100 shadow-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[#FAFBFD] shadow-sm">
                    <tr className="bg-[#FAFBFD] border-b border-gray-100 text-[#222222] text-sm font-semibold">
                        <th className="p-5 w-[15%] text-start">Organization</th>
                        <th className="p-5 w-[15%] text-start">Hostel</th>
                        <th className="p-5 w-[15%] text-start">warden</th>
                        <th className="p-5 w-[15%] text-center">Total Complaints</th>
                        <th className="p-5 w-[10%] text-center">Pending</th>
                        <th className="p-5 w-[15%] text-center">In progress</th>
                        <th className="p-5 w-[15%] text-center">Resolved</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                    {complaints.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="p-8 text-center text-gray-400">No complaints found</td>
                        </tr>
                    ) : (
                        complaints.map((complaint) => (
                            <tr key={complaint.id} className="hover:bg-gray-50/40 transition-colors">
                                <td className="p-5 text-start text-gray-500">{complaint.organization}</td>
                                <td className="p-5 text-start text-gray-500">{complaint.hostel}</td>
                                <td className="p-5 text-start text-gray-500">{complaint.warden}</td>
                                <td className="p-5 text-center text-gray-500">{complaint.total}</td>
                                <td className="p-5 text-center text-gray-500">{complaint.pending}</td>
                                <td className="p-5 text-center text-gray-500">{complaint.inProgress}</td>
                                <td className="p-5 text-center text-gray-500">{complaint.resolved}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
