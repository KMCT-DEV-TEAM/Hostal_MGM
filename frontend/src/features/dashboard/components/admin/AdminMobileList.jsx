import React from 'react';
import MobileList, { MobileRow, MobileStatusRow } from '@/components/ui/MobileList';

const AdminMobileList = ({
    paginatedAdmins,
    organizations = [],
    openEditAdminModal,
    setSelectedAdminDetail,
    setView,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    handleOrganizationChange,
    handleStatusChangeClick,
    loading,
    error
}) => {

    const renderBody = (admin) => (
        <>
            <MobileRow label="Email" value={admin.email || 'N/A'} />
            <MobileRow label="Phone" value={admin.phone || 'N/A'} />
            <MobileRow 
                label="Organization" 
                value={
                    <select
                        value={admin.organization?._id || admin.organization || ""}
                        onChange={(e) => handleOrganizationChange(admin._id, e.target.value)}
                        className="bg-transparent text-text-secondary outline-none w-full cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="" disabled>Select Organization</option>
                        {organizations.map(org => (
                            <option key={org._id} value={org._id}>{org.name}</option>
                        ))}
                    </select>
                } 
            />
            <MobileStatusRow 
                isActive={admin.isActive} 
                onClick={(e) => {
                    e.stopPropagation();
                    if (handleStatusChangeClick) handleStatusChangeClick(admin._id, admin.isActive ? "Active" : "Inactive");
                }} 
            />
        </>
    );

    return (
        <MobileList
            items={paginatedAdmins}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelectRow}
            onEdit={openEditAdminModal}
            canSelect={true}
            canEdit={true}
            emptyText="No administrators match the selected filter."
            titleFn={(admin) => admin.name}
            renderBody={renderBody}
            onViewDetails={(admin) => {
                setSelectedAdminDetail(admin);
                setView('detail');
            }}
        />
    );
};

export default AdminMobileList;