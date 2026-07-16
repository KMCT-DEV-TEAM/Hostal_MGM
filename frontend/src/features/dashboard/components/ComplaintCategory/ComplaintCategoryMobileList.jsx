import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { FileText } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import { useTranslation } from '@/hooks/useTranslation';

const ComplaintCategoryMobileList = ({
    complaintCategories,
    loading,
    error,
    openModal,
    setSelectedCategoryDetail,
    setView,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    handleStatusChangeClick,
    ...rest
}) => {
    const { t } = useTranslation();


    return (
        <MobileList
            items={complaintCategories}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelectRow}
            onEdit={(c) => openModal('edit', c)}
            canSelect={true}
            canEdit={true}
            emptyText={t('no_records_found')}
            iconFn={(c) => (
                <div className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase">
                    {c.name ? c.name.substring(0, 2) : 'NA'}
                </div>
            )}
            titleFn={(c) => c.name}
            subtitleFn={(c) => (
                <>
                    <FileText className="w-3 h-3 shrink-0" />
                    <span className="truncate max-w-[180px]">{c.description || 'No description'}</span>
                </>
            )}
            statusBadgeFn={(c) => (
                <MobileCardStatusBadge
                    status={c.isActive ? "Active" : "Inactive"}
                    dotColorClass={c.isActive ? 'bg-green-500' : 'bg-red-500'}
                    bgColorClass={c.isActive ? 'bg-green-50' : 'bg-red-50'}
                    textColorClass={c.isActive ? 'text-green-600' : 'text-red-600'}
                />
            )}
            onViewDetails={(c) => {
                setSelectedCategoryDetail(c);
                setView('detail');
            }}
            {...rest}
        />
    );
};

export default ComplaintCategoryMobileList;
