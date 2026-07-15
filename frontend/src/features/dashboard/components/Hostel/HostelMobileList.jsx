import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { Building2, Phone } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/useAuthStore';

const HostelMobileList = ({
    hostels,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedHostelDetail,
    setView,
    openEditHostelModal,
    handleStatusChangeClick,
    loading,
    error,
    ...rest
}) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();



    return (
        <MobileList
            items={hostels}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelectRow}
            isSelectableFn={(hostel) => user?.role === 'super_admin' || hostel.adminId?._id === user?._id || hostel.adminId?._id === user?.id || hostel.adminId === user?._id || hostel.adminId === user?.id}
            onEdit={openEditHostelModal}
            canSelect={true}
            canEdit={(hostel) => user?.role === 'super_admin' || hostel.adminId?._id === user?._id || hostel.adminId?._id === user?.id || hostel.adminId === user?._id || hostel.adminId === user?.id}
            emptyText={t('no_hostel_found')}
            iconFn={(hostel) => (
                <div className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase">
                    {hostel.name ? hostel.name.substring(0, 2) : 'NA'}
                </div>
            )}
            titleFn={(hostel) => hostel.name}
            subtitleFn={(hostel) => (
                <>
                    <Building2 className="w-3 h-3" />
                    <span className="capitalize">{hostel.hosteltype} | {hostel.capacity} capacity</span>
                </>
            )}
            rightTopFn={(hostel) => (
                <>
                    <Phone className="w-3 h-3" />
                    <span>{hostel.phone || 'N/A'}</span>
                </>
            )}
            statusBadgeFn={(hostel) => (
                <MobileCardStatusBadge
                    status={hostel.isActive ? 'Active' : 'Inactive'}
                    dotColorClass={hostel.isActive ? 'bg-green-500' : 'bg-red-500'}
                    bgColorClass={hostel.isActive ? 'bg-green-50' : 'bg-red-50'}
                    textColorClass={hostel.isActive ? 'text-green-600' : 'text-red-600'}
                />
            )}
            onViewDetails={(hostel) => {
                setSelectedHostelDetail(hostel);
                setView('detail');
            }}
        {...rest}
        />
    );
};

export default HostelMobileList;
