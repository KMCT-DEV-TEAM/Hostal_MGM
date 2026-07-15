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
    handleStatusChangeClick,
    ...rest
}) => {
    const { t } = useTranslation();

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
                <div className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase">
                    {o.name ? o.name.substring(0, 2) : 'NA'}
                </div>
            )}
            titleFn={(o) => o.name}
            subtitleFn={(o) => (
                <>
                    <span className="font-semibold text-gray-500">Code:</span>
                    <span>{o.code || 'N/A'}</span>
                </>
            )}
            rightTopFn={(o) => o.batchesCount ? (
                <>
                    <span className="font-semibold text-gray-500">Batches:</span>
                    <span>{o.batchesCount}</span>
                </>
            ) : null}
            statusBadgeFn={(o) => (
                <MobileCardStatusBadge
                    status={o.isActive ? "Active" : "Inactive"}
                    dotColorClass={o.isActive ? 'bg-green-500' : 'bg-red-500'}
                    bgColorClass={o.isActive ? 'bg-green-50' : 'bg-red-50'}
                    textColorClass={o.isActive ? 'text-green-600' : 'text-red-600'}
                />
            )}
            onViewDetails={(o) => {
                setSelectedCourseDetail(o);
                setView('detail');
            }}
            {...rest}
        />
    );
};

export default CourseMobileList;
