import React from 'react';
import MobileList, { MobileRow } from '@/components/ui/MobileList';
import Dropdown from '@/components/ui/Dropdown';
import { useTranslation } from '@/hooks/useTranslation';

const StudentsMobileList = ({
    students,
    loading,
    error,
    canEdit,
    showOrganizationColumn = false,
    selectedIds,
    onSelectAll,
    onSelectRow,
    onViewClick,
    onEditClick,
    onStatusChange,
    statusLoadingIds = []
}) => {
    const { t } = useTranslation();

    const getHostelName = (hostel) => {
        if (!hostel || typeof hostel !== "object") return hostel || "-";
        return hostel.name ?? hostel.hostelName ?? "-";
    };

    const getOrganizationName = (organization, organizationId) => {
        if (!organization || typeof organization !== "object") return organizationId || "-";
        return organization.name ?? "-";
    };

    const renderBody = (s) => {
        const studentId = s._id ?? s.id;
        const isActive = Boolean(s.isActive);

        return (
            <>
                <MobileRow label="Admission No" value={s.studentId || '-'} />
                {showOrganizationColumn && (
                    <MobileRow label="Organization" value={getOrganizationName(s.organization, s.organizationId)} />
                )}
                <MobileRow label="Hostel" value={getHostelName(s.hostel)} />
                
                <MobileRow 
                    label={t('status') || "Status"} 
                    value={
                        canEdit ? (
                            <div onClick={(e) => e.stopPropagation()} className="w-full">
                                <Dropdown
                                    minWidth=""
                                    options={[
                                        { value: "Active", label: t('active') || "Active" },
                                        { value: "Inactive", label: t('inactive') || "Inactive" }
                                    ]}
                                    value={isActive ? "Active" : "Inactive"}
                                    onChange={() => onStatusChange?.(studentId)}
                                    triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors w-full ${isActive ? 'bg-green-50 text-success border-green-200 hover:bg-green-100' : 'bg-red-50 text-danger border-red-200 hover:bg-red-100'}`}
                                />
                            </div>
                        ) : (
                            <div className={`inline-flex items-center justify-center w-full px-3 py-1.5 text-xs font-regular border rounded-md ${isActive ? 'bg-green-50 text-success border-green-200' : 'bg-red-50 text-danger border-red-200'}`}>
                                {isActive ? t('active') || "Active" : t('inactive') || "Inactive"}
                            </div>
                        )
                    } 
                />
            </>
        );
    };

    return (
        <MobileList
            items={students}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={onSelectAll}
            onSelect={onSelectRow}
            onEdit={canEdit ? (s) => onEditClick?.(s) : undefined}
            canSelect={true}
            canEdit={canEdit}
            emptyText="No records found matching your search criteria."
            titleFn={(s) => s.name || "-"}
            renderBody={renderBody}
            onViewDetails={(s) => onViewClick?.(s)}
        />
    );
};

export default StudentsMobileList;
