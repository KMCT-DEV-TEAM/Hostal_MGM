import React from 'react';
import MobileList, { MobileCardStatusBadge } from '@/components/ui/MobileList';
import { CalendarRange } from 'lucide-react';

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
    openModal,
    ...rest
}) => {
    const { t } = useTranslation();

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
            iconFn={(o) => (
                <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center">
                    <CalendarRange className="w-5 h-5 text-pink-500" />
                </div>
            )}
            titleFn={(o) => o.name}
            subtitleFn={(o) => o.departmentId ? o.departmentId.name : 'N/A'}
            rightTopFn={(o) => o.code || 'N/A'}
            statusBadgeFn={(o) => (
                <MobileCardStatusBadge
                    status={o.isActive ? "Active" : "Inactive"}
                    dotColorClass={o.isActive ? 'bg-green-500' : 'bg-red-500'}
                    bgColorClass={o.isActive ? 'bg-green-50' : 'bg-red-50'}
                    textColorClass={o.isActive ? 'text-green-600' : 'text-red-600'}
                />
            )}

            onViewDetails={(o) => {
                setSelectedBatchDetail(o);
                setView('detail');
            }}
            {...rest}
        />
    );
};

export default BatchMobileList;
