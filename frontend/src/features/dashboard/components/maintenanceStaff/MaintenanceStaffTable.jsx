import React from 'react';
import { Square, CheckSquare, Pencil, Phone } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import TableSkeletonLoader from '@/components/ui/TableSkeletonLoader';
import { useTranslation } from '@/hooks/useTranslation';

const MaintenanceStaffTable = ({
    paginatedStaff,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedStaffDetail,
    setView,
    handleStatusChangeClick,
    openEditStaffModal,
    loading,
    error
}) => {
    const { t } = useTranslation();

    return (
        <div className="hidden md:block overflow-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[#FAFBFD] shadow-sm">
                    <tr className="bg-[#FAFBFD] border-b border-gray-100 text-gray-400 text-xs tracking-wider uppercase font-semibold">
                        <th className="p-4 w-12 text-center">
                            <button onClick={handleSelectAll} className="focus:outline-none text-gray-300 hover:text-gray-500 cursor-pointer">
                                {paginatedStaff.length > 0 && paginatedStaff.every(w => selectedIds.includes(w._id)) ? (
                                    <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                ) : (
                                    <Square className="w-5 h-5" />
                                )}
                            </button>
                        </th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">
                            {t('name')}
                        </th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">
                            {t('specialization')}
                        </th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">
                            {t('phone')}
                        </th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">
                            {t('status')}
                        </th>
                        <th className="p-4 text-center normal-case text-sm font-semibold text-[#222222]">
                            {t('action')}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                    {loading ? (
                        <TableSkeletonLoader columns={6} />
                    ) : error ? (
                        <tr>
                            <td colSpan="6" className="p-8 text-center text-danger">{error}</td>
                        </tr>
                    ) : paginatedStaff.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="p-8 text-center text-gray-400">{t('no_records_found')}</td>
                        </tr>
                    ) : (
                        paginatedStaff.map((staff) => {
                            const isSelected = selectedIds.includes(staff._id);
                            return (
                                <tr key={staff._id} className={`hover:bg-gray-50/40 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleSelectRow(staff._id)} className="focus:outline-none text-gray-300 cursor-pointer">
                                            {isSelected ? (
                                                <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="p-4 font-medium text-[#777777]">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer hover:text-[#0A437A]"
                                            onClick={() => {
                                                setSelectedStaffDetail(staff);
                                                setView('detail');
                                            }}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                {staff.name ? staff.name.substring(0, 2) : 'NA'}
                                            </div>
                                            <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors">{staff.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-start text-gray-500">
                                        {staff.specialization || 'N/A'}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-start justify-start gap-1.5 text-gray-500">
                                            <Phone size={14} className="text-gray-400" />
                                            <span>{staff.phone || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="relative w-[105px]">
                                            <Dropdown
                                                minWidth=""
                                                options={[
                                                    { value: "Active", label: t('active') },
                                                    { value: "Inactive", label: t('inactive') }
                                                ]}
                                                value={staff.isActive ? "Active" : "Inactive"}
                                                onChange={() => handleStatusChangeClick(staff._id, staff.isActive ? "Active" : "Inactive")}
                                                triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${staff.isActive ? "bg-green-50 text-success border-green-200 hover:bg-green-100" : "bg-danger/10 text-danger border-danger/20 hover:bg-danger/20"}`}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-3 text-gray-400">
                                            <button onClick={() => openEditStaffModal(staff)} className="text-secondary cursor-pointer transition-colors" title="Edit row item">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default MaintenanceStaffTable;
