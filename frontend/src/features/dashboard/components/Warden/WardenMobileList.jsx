import React from 'react';
import MobileList, { MobileRow, MobileStatusRow } from '@/components/ui/MobileList';

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
    error
}) => {

    const renderBody = (warden) => (
        <>
            <MobileRow label="Id" value={(warden.wardenId || warden.id.substring(warden.id.length - 6)).toUpperCase()} />
            <MobileRow label="Email" value={warden.email || 'N/A'} />
            <MobileRow label="Phone" value={warden.phone || 'N/A'} />
            <MobileStatusRow 
                isActive={warden.status === 'Active'} 
                onClick={(e) => {
                    e.stopPropagation();
                    if (handleStatusChangeClick) handleStatusChangeClick(warden.id, warden.status);
                }} 
            />
            <MobileRow 
                label="Hostel" 
                value={
                    <select
                        value={warden.hostel?._id || warden.hostel || 'Not Assigned'}
                        onChange={(e) => handleHostelChange(warden.id, e.target.value)}
                        className="bg-transparent text-text-secondary outline-none w-full cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="Not Assigned">Not Assigned</option>
                        {availableHostels.map(h => (
                            <option key={h._id || h} value={h._id || h}>{h.name || h}</option>
                        ))}
                    </select>
                } 
            />
        </>
    );

    return (
        <MobileList
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
            titleFn={(warden) => warden.name}
            renderBody={renderBody}
            onViewDetails={(warden) => {
                setSelectedWardenDetail(warden);
                setView('detail');
            }}
        />
    );
};

export default WardenMobileList;