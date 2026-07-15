import React from 'react';
import { Pencil, Mail, Phone } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import ListTable from '@/components/ui/ListTable';
import { useTranslation } from '@/hooks/useTranslation';

const WardenTable = ({
    paginatedWardens,
    availableHostels,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedWardenDetail,
    setView,
    handleHostelChange,
    handleStatusChangeClick,
    openEditWardenModal,
    loading,
    error,
}) => {
    const { t } = useTranslation();

    const headers = [
        t('name'),
        t('email'),
        t('phone'),
        t('hostel_name'),
        t('status'),
        { label: t('actions'), align: 'center' }
    ];

    const renderRow = (warden, index, isSelected, isLoading) => (
        <>
            <td className="p-4 font-medium text-[#777777]">
                <div
                    className="flex items-center gap-3 cursor-pointer hover:text-[#0A437A]"
                    onClick={() => {
                        setSelectedWardenDetail(warden);
                        setView('detail');
                    }}
                >
                    <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {warden.name ? warden.name.substring(0, 2) : 'NA'}
                    </div>
                    <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors">{warden.name}</span>
                </div>
            </td>
            <td className="p-4 text-start text-gray-500">
                <div className="flex items-center justify-start gap-1.5 text-gray-500">
                    <Mail size={14} className="text-gray-400" />
                    <span>{warden.email}</span>
                </div>
            </td>
            <td className="p-4 text-start">
                <div className="flex items-center justify-start gap-1.5 text-gray-500">
                    <Phone size={14} className="text-gray-400" />
                    <span>{warden.phone}</span>
                </div>
            </td>
            <td className="p-4 text-start">
                <div className="relative w-[145px]">
                    <Dropdown
                        minWidth=""
                        options={[
                            { value: "Not Assigned", label: "Not Assigned" },
                            ...availableHostels.map(h => ({ value: h._id || h, label: h.name || h }))
                        ]}
                        value={warden.hostel?._id || warden.hostel || 'Not Assigned'}
                        onChange={(val) => handleHostelChange(warden.id, val)}
                        triggerClassName="px-3 py-1.5 text-xs font-regular text-start rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors"
                    />
                </div>
            </td>
            <td className="p-4 text-start">
                <div className="relative inline-block w-[105px]">
                    <Dropdown
                        minWidth=""
                        options={[
                            { value: "Active", label: t('active') },
                            { value: "Inactive", label: t('inactive') }
                        ]}
                        value={warden.status}
                        onChange={() => handleStatusChangeClick(warden.id, warden.status)}
                        triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${warden.status === 'Active' ? 'bg-green-50 text-success border-green-200 hover:bg-green-100' : 'bg-red-50 text-danger border-red-200 hover:bg-red-100'}`}
                    />
                </div>
            </td>
            <td className="p-4 text-start">
                <div className="flex items-center justify-center gap-3 text-gray-400">
                    <button onClick={() => openEditWardenModal(warden)} className="text-secondary cursor-pointer transition-colors" title="Edit row item">
                        <Pencil className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </>
    );

    return (
        <ListTable
            headers={headers}
            items={paginatedWardens}
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

export default WardenTable;
