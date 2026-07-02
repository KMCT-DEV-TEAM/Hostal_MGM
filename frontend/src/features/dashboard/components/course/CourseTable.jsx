import React from 'react';
import { Pencil, Layers, FileText, Building2 } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import ListTable from '@/components/ui/ListTable';
import { useTranslation } from '@/hooks/useTranslation';

const CourseTable = ({
    courses,
    loading,
    error,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedCourseDetail,
    setView,
    handleStatusChangeClick,
    openModal
}) => {
    const { t } = useTranslation();

    const headers = [
        t('course_name'),
        t('course_code'),
        { label: t('num_departments'), align: 'center' },
        { label: t('num_batches'), align: 'center' },
        t('status'),
        { label: t('action'), align: 'center' }
    ];

    const renderRow = (o, index, isSelected, isLoading) => (
        <>
            <td className="p-4 font-medium text-[#777777]">
                <div
                    className="flex items-center gap-3 cursor-pointer hover:text-[#0A437A]"
                    onClick={() => {
                        setSelectedCourseDetail(o);
                        setView('detail');
                    }}
                >
                    <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {o.name ? o.name.substring(0, 2) : 'NA'}
                    </div>
                    <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors">{o.name}</span>
                </div>
            </td>
            <td className="p-4 text-gray-500">
                <div className="flex items-center gap-2 text-start">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    {o.code || 'N/A'}
                </div>
            </td>
            <td className="p-4">
                <div className="flex items-center justify-center gap-2 text-text-secondary">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium">{o.departmentsCount || 0}</span>
                </div>
            </td>
            <td className="p-4">
                <div className="flex items-center justify-center gap-2 text-text-secondary">
                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium">{o.batchesCount || 0}</span>
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
                        triggerClassName="px"
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
            items={courses}
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

export default CourseTable;
