import React from 'react';
import MobileList, { MobileRow, MobileStatusRow } from '@/components/ui/MobileList';
import { useTranslation } from '@/hooks/useTranslation';

const BatchMobileList = ({
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

    const renderBody = (o) => (
        <>
            <MobileRow label="Id" value={(o.batchId || o._id.substring(o._id.length - 6)).toUpperCase()} />
            <MobileRow label={t('batch_code')} value={o.code || 'N/A'} />
            <MobileRow label={t('department')} value={o.departmentId ? o.departmentId.name : 'N/A'} />
            <MobileRow label={t('num_students')} value={o.studentsCount || 0} />
            <MobileStatusRow 
                isActive={o.isActive} 
                onClick={(e) => {
                    e.stopPropagation();
                    if (handleStatusChangeClick) handleStatusChangeClick(o._id, o.isActive);
                }} 
            />
        </>
    );

    return (
        <MobileList
            items={batches}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelectRow}
            onEdit={(o) => openModal('edit', o)}
            canSelect={true}
            canEdit={true}
            emptyText={t('no_records_found')}
            titleFn={(o) => o.name}
            renderBody={renderBody}
            onViewDetails={(o) => {
                setSelectedBatchDetail(o);
                setView('detail');
            }}
        />
    );
};

export default BatchMobileList;
