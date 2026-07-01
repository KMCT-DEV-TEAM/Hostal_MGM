import React, { useState } from 'react';
import { Pencil, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import MobileSkeletonLoader from '@/components/ui/MobileSkeletonLoader';
import { useTranslation } from '@/hooks/useTranslation';

const OrganizationMobileList = ({
    orgs,
    loading,
    error,
    openModal,
    setSelectedOrganizationDetail,
    setView,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    handleStatusChangeClick,
    isAdmin
}) => {
    const { t } = useTranslation();
    const isAllSelected = orgs.length > 0 && orgs.every(o => selectedIds && selectedIds.includes(o._id));
    const [expandedIds, setExpandedIds] = useState([]);

    const toggleExpand = (e, id) => {
        e.stopPropagation();
        setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="md:hidden flex flex-col gap-4 mt-4 md:mt-0 flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {!error && orgs.length > 0 && !isAdmin && (
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
            ) : orgs.length === 0 ? (
                <div className="text-center text-gray-500 p-8 bg-white rounded-xl">No organizations match the selected filter.</div>
            ) : (
                orgs.map((o) => {
                    const isSelected = selectedIds && selectedIds.includes(o._id);
                    const isExpanded = expandedIds.includes(o._id);
                    return (
                        <div key={o._id} className={`bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border overflow-hidden shrink-0 ${isSelected && !isAdmin ? 'border-[#0A437A]' : 'border-gray-50'}`}>
                            {/* Header */}
                            <div 
                                className="flex justify-between items-center p-3 border-b border-gray-50 bg-gray-50/30 cursor-pointer"
                                onClick={(e) => toggleExpand(e, o._id)}
                            >
                                <div className="flex items-center gap-2">
                                    {!isAdmin && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleSelectRow(o._id); }}
                                            className="focus:outline-none text-gray-300 cursor-pointer flex items-center justify-center shrink-0"
                                        >
                                            {isSelected ? (
                                                <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                    )}
                                    <span className="font-bold text-gray-900 text-[13px]">{o.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!isAdmin && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openModal('edit', o); }}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => toggleExpand(e, o._id)}
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
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900 font-semibold">: {(o.organizationId || o._id.substring(o._id.length - 6)).toUpperCase()}</div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50 bg-gray-50/30">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Email</div>
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900 truncate">: {o.email}</div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Phone</div>
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900">: {o.phone || 'N/A'}</div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50 bg-gray-50/30">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Address</div>
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900">: {o.address || 'N/A'}</div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Students</div>
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900">: {o.studentsCount || 0}</div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50 bg-gray-50/30 items-center">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Status</div>
                                            <div className="w-2/3 py-2.5 px-3 flex items-center gap-1">
                                                : {isAdmin ? (
                                                    <span className={`font-semibold ${o.isActive ? 'text-green-500' : 'text-red-500'}`}>
                                                        {o.isActive ? t('active') : t('inactive')}
                                                    </span>
                                                ) : (
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleStatusChangeClick && handleStatusChangeClick(o._id, o.isActive)}
                                                        className={`font-semibold cursor-pointer ${o.isActive ? 'text-green-500' : 'text-red-500'}`}
                                                    >
                                                        {o.isActive ? t('active') : t('inactive')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Button */}
                                    <button
                                        onClick={() => {
                                            setSelectedOrganizationDetail(o);
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

export default OrganizationMobileList;
