import React, { useState } from 'react';
import { Pencil, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import MobileSkeletonLoader from '@/components/ui/MobileSkeletonLoader';

export default function WardenMobileList({
    paginatedWardens,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedWardenDetail,
    setView,
    handleStatusChangeClick,
    openEditWardenModal,
    loading,
    error,
    availableHostels = [],
    handleHostelChange
}) {
    const isAllSelected = paginatedWardens.length > 0 && paginatedWardens.every(w => selectedIds.includes(w.id));
    const [expandedIds, setExpandedIds] = useState([]);

    const toggleExpand = (e, id) => {
        e.stopPropagation();
        setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="md:hidden flex flex-col gap-4 mt-4 md:mt-0 flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {paginatedWardens.length > 0 && (
                <div className="flex items-center gap-2 px-1 mb-1">
                    <button onClick={handleSelectAll} className="focus:outline-none text-gray-400 cursor-pointer flex items-center gap-2">
                        {isAllSelected ? (
                            <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                        ) : (
                            <Square className="w-5 h-5" />
                        )}
                        <span className="text-sm font-medium text-gray-600">Select All</span>
                    </button>
                </div>
            )}
            {loading ? (
                <MobileSkeletonLoader />
            ) : error ? (
                <div className="text-center text-danger p-8 bg-white rounded-xl shadow-sm border border-gray-100">{error}</div>
            ) : paginatedWardens.length === 0 ? (
                <div className="text-center text-gray-500 p-8 bg-white rounded-xl">No records found matching your search criteria.</div>
            ) : (
                paginatedWardens.map((warden) => {
                    const isSelected = selectedIds.includes(warden.id);
                    const isExpanded = expandedIds.includes(warden.id);
                    
                    return (
                        <div key={warden.id} className={`bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border overflow-hidden shrink-0 ${isSelected ? 'border-[#0A437A]' : 'border-gray-50'}`}>
                            {/* Header */}
                            <div 
                                className="flex justify-between items-center p-3 border-b border-gray-50 bg-gray-50/30 cursor-pointer"
                                onClick={(e) => toggleExpand(e, warden.id)}
                            >
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSelectRow(warden.id); }}
                                        className="focus:outline-none text-gray-300 cursor-pointer flex items-center justify-center shrink-0"
                                    >
                                        {isSelected ? (
                                            <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                    <span className="font-bold text-gray-900 text-[13px]">{warden.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openEditWardenModal(warden); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => toggleExpand(e, warden.id)}
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
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Id</div>
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900 font-semibold">: {(warden.wardenId || warden.id.substring(warden.id.length - 6)).toUpperCase()}</div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50 bg-gray-50/30">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Email</div>
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900 truncate">: {warden.email}</div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Phone</div>
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900">: {warden.phone || 'N/A'}</div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50 bg-gray-50/30 items-center">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Status</div>
                                            <div className="w-2/3 py-2.5 px-3 flex items-center gap-1">
                                                : <button 
                                                    type="button"
                                                    onClick={() => handleStatusChangeClick && handleStatusChangeClick(warden.id, warden.status)}
                                                    className={`font-semibold cursor-pointer ${warden.status === 'Active' ? 'text-green-500' : 'text-red-500'}`}
                                                >
                                                    {warden.status === 'Active' ? 'Active' : 'Inactive'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium h-full">Hostel</div>
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900 flex items-center">
                                                <span className="mr-1">:</span>
                                                <select
                                                    value={warden.hostel?._id || warden.hostel || 'Not Assigned'}
                                                    onChange={(e) => handleHostelChange(warden.id, e.target.value)}
                                                    className="appearance-none bg-transparent text-gray-900 focus:outline-none cursor-pointer p-0 w-full"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <option value="Not Assigned">Not Assigned</option>
                                                    {availableHostels.map(h => (
                                                        <option key={h._id || h} value={h._id || h}>{h.name || h}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Button */}
                                    <button
                                        onClick={() => {
                                            setSelectedWardenDetail(warden);
                                            setView('detail');
                                        }}
                                        className="w-full py-3 bg-[#EAF3FF] text-[#0A437A] font-semibold text-[13px] hover:bg-[#D1E4FF] transition-colors cursor-pointer"
                                    >
                                        View Details
                                    </button>
                                </>
                            )}
                        </div>
                    )
                })
            )}
        </div>
    );
}
