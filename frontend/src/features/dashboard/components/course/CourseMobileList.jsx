import React from 'react';
import MobileList, { MobileRow } from '@/components/ui/MobileList';
import Dropdown from '@/components/ui/Dropdown';
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
            <MobileRow 
                label={t('status')} 
                value={
                    <div onClick={(e) => e.stopPropagation()} className="w-full">
                        <Dropdown
                            minWidth=""
                            options={[
                                { value: "Active", label: "Active" },
                                { value: "Inactive", label: "Inactive" }
                            ]}
                            value={o.isActive ? "Active" : "Inactive"}
                            onChange={() => handleStatusChangeClick && handleStatusChangeClick(o._id, o.isActive)}
                            triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors w-full ${o.isActive ? 'bg-green-50 text-success border-green-200 hover:bg-green-100' : 'bg-red-50 text-danger border-red-200 hover:bg-red-100'}`}
                        />
                    </div>
                } 
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
