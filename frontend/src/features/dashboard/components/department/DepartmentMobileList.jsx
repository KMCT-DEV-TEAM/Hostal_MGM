import React from 'react';
import MobileList, { MobileRow, MobileStatusRow } from '@/components/ui/MobileList';
import { useTranslation } from '@/hooks/useTranslation';

const DepartmentMobileList = ({
    Departments,
    loading,
    error,
    openModal,
    setSelectedDepartmentDetail,
    setView,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    handleStatusChangeClick
}) => {
    const { t } = useTranslation();

    const renderBody = (o) => (
        <>
            <MobileRow label="Id" value={(o.departmentId || o._id.substring(o._id.length - 6)).toUpperCase()} />
            <MobileRow label={t('department_code')} value={o.code || 'N/A'} />
            <MobileRow label={t('course')} value={o.courseId ? o.courseId.name : 'N/A'} />
            <MobileRow label={t('num_batches')} value={o.batchesCount || 0} />
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
            items={Departments}
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
                setSelectedDepartmentDetail(o);
                setView('detail');
            }}
        />
    );
};

export default DepartmentMobileList;
