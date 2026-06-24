import React from 'react';
import { Pencil } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';

export default function ComplaintsTable({
    complaints,
    handleCategoryChange,
    onRowClick,
    onHostelClick
}) {
    return (
        <div className="hidden md:block h-full overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-start relative">
                <thead className="sticky top-0 z-10 bg-[#F8FAFC] shadow-sm">
                    <tr className="text-[#222222] text-center text-sm font-semibold border-b border-gray-50">
                        <th className="p-4 w-[20%] text-start">Student</th>
                        <th className="p-4 w-[15%] text-start">Hostel</th>
                        <th className="p-4 w-[15%] text-start">Category</th>
                        <th className="p-4 w-[15%] text-start">Priority</th>
                        <th className="p-4 w-[10%] text-start">Date</th>
                        <th className="p-4 w-[10%] text-start">Due</th>
                        <th className="p-4 w-[15%] text-start">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                    {complaints.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="p-8 text-center text-[#777777]">No records found</td>
                        </tr>
                    ) : (
                        complaints.map((complaint) => (
                            <tr key={complaint.id} className="hover:bg-gray-50/40 transition-colors group">
                                <td className="p-4 text-start font-medium text-[#777777]">
                                    <div
                                        className="flex items-center gap-3 cursor-pointer hover:text-[#0A437A] transition-colors"
                                        onClick={() => onRowClick && onRowClick(complaint)}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                            {complaint.student.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                        </div>
                                        <span className="font-medium">{complaint.student}</span>
                                    </div>
                                </td>
                                <td
                                    className="p-4 text-start text-text-secondary cursor-pointer hover:text-primary font-medium transition-colors"
                                    onClick={() => onHostelClick && onHostelClick(complaint.hostel)}
                                >
                                    {complaint.hostel}
                                </td>
                                <td className="p-4 text-start">
                                    <div className="relative w-full max-w-[140px]">
                                        <Dropdown
                                            minWidth=""
                                            options={[
                                                { value: "Mess", label: "Mess" },
                                                { value: "Wifi", label: "Wifi" },
                                                { value: "Maintenance", label: "Maintenance" },
                                                { value: "Other", label: "Other" }
                                            ]}
                                            value={complaint.category}
                                            onChange={(val) => handleCategoryChange(complaint.id, val)}
                                            triggerClassName="px-3 py-1.5 text-xs font-regular text-start rounded-lg bg-white border border-gray-200 text-[#777777] hover:border-gray-300 transition-colors cursor-pointer flex justify-between items-center w-full"
                                        />
                                    </div>
                                </td>
                                <td className="p-4 text-start">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${complaint.priority === 'High' ? 'bg-danger' : complaint.priority === 'Medium' ? 'bg-warning' : 'bg-gray-400'}`}></span>
                                        <span className="text-[#777777]">{complaint.priority}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-start text-[#777777]">{complaint.date}</td>
                                <td className="p-4 text-start text-[#777777]">{complaint.due}</td>
                                <td className="p-4 text-start">
                                    <span className={`px-3 py-1.5 text-xs font-medium rounded-md ${complaint.status === 'Pending' ? 'bg-warning/10 text-warning' : complaint.status === 'Resolved' ? 'bg-success/10 text-success' : 'bg-blue-50/80 text-secondary'}`}>
                                        {complaint.status}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
