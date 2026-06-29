import React from 'react';
import { AlignLeft, CheckSquare, Square, Pencil } from 'lucide-react';
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
    handleSelectRow
}) => {
    const { t } = useTranslation();
    const isAllSelected = complaintCategories.length > 0 && complaintCategories.every(c => selectedIds.includes(c._id));

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
                <div className="text-center text-danger p-8 bg-white rounded-xl">{error}</div>
            ) : complaintCategories.length === 0 ? (
                <div className="text-center text-gray-500 p-8 bg-white rounded-xl">{t('no_records_found')}</div>
            ) : (
                complaintCategories.map((c) => {
                    const isSelected = selectedIds.includes(c._id);
                    return (
                        <div key={c._id} className={`bg-white p-4 rounded-xl shadow-sm flex flex-col relative border ${isSelected ? 'border-[#0A437A] bg-blue-50/20' : 'border-transparent'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <button
                                    onClick={() => handleSelectRow(c._id)}
                                    className="focus:outline-none text-gray-300 cursor-pointer"
                                >
                                    {isSelected ? (
                                        <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                    ) : (
                                        <Square className="w-5 h-5" />
                                    )}
                                </button>
                                <button
                                    onClick={() => openModal('edit', c)}
                                    className="text-blue-400 hover:text-[#0A437A] cursor-pointer"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 mt-1">
                                    {c.name ? c.name.substring(0, 2) : 'NA'}
                                </div>

                                <div className="flex-1 min-w-0 pr-6">
                                    <div
                                        className="font-bold text-gray-900 text-base mb-1 cursor-pointer truncate"
                                        onClick={() => {
                                            setSelectedCategoryDetail(c);
                                            setView('detail');
                                        }}
                                    >
                                        {c.name}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[10px] sm:text-xs text-gray-500 mb-2">
                                        <div className="flex items-center gap-1">
                                            <AlignLeft className="w-3 h-3" />
                                            <span className="truncate max-w-[200px]">{c.description || 'No description'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-auto">
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-medium
                                    ${c.isActive ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                    {c.isActive ? t('active') : t('inactive')}
                                </span>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default ComplaintCategoryMobileList;
