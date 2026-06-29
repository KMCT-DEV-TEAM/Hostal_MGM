import React from 'react';
import { Pencil, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import MobileSkeletonLoader from '@/components/ui/MobileSkeletonLoader';

const StudentComplaintsMobileList = ({
    loading,
    complaints,
    categories = [],
    handleCategoryChange,
    openEditModal,
    onViewDetail
}) => {
    // Transform categories into Dropdown options format
    const categoryOptions = categories.map(cat => ({
        value: cat._id,
        label: cat.name
    }));

    return (
        <div className="md:hidden flex flex-col gap-4 mt-4 md:mt-0 flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {loading ? (
                <MobileSkeletonLoader />
            ) : complaints.length === 0 ? (
                <div className="text-center text-gray-400 p-8 bg-white rounded-xl shadow-sm">No complaints found.</div>
            ) : (
                complaints.map((complaint) => {
                    return (
                        <div 
                            key={complaint.id} 
                            className="bg-white p-4 rounded-xl shadow-sm flex flex-col relative border border-transparent cursor-pointer hover:border-gray-200 transition-colors"
                            onClick={() => onViewDetail && onViewDetail(complaint)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center justify-center px-2 py-1 text-[10px] font-medium rounded-md border ${complaint.status === 'Pending' ? 'bg-warning/10 text-warning border-warning/20' : complaint.status === 'Resolved' ? 'bg-success/10 text-success border-success/20' : complaint.status === 'In progress' ? 'bg-accent/10 text-blue-500 border-blue-200' : 'bg-gray-100 text-text-secondary border-gray-200'}`}>
                                        {complaint.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {complaint.status === 'Pending' ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal && openEditModal(complaint);
                                            }}
                                            className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <Pencil className="w-4 h-4 opacity-30 cursor-not-allowed" title="Cannot edit non-pending complaints" />
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 mb-3">
                                <div className="font-bold text-gray-900 text-base mb-1 truncate text-[#777777]">
                                    {complaint.subject}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 mb-2">
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium">Room:</span>
                                        <span>{complaint.roomNo}</span>
                                    </div>
                                    <span className="hidden sm:inline">-</span>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{complaint.date}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-3 border-t border-gray-50 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                                <label className="text-[10px] font-medium text-gray-500">Category</label>
                                {complaint.status === 'Pending' ? (
                                    <Dropdown
                                        minWidth=""
                                        options={categoryOptions.length > 0 ? categoryOptions : [{ value: complaint.categoryId || complaint.category, label: complaint.category }]}
                                        value={complaint.categoryId || complaint.category}
                                        onChange={(val) => handleCategoryChange(complaint.id, val)}
                                        triggerClassName="w-full px-3 py-1.5 text-xs font-regular text-start rounded-lg bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
                                    />
                                ) : (
                                    <div className="px-3 py-1.5 text-xs font-regular text-gray-500 bg-gray-50 border border-gray-200 rounded-lg inline-block w-full">
                                        {complaint.category}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default StudentComplaintsMobileList;
