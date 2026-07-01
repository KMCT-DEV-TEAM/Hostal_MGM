import React, { useState } from 'react';
import { Pencil, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import MobileSkeletonLoader from '@/components/ui/MobileSkeletonLoader';
import { useTranslation } from '@/hooks/useTranslation';

const MaintenanceStaffMobileList = ({
    paginatedStaff,
    openEditStaffModal,
    setSelectedStaffDetail,
    setView,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    handleStatusChangeClick,
    loading,
    error
}) => {
    const { t } = useTranslation();
    const isAllSelected = paginatedStaff.length > 0 && paginatedStaff.every(o => selectedIds.includes(o._id));
    const [expandedIds, setExpandedIds] = useState([]);

    const toggleExpand = (e, id) => {
        e.stopPropagation();
        setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="md:hidden flex flex-col gap-4 mt-4 md:mt-0 flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {paginatedStaff.length > 0 && (
                <div className="flex items-center gap-2 px-1 mb-1">
                    <button onClick={handleSelectAll} className="focus:outline-none text-gray-400 cursor-pointer flex items-center gap-2">
                        {isAllSelected ? (
                            <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                        ) : (
                            <Square className="w-5 h-5" />
                        )}
                        <span className="text-sm font-medium text-gray-600">{t('select_all', 'Select All')}</span>
                    </button>
                </div>
            )}
            {loading ? (
                <MobileSkeletonLoader />
            ) : error ? (
                <div className="text-center text-danger p-8 bg-white rounded-xl shadow-sm">{error}</div>
            ) : paginatedStaff.length === 0 ? (
                <div className="text-center text-gray-500 p-8 bg-white rounded-xl shadow-sm">{t('no_records_found')}</div>
            ) : (
                paginatedStaff.map((staff) => {
                    const isSelected = selectedIds.includes(staff._id);
                    const isExpanded = expandedIds.includes(staff._id);
                    return (
                        <div key={staff._id} className={`bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border overflow-hidden shrink-0 ${isSelected ? 'border-[#0A437A]' : 'border-gray-50'}`}>
                            {/* Header */}
                            <div 
                                className="flex justify-between items-center p-3 border-b border-gray-50 bg-gray-50/30 cursor-pointer"
                                onClick={(e) => toggleExpand(e, staff._id)}
                            >
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSelectRow(staff._id); }}
                                        className="focus:outline-none text-gray-300 cursor-pointer flex items-center justify-center shrink-0"
                                    >
                                        {isSelected ? (
                                            <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                    <span className="font-bold text-gray-900 text-[13px]">{staff.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openEditStaffModal(staff); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => toggleExpand(e, staff._id)}
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
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900 font-semibold">: {(staff.staffId || staff._id.substring(staff._id.length - 6)).toUpperCase()}</div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50 bg-gray-50/30">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Phone</div>
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900">: {staff.phone || 'N/A'}</div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Spec.</div>
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900">: {staff.specialization || 'N/A'}</div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50 bg-gray-50/30">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Tasks</div>
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900">: <span className="text-gray-500 text-[11px]">A: {staff.taskAssignedCount || 0} | R: {staff.taskResolvedCount || 0} | P: {staff.taskPendingCount || 0}</span></div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50 items-center">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Status</div>
                                            <div className="w-2/3 py-2.5 px-3 flex items-center gap-1">
                                                : <button 
                                                    type="button"
                                                    onClick={() => handleStatusChangeClick && handleStatusChangeClick(staff._id, staff.isActive)}
                                                    className={`font-semibold cursor-pointer ${staff.isActive ? 'text-green-500' : 'text-red-500'}`}
                                                >
                                                    {staff.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Button */}
                                    <button
                                        onClick={() => {
                                            setSelectedStaffDetail(staff);
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
};

export default MaintenanceStaffMobileList;
