import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { UserCheck, Mail, Phone } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';

const WardenMobileList = ({
    paginatedWardens,
    availableHostels,
    openEditWardenModal,
    setSelectedWardenDetail,
    setView,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    handleHostelChange,
    handleStatusChangeClick,
    loading,
    error,
    ...rest
}) => {
    return (
        <MobileList
            {...rest}
            items={paginatedWardens}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelectRow}
            onEdit={openEditWardenModal}
            canSelect={true}
            canEdit={true}
            emptyText="No wardens match the selected filter."
            iconFn={(warden) => (
                <div className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase">
                    {warden.name ? warden.name.substring(0, 2) : 'NA'}
                </div>
            )}
            titleFn={(warden) => warden.name}
            subtitleFn={(warden) => (
                <>
                    <Mail className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{warden.email || 'N/A'}</span>
                </>
            )}
            rightTopFn={(warden) => (
                <>
                    <Phone className="w-3 h-3" />
                    <span>{warden.phone || 'N/A'}</span>
                </>
            )}
            statusBadgeFn={(warden) => (
                <MobileCardStatusBadge
                    status={warden.status}
                    dotColorClass={warden.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}
                    bgColorClass={warden.status === 'Active' ? 'bg-green-50' : 'bg-red-50'}
                    textColorClass={warden.status === 'Active' ? 'text-green-600' : 'text-red-600'}
                />
            )}
            onViewDetails={(warden) => {
                setSelectedWardenDetail(warden);
                setView('detail');
            }}
        />
    );
};

export default WardenMobileList;