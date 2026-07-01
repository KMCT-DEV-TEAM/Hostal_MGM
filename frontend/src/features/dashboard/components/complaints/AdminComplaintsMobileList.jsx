import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import MobileSkeletonLoader from '@/components/ui/MobileSkeletonLoader';

const AdminComplaintsMobileList = ({
    complaints,
    loading,
    onRowClick,
    showWarden = false
}) => {
    const [expandedIds, setExpandedIds] = useState([]);

    const toggleExpand = (e, id) => {
        e.stopPropagation();
        setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="md:hidden flex flex-col gap-4 mt-4 md:mt-0 flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {loading ? (
                <MobileSkeletonLoader />
            ) : complaints.length === 0 ? (
                <div className="text-center text-gray-400 p-8 bg-white rounded-xl shadow-sm">No records found.</div>
            ) : (
                complaints.map((complaint) => {
                    const isExpanded = expandedIds.includes(complaint.id);
                    return (
                        <div key={complaint.id} className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-50 overflow-hidden shrink-0">
                            {/* Header */}
                            <div 
                                className="flex justify-between items-center p-3 border-b border-gray-50 bg-gray-50/30 cursor-pointer"
                                onClick={(e) => toggleExpand(e, complaint.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-sm uppercase shrink-0">
                                        {complaint.organization.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 text-[13px] truncate max-w-[150px]">{complaint.organization}</span>
                                        <span className="text-[11px] text-gray-500 truncate max-w-[150px]">{complaint.hostel}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-gray-400 font-medium uppercase">Total</span>
                                        <span className="text-sm font-bold text-[#0A437A]">{complaint.totalComplaints}</span>
                                    </div>
                                    <button
                                        onClick={(e) => toggleExpand(e, complaint.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer shrink-0 ml-1"
                                    >
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Expandable Content */}
                            {isExpanded && (
                                <>
                                    <div className="flex flex-col text-[13px]">
                                        {showWarden && (
                                            <div className="flex border-b border-gray-50/50">
                                                <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Warden</div>
                                                <div className="w-2/3 py-2.5 px-3 text-gray-900 font-semibold">: {complaint.warden}</div>
                                            </div>
                                        )}
                                        <div className="flex border-b border-gray-50/50 bg-gray-50/30">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Pending</div>
                                            <div className="w-2/3 py-2.5 px-3 text-yellow-600 font-medium">: {complaint.pending}</div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">In Progress</div>
                                            <div className="w-2/3 py-2.5 px-3 text-blue-600 font-medium">: {complaint.inProgress}</div>
                                        </div>
                                        <div className="flex bg-gray-50/30">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium h-full">Resolved</div>
                                            <div className="w-2/3 py-2.5 px-3 text-green-600 font-medium">: {complaint.resolved}</div>
                                        </div>
                                    </div>

                                    {/* Bottom Button */}
                                    <button
                                        onClick={() => onRowClick && onRowClick(complaint)}
                                        className="w-full py-3 bg-[#EAF3FF] text-[#0A437A] font-semibold text-[13px] hover:bg-[#D1E4FF] transition-colors cursor-pointer"
                                    >
                                        View Details
                                    </button>
                                </>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default AdminComplaintsMobileList;
