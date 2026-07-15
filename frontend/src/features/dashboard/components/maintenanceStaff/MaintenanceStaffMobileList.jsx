import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { Wrench, Phone } from 'lucide-react';
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
    handleStatusChangeClick,
    ...rest
}) => {
    const { t } = useTranslation();


    return (
        <MobileList
            items={paginatedStaff}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelectRow}
            onEdit={(staff) =
            {...rest}> openEditStaffModal(staff)}
            canSelect={true}
            canEdit={true}
            emptyText={t('no_records_found')}
            iconFn={(staff) => (
                <div className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase">
                    {staff.name ? staff.name.substring(0, 2) : 'NA'}
                </div>
            )}
            titleFn={(staff) => staff.name}
            subtitleFn={(staff) => (
                <>
                    <Wrench className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{staff.specialization || 'Maintenance Staff'}</span>
                </>
            )}
            rightTopFn={(staff) => (
                <>
                    <Phone className="w-3 h-3" />
                    <span>{staff.phone || 'N/A'}</span>
                </>
            )}
            statusBadgeFn={(staff) => (
                <MobileCardStatusBadge
                    status={staff.isActive ? "Active" : "Inactive"}
                    dotColorClass={staff.isActive ? 'bg-green-500' : 'bg-red-500'}
                    bgColorClass={staff.isActive ? 'bg-green-50' : 'bg-red-50'}
                    textColorClass={staff.isActive ? 'text-green-600' : 'text-red-600'}
                />
            )}
            onViewDetails={(staff) => {
                setSelectedStaffDetail(staff);
                setView('detail');
            }}
            {...rest}
        />
    );
};

export default MaintenanceStaffMobileList;
