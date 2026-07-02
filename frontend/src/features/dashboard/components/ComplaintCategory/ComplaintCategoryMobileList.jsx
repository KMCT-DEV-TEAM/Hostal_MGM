import React from 'react';
import MobileList, { MobileRow, MobileStatusRow } from '@/components/ui/MobileList';
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
    handleStatusChangeClick
}) => {
    const { t } = useTranslation();

    const renderBody = (c) => (
        <>
            <MobileRow label="Id" value={(c.categoryId || c._id.substring(c._id.length - 6)).toUpperCase()} />
            <MobileRow label="Desc." value={c.description || 'N/A'} />
            <MobileStatusRow 
                isActive={c.isActive} 
                onClick={(e) => {
                    e.stopPropagation();
                    if (handleStatusChangeClick) handleStatusChangeClick(c._id, c.isActive);
                }} 
            />
        </>
    );

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
            titleFn={(c) => c.name}
            renderBody={renderBody}
            onViewDetails={(c) => {
                setSelectedCategoryDetail(c);
                setView('detail');
            }}
        />
    );
};

export default ComplaintCategoryMobileList;
