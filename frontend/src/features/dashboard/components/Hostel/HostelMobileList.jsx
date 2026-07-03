import React from 'react';
import MobileList, { MobileRow } from '@/components/ui/MobileList';
import Dropdown from '@/components/ui/Dropdown';
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
                            value={hostel.isActive ? "Active" : "Inactive"}
                            onChange={() => handleStatusChangeClick(hostel._id, hostel.isActive)}
                            triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors w-full ${hostel.isActive ? 'bg-green-50 text-success border-green-200 hover:bg-green-100' : 'bg-red-50 text-danger border-red-200 hover:bg-red-100'}`}
                        />
                    </div>
                } 
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
