import React from 'react';
import { Pencil, AlignLeft } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import ListTable from '@/components/ui/ListTable';
import { useTranslation } from '@/hooks/useTranslation';

const ComplaintCategoryTable = ({
    complaintCategories,
    loading,
    error,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedCategoryDetail,
    setView,
    handleStatusChangeClick,
    openModal
}) => {
    const { t } = useTranslation();

    const headers = [
        'Category Name',
        'Description',
        t('status'),
        { label: t('action'), align: 'center' }
    ];

    const renderRow = (c, index, isSelected, isLoading) => (
        <>
            <td className="p-4 font-medium text-[#777777]">
                <div
                    className="flex items-center gap-3 cursor-pointer hover:text-[#0A437A]"
                    onClick={() => {
                        setSelectedCategoryDetail(c);
                        setView('detail');
                    }}
                >
                    <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {c.name ? c.name.substring(0, 2) : 'NA'}
                    </div>
                    <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors">{c.name}</span>
                </div>
            </td>
            <td className="p-4 text-gray-500">
                <div className="flex items-center gap-2">
                    <AlignLeft className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate max-w-[200px]">
                        {c.description || 'No description'}
                    </span>
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
                        value={c.isActive ? "Active" : "Inactive"}
                        onChange={() => handleStatusChangeClick(c._id, c.isActive)}
                        triggerClassName={"px-3 py-1.5 text-xs font-regular border transition-colors "}
                    />
                </div>
            </td>
            <td className="p-4">
                <div className="flex gap-3 items-center justify-center">
                    <button
                        onClick={() => openModal('edit', c)}
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
            items={complaintCategories}
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

export default ComplaintCategoryTable;
