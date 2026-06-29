import React from 'react';
import { Square, CheckSquare, Pencil, Trash2, Phone, Loader2 } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import TableSkeletonLoader from '@/components/ui/TableSkeletonLoader';
import { useTranslation } from '@/hooks/useTranslation';

const AdminTable = ({
    paginatedAdmins,
    organizations = [],
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedAdminDetail,
    setView,
    handleOrganizationChange,
    handleStatusChangeClick,
    handleDeleteAdmin,
    openEditAdminModal,
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
                                {paginatedAdmins.length > 0 && paginatedAdmins.every(w => selectedIds.includes(w._id)) ? (
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
                            {t('email')}
                        </th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">
                            {t('phone')}
                        </th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">
                            {t('organization')}
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
                        <TableSkeletonLoader columns={7} />
                    ) : error ? (
                        <tr>
                            <td colSpan="7" className="p-8 text-center text-danger">{error}</td>
                        </tr>
                    ) : paginatedAdmins.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="p-8 text-center text-gray-400">{t('no_records_found')}</td>
                        </tr>
                    ) : (
                        paginatedAdmins.map((admin) => {
                            const isSelected = selectedIds.includes(admin._id);
                            return (
                                <tr key={admin._id} className={`hover:bg-gray-50/40 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleSelectRow(admin._id)} className="focus:outline-none text-gray-300 cursor-pointer">
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
                                                setSelectedAdminDetail(admin);
                                                setView('detail');
                                            }}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                {admin.name ? admin.name.substring(0, 2) : 'NA'}
                                            </div>
                                            <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors">{admin.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-start text-gray-500">
                                        {admin.email}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-start justify-start gap-1.5 text-gray-500">
                                            <Phone size={14} className="text-gray-400" />
                                            <span>{admin.phone}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-start justify-start">
                                        <div className="relative w-[145px]">
                                            <Dropdown
                                                minWidth=""
                                                options={organizations.map(org => ({ value: org._id, label: org.name }))}
                                                value={admin.organization?._id || admin.organization || ""}
                                                onChange={(val) => handleOrganizationChange(admin._id, val)}
                                                placeholder={t('select_organization')}
                                                triggerClassName="px-3 py-1.5 text-xs font-regular text-start rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-gray-300 transition-colors"
                                            />
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
                                                value={admin.isActive ? "Active" : "Inactive"}
                                                onChange={() => handleStatusChangeClick(admin._id, admin.isActive ? "Active" : "Inactive")}
                                                triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${admin.isActive ? "bg-green-50 text-success border-green-200 hover:bg-green-100" : "bg-red-50 text-danger border-red-200 hover:bg-red-100"}`}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-3 text-gray-400">
                                            <button onClick={() => openEditAdminModal(admin)} className="text-secondary cursor-pointer transition-colors" title="Edit row item">
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

export default AdminTable;
