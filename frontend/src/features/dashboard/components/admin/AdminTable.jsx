import React from 'react';
import { Pencil, Phone } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import ListTable from '@/components/ui/ListTable';
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
    openEditAdminModal,
    loading,
    error,
    isStatusUpdating
}) => {
    const { t } = useTranslation();

    const headers = [
        t('name'),
        t('email'),
        t('phone'),
        t('organization'),
        t('status'),
        { label: t('action'), align: 'center' }
    ];

    const renderRow = (admin, index, isSelected, isLoading) => (
        <>
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
                        options={(() => {
                            const opts = organizations.map(org => ({ value: org._id, label: org.name }));
                            if (admin.organization && typeof admin.organization === 'object') {
                                if (!opts.find(opt => opt.value === admin.organization._id)) {
                                    opts.push({ value: admin.organization._id, label: admin.organization.name });
                                }
                            }
                            return opts;
                        })()}
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
        </>
    );

    return (
        <ListTable
            headers={headers}
            items={paginatedAdmins}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelectRow}
            canSelect={true}
            emptyText={t('no_records_found')}
            renderRow={renderRow}
        />
    );
};

export default AdminTable;