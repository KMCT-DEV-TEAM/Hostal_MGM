import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { Wrench } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
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
            <MobileRow 
                label={t('status')} 
                value={
                    <div onClick={(e) => e.stopPropagation()} className="w-full">
                        <Dropdown
                            minWidth=""
                            options={[
                                { value: "Active", label: t('active') },
                                { value: "Inactive", label: t('inactive') }
                            ]}
                            value={staff.isActive ? "Active" : "Inactive"}
                            onChange={() => handleStatusChangeClick && handleStatusChangeClick(staff._id, staff.isActive ? "Active" : "Inactive")}
                            triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors w-full ${staff.isActive ? 'bg-green-50 text-success border-green-200 hover:bg-green-100' : 'bg-red-50 text-danger border-red-200 hover:bg-red-100'}`}
                        />
                    </div>
                } 
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
            iconFn={(staff) => (
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-slate-500" />
                </div>
            )}
            titleFn={(staff) => staff.name}
            subtitleFn={(staff) => staff.specialization || 'Maintenance Staff'}
            rightTopFn={(staff) => staff.phone || 'N/A'}
            statusBadgeFn={(staff) => (
                <MobileCardStatusBadge
                    status={staff.isActive ? "Active" : "Inactive"}
                    dotColorClass={staff.isActive ? 'bg-green-500' : 'bg-red-500'}
                    bgColorClass={staff.isActive ? 'bg-green-50' : 'bg-red-50'}
                    textColorClass={staff.isActive ? 'text-green-600' : 'text-red-600'}
                />
            )}
            renderBody={renderBody}
            onViewDetails={(staff) => {
                setSelectedStaffDetail(staff);
                setView('detail');
            }}
        />
    );
};

export default MaintenanceStaffMobileList;
