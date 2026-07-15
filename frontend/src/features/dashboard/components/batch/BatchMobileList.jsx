import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { CalendarRange } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
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

    const renderBody = (o) => (
        <>
            <MobileRow label="Id" value={(o.batchId || o._id.substring(o._id.length - 6)).toUpperCase()} />
            <MobileRow label={t('batch_code')} value={o.code || 'N/A'} />
            <MobileRow label={t('department')} value={o.departmentId ? o.departmentId.name : 'N/A'} />
            <MobileRow label={t('num_students')} value={o.studentsCount || 0} />
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
            renderBody={renderBody}
            onViewDetails={(o) => {
                setSelectedBatchDetail(o);
                setView('detail');
            }}
        />
    );
};

export default BatchMobileList;
