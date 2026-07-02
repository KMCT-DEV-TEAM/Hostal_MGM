import React from 'react';
import MobileList, { MobileRow, MobileStatusRow } from '@/components/ui/MobileList';
import { useTranslation } from '@/hooks/useTranslation';

const MaintenanceStaffMobileList = ({
    paginatedStaff,
    loading,
    error,
    openEditStaffModal,
    setSelectedStaffDetail,
    setView,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    handleStatusChangeClick
}) => {
    const { t } = useTranslation();

    const renderBody = (staff) => (
        <>
            <MobileRow label="Id" value={(staff.staffId || staff._id.substring(staff._id.length - 6)).toUpperCase()} />
            <MobileRow label={t('phone')} value={staff.phone || 'N/A'} />
            <MobileRow label={t('specialization')} value={staff.specialization || 'N/A'} />
            <MobileRow label="Tasks" value={<span className="text-gray-500 text-[11px]">A: {staff.taskAssignedCount || 0} | R: {staff.taskResolvedCount || 0} | P: {staff.taskPendingCount || 0}</span>} />
            <MobileStatusRow 
                isActive={staff.isActive} 
                onClick={(e) => {
                    e.stopPropagation();
                    if (handleStatusChangeClick) handleStatusChangeClick(staff._id, staff.isActive ? "Active" : "Inactive");
                }} 
            />
        </>
    );

    return (
        <MobileList
            items={paginatedStaff}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelectRow}
            onEdit={(staff) => openEditStaffModal(staff)}
            canSelect={true}
            canEdit={true}
            emptyText={t('no_records_found')}
            titleFn={(staff) => staff.name}
            renderBody={renderBody}
            onViewDetails={(staff) => {
                setSelectedStaffDetail(staff);
                setView('detail');
            }}
        />
    );
};

export default MaintenanceStaffMobileList;
