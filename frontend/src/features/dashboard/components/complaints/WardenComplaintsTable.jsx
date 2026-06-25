import React from 'react';
import Dropdown from '@/components/ui/Dropdown';
import TableSkeletonLoader from '@/components/ui/TableSkeletonLoader';

export default function WardenComplaintsTable({
    loading,
    complaints,
    categories = [],
    handleCategoryChange,
    handlePriorityChange,
    handleStatusChange,
    onViewClick
}) {
    const categoryOptions = categories.map(cat => ({
        value: cat._id,
        label: cat.name
    }));

    return (
        <div className="hidden md:block h-full overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-start relative">
                <thead className="sticky top-0 z-10 bg-[#FAFBFD] shadow-sm">
                    <tr className="bg-[#FAFBFD] border-b border-gray-100 text-gray-400 text-xs tracking-wider uppercase font-semibold">
                        <th className="p-4 w-12 text-center normal-case text-sm font-semibold text-[#222222]">#</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Student</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Room No</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Category</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Subject</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Date</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Priority</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Status</th>
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
                                <td className="p-4 text-center text-[#777777] font-medium">{index + 1}</td>
                                <td className="p-4 text-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                            {complaint.student.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <span className="text-[#222222] font-medium">{complaint.student}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-start text-[#777777] font-medium">
                                    {complaint.roomNo}
                                </td>
                                <td className="p-4 text-start" onClick={e => e.stopPropagation()}>
                                    <div className="relative w-full max-w-[140px]">
                                        <Dropdown
                                            minWidth=""
                                            options={categoryOptions.length > 0 ? categoryOptions : [{ value: complaint.categoryId || complaint.category, label: complaint.category }]}
                                            value={complaint.categoryId || complaint.category}
                                            onChange={(val) => handleCategoryChange && handleCategoryChange(complaint.id, val)}
                                            triggerClassName="px-3 py-1.5 text-xs font-medium text-start rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors cursor-pointer w-full flex justify-between items-center"
                                        />
                                    </div>
                                </td>
                                <td className="p-4 text-start text-[#777777]">
                                    {complaint.subject}
                                </td>
                                <td className="p-4 text-start text-[#777777]">
                                    {complaint.date}
                                </td>
                                <td className="p-4 text-start" onClick={e => e.stopPropagation()}>
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
                                <td className="p-4 text-start" onClick={e => e.stopPropagation()}>
                                    <div className="relative w-full max-w-[120px]">
                                        <Dropdown
                                            minWidth=""
                                            options={[
                                                { value: "Pending", label: "Pending" },
                                                { value: "In progress", label: "In progress" },
                                                { value: "Resolved", label: "Resolved" }
                                            ]}
                                            value={complaint.status || 'Pending'}
                                            onChange={(val) => handleStatusChange && handleStatusChange(complaint.id, val)}
                                            triggerClassName={`px-3 py-1.5 text-xs font-medium text-start rounded-md transition-colors cursor-pointer border-none flex justify-between items-center w-full ${complaint.status === 'Pending' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : complaint.status === 'Resolved' ? 'bg-green-50 text-success hover:bg-green-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
