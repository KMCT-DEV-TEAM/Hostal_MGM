import React from 'react';
import { Pencil, FileText, Building2, Users } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import ListTable from '@/components/ui/ListTable';
import { useTranslation } from '@/hooks/useTranslation';

const BatchTable = ({
    batches,
    loading,
    error,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedBatchDetail,
    setView,
    handleStatusChangeClick,
    openModal
}) => {
    const { t } = useTranslation();

    const headers = [
        t('name'),
        t('batch_code'),
        t('department'),
        { label: t('num_students'), align: 'center' },
        t('status'),
        { label: t('action'), align: 'center' }
    ];

    const renderRow = (o, index, isSelected, isLoading) => (
        <>
            <td className="p-4 font-medium text-[#777777]">
                <div
                    className="flex items-center gap-3 cursor-pointer hover:text-[#0A437A]"
                    onClick={() => {
                        setSelectedBatchDetail(o);
                        setView('detail');
                    }}
                >
                    <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {o.name ? o.name.substring(0, 2) : 'NA'}
                    </div>
                    <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors truncate max-w-[150px]" title={o.name}>{o.name}</span>
                </div>
            </td>
            <td className="p-4 text-gray-500">
                <div className="flex items-center gap-2 text-start">
                    <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate max-w-[120px]" title={o.code || 'N/A'}>{o.code || 'N/A'}</span>
                </div>
            </td>
            <td className="p-4 text-gray-500">
                <div className="flex items-center gap-2 text-start">
                    <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate max-w-[150px]" title={o.departmentId ? o.departmentId.name : 'N/A'}>
                        {o.departmentId ? o.departmentId.name : 'N/A'}
                    </span>
                </div>
            </td>
            <td className="p-4">
                <div className="flex items-center justify-center gap-2 text-text-secondary">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium">{o.studentsCount || 0}</span>
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
                        value={o.isActive ? "Active" : "Inactive"}
                        onChange={() => handleStatusChangeClick(o._id, o.isActive)}
                        triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${o.isActive ? "bg-green-50 text-success border-green-200 hover:bg-green-100" : "bg-red-50 text-danger border-red-200 hover:bg-red-100"}`}
                    />
                </div>
            </td>
            <td className="p-4">
                <div className="flex gap-3 items-center justify-center">
                    <button
                        onClick={() => openModal('edit', o)}
                        className="p-1.5 text-gray-400 hover:text-[#0A437A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                        <Pencil className="w-4 h-4 text-secondary" />
                    </button>
                </div>
            </td>
        </>
    );

    return (
        <ListTable
            headers={headers}
            items={batches}
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

export default BatchTable;
