import React from 'react';
import MobileList, { MobileRow, MobileCardStatusBadge } from '@/components/ui/MobileList';
import { Shield } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';

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
                    <div onClick={(e) => e.stopPropagation()} className="w-full">
                        <Dropdown
                            minWidth=""
                            options={[
                                { value: "", label: "Select Organization" },
                                ...organizations.map(org => ({ value: org._id, label: org.name }))
                            ]}
                            value={admin.organization?._id || admin.organization || ""}
                            onChange={(val) => handleOrganizationChange(admin._id, val)}
                            placeholder="Select Organization"
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
                            value={admin.isActive ? "Active" : "Inactive"}
                            onChange={() => handleStatusChangeClick(admin._id, admin.isActive ? "Active" : "Inactive")}
                            triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors w-full ${admin.isActive ? 'bg-green-50 text-success border-green-200 hover:bg-green-100' : 'bg-red-50 text-danger border-red-200 hover:bg-red-100'}`}
                        />
                    </div>
                } 
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
            iconFn={(admin) => (
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-indigo-500" />
                </div>
            )}
            titleFn={(admin) => admin.name}
            subtitleFn={(admin) => admin.email}
            rightTopFn={(admin) => admin.phone || 'N/A'}
            statusBadgeFn={(admin) => (
                <MobileCardStatusBadge
                    status={admin.isActive ? 'Active' : 'Inactive'}
                    dotColorClass={admin.isActive ? 'bg-green-500' : 'bg-red-500'}
                    bgColorClass={admin.isActive ? 'bg-green-50' : 'bg-red-50'}
                    textColorClass={admin.isActive ? 'text-green-600' : 'text-red-600'}
                />
            )}
            renderBody={renderBody}
            onViewDetails={(admin) => {
                setSelectedAdminDetail(admin);
                setView('detail');
            }}
        />
    );
};

export default AdminMobileList;