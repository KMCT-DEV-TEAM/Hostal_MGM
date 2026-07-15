import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { Network } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
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
    handleStatusChangeClick,
    ...rest
}) => {
    const { t } = useTranslation();


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
            iconFn={(o) => (
                <div className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase">
                    {o.name ? o.name.substring(0, 2) : 'NA'}
                </div>
            )}
            titleFn={(o) => o.name}
            subtitleFn={(o) => (
                <>
                    <Network className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{o.courseId ? o.courseId.name : 'Department'}</span>
                </>
            )}
            rightTopFn={(o) => (
                <>
                    <span className="font-semibold text-gray-500">Code:</span>
                    <span>{o.code || 'N/A'}</span>
                </>
            )}
            statusBadgeFn={(o) => (
                <MobileCardStatusBadge
                    status={o.isActive ? "Active" : "Inactive"}
                    dotColorClass={o.isActive ? 'bg-green-500' : 'bg-red-500'}
                    bgColorClass={o.isActive ? 'bg-green-50' : 'bg-red-50'}
                    textColorClass={o.isActive ? 'text-green-600' : 'text-red-600'}
                />
            )}
            onViewDetails={(o) => {
                setSelectedDepartmentDetail(o);
                setView('detail');
            }}
            {...rest}
        />
    );
};

export default DepartmentMobileList;
