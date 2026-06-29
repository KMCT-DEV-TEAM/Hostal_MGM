import React from 'react';
import { Pencil, Phone, Square, CheckSquare, Wrench } from 'lucide-react';
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
    loading,
    error
}) => {
    const { t } = useTranslation();
    const isAllSelected = paginatedStaff.length > 0 && paginatedStaff.every(o => selectedIds.includes(o._id));

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
                    return (
                        <div key={staff._id} className={`bg-white p-4 rounded-xl shadow-sm flex flex-col relative border ${isSelected ? 'border-[#0A437A] bg-blue-50/20' : 'border-transparent'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <button
                                    onClick={() => handleSelectRow(staff._id)}
                                    className="focus:outline-none text-gray-300 cursor-pointer"
                                >
                                    {isSelected ? (
                                        <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                    ) : (
                                        <Square className="w-5 h-5" />
                                    )}
                                </button>
                                <button
                                    onClick={() => openEditStaffModal(staff)}
                                    className="text-blue-400 hover:text-[#0A437A] cursor-pointer"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 mt-1">
                                    {staff.name ? staff.name.substring(0, 2) : 'NA'}
                                </div>

                                <div className="flex-1 min-w-0 pr-6">
                                    <div
                                        className="font-bold text-gray-900 text-base mb-1 cursor-pointer truncate"
                                        onClick={() => {
                                            setSelectedStaffDetail(staff);
                                            setView('detail');
                                        }}
                                    >
                                        {staff.name}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[10px] sm:text-xs text-gray-500 mb-2">
                                        <div className="flex items-center gap-1">
                                            <Wrench className="w-3 h-3" />
                                            <span className="truncate max-w-[120px]">{staff.specialization || 'N/A'}</span>
                                        </div>
                                        <span className="hidden sm:inline">-</span>
                                        <div className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            <span>{staff.phone || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 text-xs">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400">Assigned</span>
                                            <span className="font-semibold text-text-secondary">{staff.taskAssignedCount || 0}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400">Resolved</span>
                                            <span className="font-semibold text-text-secondary">{staff.taskResolvedCount || 0}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400">Pending</span>
                                            <span className="font-semibold text-text-secondary">{staff.taskPendingCount || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-auto">
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-medium
                                    ${staff.isActive ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${staff.isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                    {staff.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>
                    )
                })
            )}
        </div>
    );
};

export default MaintenanceStaffMobileList;
