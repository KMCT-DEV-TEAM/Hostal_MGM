import React from 'react';
import Dropdown from '@/components/ui/Dropdown';

export default function WardenComplaintsTable({
    complaints,
    handleCategoryChange,
    onViewClick
}) {
    return (
        <div className="hidden md:block flex-1 overflow-auto bg-white rounded-xl shadow-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[#FAFBFD] shadow-sm border-b border-gray-100">
                    <tr className="text-text-primary text-sm font-semibold">
                        <th className="p-5 w-[5%] text-center">#</th>
                        <th className="p-5 w-[20%] text-start">Student</th>
                        <th className="p-5 w-[15%] text-start">Room No</th>
                        <th className="p-5 w-[15%] text-start">Category</th>
                        <th className="p-5 w-[20%] text-start">Subject</th>
                        <th className="p-5 w-[10%] text-start">Date</th>
                        <th className="p-5 w-[10%] text-start">Priority</th>
                        <th className="p-5 w-[15%] text-start">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                    {complaints.length === 0 ? (
                        <tr>
                            <td colSpan="8" className="p-8 text-center text-text-secondary">No complaints found</td>
                        </tr>
                    ) : (
                        complaints.map((complaint, index) => (
                            <tr 
                                key={complaint.id} 
                                onClick={() => onViewClick && onViewClick(complaint)}
                                className="hover:bg-gray-50/40 transition-colors cursor-pointer"
                            >
                                <td className="p-5 text-center text-text-secondary font-medium">{index + 1}</td>
                                <td className="p-5 text-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                            {complaint.student.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <span className="text-text-secondary font-medium">{complaint.student}</span>
                                    </div>
                                </td>
                                <td className="p-5 text-start text-text-secondary font-medium">
                                    {complaint.roomNo}
                                </td>
                                <td className="p-5 text-start" onClick={e => e.stopPropagation()}>
                                    <div className="relative w-full max-w-[140px]">
                                        <Dropdown
                                            minWidth=""
                                            options={[
                                                { value: "Mess", label: "Mess" },
                                                { value: "Maintenance", label: "Maintenance" },
                                                { value: "Other", label: "Other" }
                                            ]}
                                            value={complaint.category}
                                            onChange={(val) => handleCategoryChange(complaint.id, val)}
                                            triggerClassName="px-3 py-1.5 text-xs font-regular text-start rounded-lg bg-white border border-gray-200 text-text-primary hover:border-gray-300 transition-colors cursor-pointer"
                                        />
                                    </div>
                                </td>
                                <td className="p-5 text-start text-text-secondary">
                                    {complaint.subject}
                                </td>
                                <td className="p-5 text-start text-text-secondary">
                                    {complaint.date}
                                </td>
                                <td className="p-5 text-start">
                                    <span className={`px-3 py-1.5 text-xs font-medium rounded-md ${complaint.priority === 'High' ? 'bg-danger/10 text-danger' : complaint.priority === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-gray-100 text-text-secondary'}`}>
                                        {complaint.priority || 'Low'}
                                    </span>
                                </td>
                                <td className="p-5 text-start">
                                    <span className={`px-3 py-1.5 text-xs font-medium rounded-md ${complaint.status === 'Pending' ? 'bg-warning/10 text-warning' : complaint.status === 'Resolved' ? 'bg-success/10 text-success' : 'bg-accent/10 text-blue-500'}`}>
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
