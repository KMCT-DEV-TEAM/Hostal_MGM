import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import MobileSkeletonLoader from '@/components/ui/MobileSkeletonLoader';

const WardenComplaintsMobileList = ({
    loading,
    complaints,
    categories = [],
    handleCategoryChange,
    handlePriorityChange,
    onViewClick
}) => {
    const [expandedIds, setExpandedIds] = useState([]);

    const toggleExpand = (e, id) => {
        e.stopPropagation();
        setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

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
                    const isExpanded = expandedIds.includes(complaint.id);
                    return (
                        <div key={complaint.id} className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-50 overflow-hidden shrink-0">
                            {/* Header */}
                            <div 
                                className="flex justify-between items-center p-3 border-b border-gray-50 bg-gray-50/30 cursor-pointer"
                                onClick={(e) => toggleExpand(e, complaint.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-primary flex items-center justify-center font-bold text-sm uppercase shrink-0">
                                        {complaint.student.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 text-[13px] truncate max-w-[150px]">{complaint.student}</span>
                                        <span className="text-[11px] text-gray-500 truncate max-w-[150px]">{complaint.subject}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => toggleExpand(e, complaint.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer shrink-0"
                                    >
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Expandable Content */}
                            {isExpanded && (
                                <>
                                    <div className="flex flex-col text-[13px]">
                                        <div className="flex border-b border-gray-50/50">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Room No</div>
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900 font-semibold">: {complaint.roomNo}</div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50 bg-gray-50/30">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Date</div>
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900 truncate">: {complaint.date}</div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Status</div>
                                            <div className="w-2/3 py-2.5 px-3 flex items-center">
                                                <span className="mr-1">:</span>
                                                <span className={`inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-medium rounded-md border ${
                                                    complaint.status === 'Resolved' ? 'bg-success/10 text-success border-success/20' :
                                                    complaint.status === 'Awaiting' ? 'bg-warning/10 text-warning border-warning/20' :
                                                    complaint.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                    complaint.status === 'Incomplete' ? 'bg-primary/10 text-primary border-primary/20' :
                                                    complaint.status === 'Rejected' ? 'bg-red-50 text-danger border-red-200' :
                                                    'bg-blue-50 text-blue-600 border-blue-200'
                                                }`}>
                                                    {complaint.status || 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center border-b border-gray-50/50 bg-gray-50/30">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium h-full">Category</div>
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900 flex items-center">
                                                <span className="mr-1">:</span>
                                                <Dropdown
                                                    minWidth=""
                                                    options={categoryOptions.length > 0 ? categoryOptions : [{ value: complaint.categoryId || complaint.category, label: complaint.category }]}
                                                    value={complaint.categoryId || complaint.category}
                                                    onChange={(val) => handleCategoryChange && handleCategoryChange(complaint.id, val)}
                                                    triggerClassName="w-full px-2 py-1 text-xs font-regular text-start rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium h-full">Priority</div>
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900 flex items-center">
                                                <span className="mr-1">:</span>
                                                <Dropdown
                                                    minWidth=""
                                                    options={[
                                                        { value: "High", label: "High" },
                                                        { value: "Medium", label: "Medium" },
                                                        { value: "Low", label: "Low" }
                                                    ]}
                                                    value={complaint.priority || 'Medium'}
                                                    onChange={(val) => handlePriorityChange && handlePriorityChange(complaint.id, val)}
                                                    triggerClassName={`w-full px-2 py-1 text-xs font-regular text-start rounded-lg transition-colors cursor-pointer border ${complaint.priority === 'High' ? 'bg-danger/10 text-danger hover:bg-danger/20 border-danger/20' : complaint.priority === 'Medium' ? 'bg-warning/10 text-warning hover:bg-warning/20 border-warning/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'}`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Button */}
                                    <button
                                        onClick={() => onViewClick && onViewClick(complaint)}
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

export default WardenComplaintsMobileList;
