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
        <div className="hidden md:block flex-1 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[#FAFBFD] shadow-sm">
                    <tr className="bg-[#FAFBFD] border-b border-gray-100 text-gray-400 text-xs tracking-wider uppercase font-semibold">
                        <th className="p-4 w-12 text-center normal-case text-sm font-semibold text-[#222222]">#</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Category</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Room No</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Subject</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Date</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Status</th>
                        <th className="p-4 text-center normal-case text-sm font-semibold text-[#222222]">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                    {loading ? (
                        <TableSkeletonLoader columns={7} />
                    ) : complaints.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="p-8 text-center text-gray-400">No complaints found</td>
                        </tr>
                    ) : (
                        complaints.map((complaint, index) => (
                            <tr
                                key={complaint.id}
                                className="hover:bg-gray-50/40 transition-colors cursor-pointer"
                                onClick={() => onViewDetail && onViewDetail(complaint)}
                            >
                                <td className="p-4 text-center text-[#777777]">{index + 1}</td>
                                <td className="p-4 text-start" onClick={e => e.stopPropagation()}>
                                    <div className="relative w-full max-w-[120px]">
                                        {complaint.status === 'Pending' ? (
                                            <Dropdown
                                                minWidth=""
                                                options={categoryOptions.length > 0 ? categoryOptions : [{ value: complaint.categoryId || complaint.category, label: complaint.category }]}
                                                value={complaint.categoryId || complaint.category}
                                                onChange={(val) => handleCategoryChange(complaint.id, val)}
                                                triggerClassName="px-3 py-1.5 text-xs font-regular text-start rounded-lg bg-white border border-gray-200 text-text-primary hover:border-gray-300 transition-colors cursor-pointer"
                                            />
                                        ) : (
                                            <span className="px-3 py-1.5 text-xs font-regular text-text-secondary bg-gray-50 border border-gray-200 rounded-lg inline-block w-full">
                                                {complaint.category}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-start text-gray-500">
                                    {complaint.roomNo}
                                </td>
                                <td className="p-4 text-start font-medium text-[#777777]">
                                    <span className="font-medium hover:text-[#0A437A] transition-colors">{complaint.subject}</span>
                                </td>
                                <td className="p-4 text-start text-gray-500">
                                    {complaint.date}
                                </td>
                                <td className="p-4 text-start">
                                    <span className={`inline-flex items-center justify-center w-[105px] px-3 py-1.5 text-xs font-medium rounded-md ${complaint.status === 'Pending' ? 'bg-warning/10 text-warning' : complaint.status === 'Resolved' ? 'bg-success/10 text-success' : complaint.status === 'In progress' ? 'bg-accent/10 text-blue-500' : 'bg-gray-100 text-text-secondary'}`}>
                                        {complaint.status}
                                    </span>
                                </td>
                                <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center justify-center gap-3 text-gray-400">
                                        {complaint.status === 'Pending' ? (
                                            <button
                                                onClick={() => openEditModal && openEditModal(complaint)}
                                                className="text-secondary cursor-pointer transition-colors hover:text-blue-600"
                                                title="Edit complaint"
                                            >
                                                <Pencil className="w-4 h-4 mx-auto" strokeWidth={1.5} />
                                            </button>
                                        ) : (
                                            <Pencil className="w-4 h-4 mx-auto opacity-30 cursor-not-allowed" strokeWidth={1.5} title="Cannot edit non-pending complaints" />
                                        )}
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
