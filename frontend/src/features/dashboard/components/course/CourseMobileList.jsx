import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { BookOpen } from 'lucide-react';
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
            iconFn={(o) => (
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-orange-500" />
                </div>
            )}
            titleFn={(o) => o.name}
            subtitleFn={(o) => o.code || 'Course'}
            rightTopFn={(o) => o.batchesCount ? `${o.batchesCount} Batches` : null}
            statusBadgeFn={(o) => (
                <MobileCardStatusBadge
                    status={o.isActive ? "Active" : "Inactive"}
                    dotColorClass={o.isActive ? 'bg-green-500' : 'bg-red-500'}
                    bgColorClass={o.isActive ? 'bg-green-50' : 'bg-red-50'}
                    textColorClass={o.isActive ? 'text-green-600' : 'text-red-600'}
                />
            )}
            renderBody={renderBody}
            onViewDetails={(o) => {
                setSelectedCourseDetail(o);
                setView('detail');
            }}
        />
    );
};

export default CourseMobileList;
