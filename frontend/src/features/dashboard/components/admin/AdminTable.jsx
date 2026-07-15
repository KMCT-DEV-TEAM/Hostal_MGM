import React from 'react';
import { Pencil, Mail, Phone } from 'lucide-react';
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
    isStatusUpdating,
    currentPage,
    hasMore,
    onLoadMore
}) => {
    const { t } = useTranslation();

    const headers = [
        { label: t('name'), align: 'start', className: 'w-1/6' },
        { label: t('email'), align: 'start', className: 'w-1/6' },
        { label: t('phone'), align: 'start', className: 'w-1/6' },
        { label: t('organization'), align: 'start', className: 'w-1/6' },
        { label: t('status'), align: 'start', className: 'w-1/6' },
        { label: t('action'), align: 'center', className: 'w-1/6' }
    ];

    const renderRow = (admin, index, isSelected, isLoading) => (
        <>
            <td className="p-4 font-medium text-[#777777] align-middle whitespace-nowrap w-1/6 max-w-0">
                <div
                    className="flex items-center gap-3 cursor-pointer hover:text-[#0A437A] truncate"
                    title={admin.name}
                    onClick={() => {
                        setSelectedAdminDetail(admin);
                        setView('detail');
                    }}
                >
                    <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {admin.name ? admin.name.substring(0, 2) : 'NA'}
                    </div>
                    <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors truncate">{admin.name}</span>
                </div>
            </td>
            <td className="p-4 text-start text-gray-500 align-middle whitespace-nowrap w-1/6 max-w-0">
                <div className="flex items-center justify-start gap-1.5 text-gray-500 truncate" title={admin.email}>
                    <Mail size={14} className="text-gray-400 shrink-0" />
                    <span className="truncate">{admin.email}</span>
                </div>
            </td>
            <td className="p-4 text-start align-middle whitespace-nowrap w-1/6 max-w-0">
                <div className="flex items-center justify-start gap-1.5 text-gray-500 truncate" title={admin.phone}>
                    <Phone size={14} className="text-gray-400 shrink-0" />
                    <span className="truncate">{admin.phone}</span>
                </div>
            </td>
            <td className="p-4 text-start align-middle whitespace-nowrap w-1/6 max-w-0">
                <div className="relative w-full">
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
            <td className="p-4 text-start align-middle whitespace-nowrap w-1/6 max-w-0">
                <div className="relative w-full">
                    <Dropdown
                        minWidth=""
                        options={[
                            { value: "Active", label: t('active') },
                            { value: "Inactive", label: t('inactive') }
                        ]}
                        value={admin.isActive ? "Active" : "Inactive"}
                        onChange={() => handleStatusChangeClick(admin._id, admin.isActive ? "Active" : "Inactive")}
                        triggerClassName={`px-3 py-1.5 text-xs font-regular text-start w-full border transition-colors ${admin.isActive ? "bg-green-50 text-success border-green-200 hover:bg-green-100" : "bg-red-50 text-danger border-red-200 hover:bg-red-100"}`}
                    />
                </div>
            </td>
            <td className="p-4 text-center align-middle whitespace-nowrap w-1/6 max-w-0">
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
            currentPage={currentPage}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
        />
    );
};

export default AdminTable;
