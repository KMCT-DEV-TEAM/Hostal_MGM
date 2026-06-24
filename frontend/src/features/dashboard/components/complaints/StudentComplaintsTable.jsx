import React from 'react';
import { Pencil } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';

export default function StudentComplaintsTable({
    complaints,
    handleCategoryChange,
    openEditModal,
    onViewDetail
}) {
    return (
        <div className="hidden md:block flex-1 overflow-auto bg-white rounded-xl border border-gray-100 shadow-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[#FAFBFD] shadow-sm">
                    <tr className="bg-[#FAFBFD] border-b border-gray-100 text-text-primary text-sm font-semibold">
                        <th className="p-5 w-[5%] text-center">#</th>
                        <th className="p-5 w-[20%] text-start">Category</th>
                        <th className="p-5 w-[30%] text-start">Subject</th>
                        <th className="p-5 w-[20%] text-start">Date</th>
                        <th className="p-5 w-[15%] text-start">Status</th>
                        <th className="p-5 w-[10%] text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                    {complaints.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="p-8 text-center text-text-secondary">No complaints found</td>
                        </tr>
                    ) : (
                        complaints.map((complaint, index) => (
                            <tr 
                                key={complaint.id} 
                                className="hover:bg-gray-50/40 transition-colors cursor-pointer"
                                onClick={() => onViewDetail && onViewDetail(complaint)}
                            >
                                <td className="p-5 text-center text-text-secondary">{index + 1}</td>
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
                                    <span className={`px-3 py-1.5 text-xs font-medium rounded-md ${complaint.status === 'Pending' ? 'bg-warning/10 text-warning' : complaint.status === 'Resolved' ? 'bg-success/10 text-success' : 'bg-gray-100 text-text-secondary'}`}>
                                        {complaint.status}
                                    </span>
                                </td>
                                <td className="p-5 text-center" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => openEditModal && openEditModal(complaint)}
                                        className="text-accent hover:text-blue-600 cursor-pointer transition-colors"
                                        title="Edit complaint"
                                    >
                                        <Pencil className="w-4 h-4 mx-auto" strokeWidth={1.5} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
