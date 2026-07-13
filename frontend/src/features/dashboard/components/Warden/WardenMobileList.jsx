import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { UserCheck } from 'lucide-react';
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
                    <div onClick={(e) => e.stopPropagation()} className="w-full text-right">
                        <Dropdown
                            minWidth=""
                            options={[
                                { value: "Not Assigned", label: "Not Assigned" },
                                ...availableHostels.map(h => ({ value: h._id || h, label: h.name || h }))
                            ]}
                            value={warden.hostel?._id || warden.hostel || 'Not Assigned'}
                            onChange={(val) => handleHostelChange(warden.id, val)}
                            triggerClassName="px-2 py-1 text-xs font-regular text-right rounded-md bg-gray-50 border border-gray-100 text-gray-700 hover:border-gray-200 transition-colors inline-block"
                        />
                    </div>
                } 
            />
            <MobileRow 
                label="Status" 
                value={
                    <div onClick={(e) => e.stopPropagation()} className="w-full text-right">
                        <Dropdown
                            minWidth=""
                            options={[
                                { value: "Active", label: "Active" },
                                { value: "Inactive", label: "Inactive" }
                            ]}
                            value={warden.status}
                            onChange={() => handleStatusChangeClick(warden.id, warden.status)}
                            triggerClassName={`px-2 py-1 text-[10px] font-medium border transition-colors inline-flex items-center gap-1 rounded-md ${warden.status === 'Active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}
                            triggerContent={
                                <>
                                    <div className={`w-1.5 h-1.5 rounded-full ${warden.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    {warden.status}
                                </>
                            }
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
            iconFn={(warden) => (
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-blue-500" />
                </div>
            )}
            titleFn={(warden) => warden.name}
            subtitleFn={(warden) => warden.email}
            rightTopFn={(warden) => warden.phone || 'N/A'}
            statusBadgeFn={(warden) => (
                <MobileCardStatusBadge
                    status={warden.status}
                    dotColorClass={warden.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}
                    bgColorClass={warden.status === 'Active' ? 'bg-green-50' : 'bg-red-50'}
                    textColorClass={warden.status === 'Active' ? 'text-green-600' : 'text-red-600'}
                />
            )}
            renderBody={renderBody}
            onViewDetails={(warden) => {
                setSelectedWardenDetail(warden);
                setView('detail');
            }}
        />
    );
};

export default WardenMobileList;