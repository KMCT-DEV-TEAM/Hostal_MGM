import React, { useState } from 'react';
import { Pencil, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import MobileSkeletonLoader from '@/components/ui/MobileSkeletonLoader';

const ComplaintCategoryMobileList = ({
    complaintCategories,
    loading,
    error,
    openModal,
    setSelectedCategoryDetail,
    setView,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    handleStatusChangeClick
}) => {
    const { t } = useTranslation();
    const isAllSelected = complaintCategories.length > 0 && complaintCategories.every(c => selectedIds.includes(c._id));
    const [expandedIds, setExpandedIds] = useState([]);

    const toggleExpand = (e, id) => {
        e.stopPropagation();
        setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="md:hidden flex flex-col gap-4 mt-4 md:mt-0 flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {!error && complaintCategories.length > 0 && (
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
            ) : complaintCategories.length === 0 ? (
                <div className="text-center text-gray-500 p-8 bg-white rounded-xl">{t('no_records_found')}</div>
            ) : (
                complaintCategories.map((c) => {
                    const isSelected = selectedIds.includes(c._id);
                    const isExpanded = expandedIds.includes(c._id);
                    return (
                        <div key={c._id} className={`bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border overflow-hidden shrink-0 ${isSelected ? 'border-[#0A437A]' : 'border-gray-50'}`}>
                            {/* Header */}
                            <div 
                                className="flex justify-between items-center p-3 border-b border-gray-50 bg-gray-50/30 cursor-pointer"
                                onClick={(e) => toggleExpand(e, c._id)}
                            >
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSelectRow(c._id); }}
                                        className="focus:outline-none text-gray-300 cursor-pointer flex items-center justify-center shrink-0"
                                    >
                                        {isSelected ? (
                                            <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                    <span className="font-bold text-gray-900 text-[13px]">{c.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openModal('edit', c); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => toggleExpand(e, c._id)}
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
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900 font-semibold">: {(c.categoryId || c._id.substring(c._id.length - 6)).toUpperCase()}</div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50 bg-gray-50/30">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Desc.</div>
                                            <div className="w-2/3 py-2.5 px-3 text-gray-900 truncate">: {c.description || 'N/A'}</div>
                                        </div>
                                        <div className="flex border-b border-gray-50/50 items-center">
                                            <div className="w-1/3 py-2.5 px-3 text-gray-500 font-medium">Status</div>
                                            <div className="w-2/3 py-2.5 px-3 flex items-center gap-1">
                                                : <button 
                                                    type="button"
                                                    onClick={() => handleStatusChangeClick && handleStatusChangeClick(c._id, c.isActive)}
                                                    className={`font-semibold cursor-pointer ${c.isActive ? 'text-green-500' : 'text-red-500'}`}
                                                >
                                                    {c.isActive ? t('active') : t('inactive')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Button */}
                                    <button
                                        onClick={() => {
                                            setSelectedCategoryDetail(c);
                                            setView('detail');
                                        }}
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

export default ComplaintCategoryMobileList;
