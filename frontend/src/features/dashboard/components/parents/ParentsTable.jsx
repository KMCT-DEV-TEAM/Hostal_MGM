import React, { useState, useEffect } from 'react';
import { Pencil, Mail, Phone } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import DataTable from '@/components/ui/DataTable';
import InfoCard from '@/components/ui/InfoCard';
import Dropdown from '@/components/ui/Dropdown';
import { useDebounce } from '@/hooks/useDebounce';
import { ROLES } from '@/constants/roles';

export default function ParentsTable({
    onSearch,
    onFilterChange,
    onExport,
    canCreate,
    organizations = [],
    parents,
    loading,
    error,
    selectedIds,
    onSelectAll,
    onSelect,
    onStatusChangeRequest,
    onEdit,
    onView,
    canEdit,
    canDelete,
    statusLoadingIds = [],
    role
}) {
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 400);
    const [statusFilter, setStatusFilter] = useState('');
    const [organizationFilter, setOrganizationFilter] = useState('');

    useEffect(() => {
        onSearch?.(debouncedSearchTerm);
    }, [debouncedSearchTerm, onSearch]);

    const headers = [
        t('name'),
        t('email'),
        t('phone'),
        t('student'),
        ...(role === ROLES.SUPER_ADMIN || role === ROLES.WARDEN ? [t('organization')] : []),
        ...(canEdit ? [t('status')] : []),
        ...(canEdit ? [{ label: t('action'), align: 'center' }] : [])
    ];

    const statusOptions = [
        { label: 'All Status', value: '' },
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' }
    ];

    const organizationOptions = [
        { label: 'All Organizations', value: '' },
        ...organizations.map(org => ({ label: org.name, value: org._id }))
    ];

    const toolbarActions = (
        <div className="flex w-full sm:w-auto gap-3">
            {canEdit && (
                <Dropdown
                    className="flex-1 sm:flex-none"
                    options={statusOptions}
                    value={statusFilter}
                    onChange={(val) => {
                        setStatusFilter(val);
                        onFilterChange?.(
                            'isActive',
                            val === 'Active' ? 'true' : val === 'Inactive' ? 'false' : ''
                        );
                    }}
                    placeholder="All Status"
                    minWidth="w-32"
                    triggerClassName="w-full appearance-none bg-white border border-gray-100 md:border-gray-200 rounded-lg px-3 py-2 text-sm text-[#777777] font-medium"
                />
            )}
            {role === ROLES.SUPER_ADMIN && (
                <Dropdown
                    className="flex-1 sm:flex-none"
                    options={organizationOptions}
                    value={organizationFilter}
                    onChange={(val) => {
                        setOrganizationFilter(val);
                        onFilterChange?.('organizationId', val);
                    }}
                    placeholder="All Organizations"
                    minWidth="w-40"
                    triggerClassName="w-full appearance-none bg-white border border-gray-100 md:border-gray-200 rounded-lg px-3 py-2 text-sm text-[#777777] font-medium"
                />
            )}
        </div>
    );

    const renderMobileItem = (p) => {
        const isActive = p.isActive === true || p.isActive === 'true';
        return (
            <div className="">
                <InfoCard
                    avatar={p.parentName}
                    title={p.parentName || "-"}
                    subtitle={p.email || "-"}
                    onClick={() => onView && onView(p)}
                    status={{ text: isActive ? "Active" : "Inactive", color: isActive ? "green" : "red" }}
                    fields={[
                        { label: "Phone", value: p.phone || "-" },
                        { label: "Student", value: p.student?.name || "No Student" },
                        (role === ROLES.SUPER_ADMIN || role === ROLES.WARDEN) && { label: "Organization", value: p.organization?.name || "N/A" }
                    ].filter(Boolean)}
                    editable={canEdit}
                    onEdit={() => onEdit && onEdit(p)}
                />
            </div>
        );
    };

    return (
        <DataTable
            searchQuery={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            searchPlaceholder="Search Parents..."
            onExport={onExport}
            toolbarActions={toolbarActions}
            headers={headers}
            items={parents}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={onSelectAll}
            onSelect={onSelect}
            canSelect={canEdit || canDelete}
            statusLoadingIds={statusLoadingIds}
            emptyText="No parents match the selected filter."
            onRowClick={onView}
            renderMobileItem={renderMobileItem}
            renderRow={(p) => (
                <>
                    <td
                        className="p-4 flex items-center gap-3 font-medium text-text-secondary"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                            {p.parentName?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <span className="truncate max-w-[150px]">{p.parentName}</span>
                    </td>
                    <td className="p-4 text-text-secondary"><Mail className="w-3 h-3 inline mr-2 text-gray-400" />{p.email}</td>
                    <td className="p-4 text-text-secondary whitespace-nowrap"><Phone className="w-3 h-3 inline mr-2 text-gray-400" />{p.phone}</td>
                    <td className="p-4 text-text-secondary font-medium">{p.student?.name ?? "No Student"}</td>
                    {(role === ROLES.SUPER_ADMIN || role === ROLES.WARDEN) && (
                        <td className="p-4 text-text-secondary font-medium">{p.organization?.name || "N/A"}</td>
                    )}
                    {canEdit && (
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-block w-[105px]">
                                <Dropdown
                                    minWidth=""
                                    options={[
                                        { value: "Active", label: "Active" },
                                        { value: "Inactive", label: "Inactive" }
                                    ]}
                                    value={(p.isActive === true || p.isActive === 'true') ? 'Active' : 'Inactive'}
                                    onChange={(val) =>
                                        onStatusChangeRequest?.(
                                            p,
                                            val === 'Active'
                                        )
                                    }
                                    triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${(p.isActive === true || p.isActive === 'true')
                                            ? 'bg-green-50 text-success border-green-200 hover:bg-green-100'
                                            : 'bg-red-50 text-danger border-red-200 hover:bg-red-100'
                                        }`}
                                />
                            </div>
                        </td>
                    )}
                    {canEdit && (
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex text-primary items-center justify-center">
                                <button onClick={() => onEdit && onEdit(p)} className="hover:text-secondary focus:outline-none transition-colors p-1 cursor-pointer">
                                    <Pencil className="w-4 h-4 text-secondary" />
                                </button>
                            </div>
                        </td>
                    )}
                </>
            )}
        />
    );
}
