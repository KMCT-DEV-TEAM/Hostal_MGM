import React from 'react';
import MobileList, { MobileCardStatusBadge } from '@/components/ui/MobileList';
import { Network, Hash } from 'lucide-react';

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
                <div className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase">
                    {o.name ? o.name.substring(0, 2) : 'NA'}
                </div>
            )}
            titleFn={(o) => o.name}
            subtitleFn={(o) => (
                <>
                    <Network className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{o.departmentId ? o.departmentId.name : 'N/A'}</span>
                </>
            )}
            rightTopFn={(o) => (
                <>
                    <Hash className="w-3 h-3 text-gray-400" />
                    <span className="truncate max-w-[80px]">{o.code || 'N/A'}</span>
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
                setSelectedBatchDetail(o);
                setView('detail');
            }}
            {...rest}
        />
    );
};

export default BatchMobileList;
