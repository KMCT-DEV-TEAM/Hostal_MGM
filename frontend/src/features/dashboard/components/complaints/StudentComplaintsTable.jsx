import React from 'react';
import { Pencil } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import TableSkeletonLoader from '@/components/ui/TableSkeletonLoader';

export default function StudentComplaintsTable({
    loading,
    complaints,
    categories = [],
    handleCategoryChange,
    openEditModal,
    onViewDetail
}) {
    // Transform categories into Dropdown options format
    const categoryOptions = categories.map(cat => ({
        value: cat._id,
        label: cat.name
    }));

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
                    {loading ? (
                        <TableSkeletonLoader columns={6} />
                    ) : complaints.length === 0 ? (
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
                                            options={categoryOptions.length > 0 ? categoryOptions : [{ value: complaint.categoryId || complaint.category, label: complaint.category }]}
                                            value={complaint.categoryId || complaint.category}
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
                                    <span className={`inline-flex items-center justify-center w-[105px] px-3 py-1.5 text-xs font-medium rounded-md ${complaint.status === 'Pending' ? 'bg-warning/10 text-warning' : complaint.status === 'Resolved' ? 'bg-success/10 text-success' : complaint.status === 'In progress' ? 'bg-accent/10 text-blue-500' : 'bg-gray-100 text-text-secondary'}`}>
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
