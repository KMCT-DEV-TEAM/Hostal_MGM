import React from 'react';
import MobileList, { MobileRow } from '@/components/ui/MobileList';
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
    error
}) => {

    const renderBody = (warden) => (
        <>
            <MobileRow label="Id" value={(warden.wardenId || warden.id.substring(warden.id.length - 6)).toUpperCase()} />
            <MobileRow label="Email" value={warden.email || 'N/A'} />
            <MobileRow label="Phone" value={warden.phone || 'N/A'} />
            <MobileRow 
                label="Hostel" 
                value={
                    <div onClick={(e) => e.stopPropagation()} className="w-full">
                        <Dropdown
                            minWidth=""
                            options={[
                                { value: "Not Assigned", label: "Not Assigned" },
                                ...availableHostels.map(h => ({ value: h._id || h, label: h.name || h }))
                            ]}
                            value={warden.hostel?._id || warden.hostel || 'Not Assigned'}
                            onChange={(val) => handleHostelChange(warden.id, val)}
                            triggerClassName="px-3 py-1.5 text-xs font-regular text-start rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors w-full"
                        />
                    </div>
                } 
            />
            <MobileRow 
                label="Status" 
                value={
                    <div onClick={(e) => e.stopPropagation()} className="w-full">
                        <Dropdown
                            minWidth=""
                            options={[
                                { value: "Active", label: "Active" },
                                { value: "Inactive", label: "Inactive" }
                            ]}
                            value={warden.status}
                            onChange={() => handleStatusChangeClick(warden.id, warden.status)}
                            triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors w-full ${warden.status === 'Active' ? 'bg-green-50 text-success border-green-200 hover:bg-green-100' : 'bg-red-50 text-danger border-red-200 hover:bg-red-100'}`}
                        />
                    </div>
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