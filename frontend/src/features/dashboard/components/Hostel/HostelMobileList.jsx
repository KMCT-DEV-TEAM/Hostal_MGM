import React from 'react';
import MobileList, { MobileRow, MobileStatusRow } from '@/components/ui/MobileList';
import { useTranslation } from '@/hooks/useTranslation';

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
    error
}) => {
    const { t } = useTranslation();

    const renderBody = (hostel) => (
        <>
            <MobileRow label={t('type')} value={<span className="capitalize">{hostel.hosteltype}</span>} />
            <MobileRow label={t('capacity')} value={hostel.capacity} />
            <MobileRow label="Students" value={hostel.studentsCount || 0} />
            <MobileRow label={t('phone')} value={hostel.phone || 'N/A'} />
            <MobileRow label={t('location')} value={hostel.location || 'N/A'} />
            <MobileStatusRow 
                isActive={hostel.isActive} 
                onClick={(e) => {
                    e.stopPropagation();
                    if (handleStatusChangeClick) handleStatusChangeClick(hostel._id, hostel.isActive);
                }} 
            />
        </>
    );

    return (
        <MobileList
            items={hostels}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelectRow}
            onEdit={openEditHostelModal}
            canSelect={true}
            canEdit={true}
            emptyText={t('no_hostel_found')}
            titleFn={(hostel) => hostel.name}
            renderBody={renderBody}
            onViewDetails={(hostel) => {
                setSelectedHostelDetail(hostel);
                setView('detail');
            }}
        />
    );
};

export default HostelMobileList;
