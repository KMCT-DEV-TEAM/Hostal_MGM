import React from 'react';
import MobileList, { MobileRow, MobileStatusRow } from '@/components/ui/MobileList';
import { useTranslation } from '@/hooks/useTranslation';

const CourseMobileList = ({
    courses,
    loading,
    error,
    openModal,
    setSelectedCourseDetail,
    setView,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    handleStatusChangeClick
}) => {
    const { t } = useTranslation();

    const renderBody = (o) => (
        <>
            <MobileRow label="Id" value={(o.courseId || o._id.substring(o._id.length - 6)).toUpperCase()} />
            <MobileRow label={t('course_code')} value={o.code || 'N/A'} />
            <MobileRow label="Batches" value={o.batchesCount || 0} />
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
            items={courses}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelectRow}
            onEdit={(o) => openModal('edit', o)}
            canSelect={true}
            canEdit={true}
            emptyText="No Courses match the selected filter."
            titleFn={(o) => o.name}
            renderBody={renderBody}
            onViewDetails={(o) => {
                setSelectedCourseDetail(o);
                setView('detail');
            }}
        />
    );
};

export default CourseMobileList;
