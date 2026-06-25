import React from 'react';
import Dropdown from '@/components/ui/Dropdown';
import TableSkeletonLoader from '@/components/ui/TableSkeletonLoader';

export default function WardenComplaintsTable({
    loading,
    complaints,
    categories = [],
    handleCategoryChange,
    handlePriorityChange,
    onViewClick
}) {
    const categoryOptions = categories.map(cat => ({
        value: cat._id,
        label: cat.name
    }));

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
                    {loading ? (
                        <TableSkeletonLoader columns={8} />
                    ) : complaints.length === 0 ? (
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
                                <td className="p-5 text-start">
                                    <div className="inline-block px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg border border-gray-200">
                                        {complaint.category}
                                    </div>
                                </td>
                                <td className="p-5 text-start text-text-secondary">
                                    {complaint.subject}
                                </td>
                                <td className="p-5 text-start text-text-secondary">
                                    {complaint.date}
                                </td>
                                <td className="p-5 text-start" onClick={e => e.stopPropagation()}>
                                    <div className="relative w-full max-w-[120px]">
                                        <Dropdown
                                            minWidth=""
                                            options={[
                                                { value: "High", label: "High" },
                                                { value: "Medium", label: "Medium" },
                                                { value: "Low", label: "Low" }
                                            ]}
                                            value={complaint.priority || 'Medium'}
                                            onChange={(val) => handlePriorityChange && handlePriorityChange(complaint.id, val)}
                                            triggerClassName={`px-3 py-1.5 text-xs font-medium text-start rounded-md transition-colors cursor-pointer border-none ${complaint.priority === 'High' ? 'bg-danger/10 text-danger hover:bg-danger/20' : complaint.priority === 'Medium' ? 'bg-warning/10 text-warning hover:bg-warning/20' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'}`}
                                        />
                                    </div>
                                </td>
                                <td className="p-5 text-start">
                                    <span className={`inline-flex items-center justify-center w-[105px] px-3 py-1.5 text-xs font-medium rounded-md ${complaint.status === 'Pending' ? 'bg-warning/10 text-warning' : complaint.status === 'Resolved' ? 'bg-success/10 text-success' : 'bg-accent/10 text-blue-500'}`}>
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
