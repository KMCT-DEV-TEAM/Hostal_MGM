import React, { useState, useEffect } from 'react';
import { Pencil, Mail, Phone, Plus, Download, icons, Users, Building, MoreVertical, Filter } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import DataView from '@/components/ui/data-view/DataView';
import Dropdown from '@/components/ui/Dropdown';
import { useDebounce } from '@/hooks/useDebounce';
import { ROLES } from '@/constants/roles';

export default function ParentsTable({
    onSearch,
    onFilterChange,
    onExport,
    onAddClick,
    canCreate,
    organizations = [],
    parents,
    loading,
    error,
    selectedIds = [],
    onSelectAll,
    onSelect,
    onActivateSelected,
    onDeactivateSelected,
    onStatusChangeRequest,
    onEdit,
    onView,
    canEdit,
    canDelete,
    statusLoadingIds = [],
    role,
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    totalPages
}) {
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 400);
    const [statusFilter, setStatusFilter] = useState('');
    const [organizationFilter, setOrganizationFilter] = useState('');
    const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);

    useEffect(() => {
        onSearch?.(debouncedSearchTerm);
    }, [debouncedSearchTerm, onSearch]);

    const statusOptions = [
        { label: 'All Status', value: '' },
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' }
    ];

    const organizationOptions = [
        { label: 'All Organizations', value: '' },
        ...organizations.map(org => ({ label: org.name, value: org._id }))
    ];

    const columns = [
        {
            key: 'parentName',
            header: t('name'),
            type: "user",
            truncate: true,
            titleAccessor: (p) => p.parentName,
            avatarAccessor: (p) => p.parentName,
        },
        {
            key: 'email',
            header: t('email'),
            icon: Mail,
            accessor: (p) => p.email,
        },
        {
            key: 'phone',
            header: t('phone'),
            icon: Phone,
            accessor: (p) => p.phone,
        },
        {
            key: 'student',
            header: t('student'),
            icon: Users,
            accessor: (p) => p.student?.name || p.student || "-",
        },
        ...(role === ROLES.SUPER_ADMIN || role === ROLES.WARDEN ? [{
            key: 'organization',
            header: t('organization'),
            icon: Building,
            accessor: (p) => p.organization?.name || "N/A",
        }] : []),
        ...(canEdit ? [{
            key: 'status',
            header: t('status'),
            renderCell: (p) => {
                const isActive = p.isActive === true || p.isActive === 'true';
                return (
                    <div className="relative inline-block w-[105px]" onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                            minWidth=""
                            options={[
                                { value: "Active", label: "Active" },
                                { value: "Inactive", label: "Inactive" }
                            ]}
                            value={isActive ? 'Active' : 'Inactive'}
                            onChange={(val) => onStatusChangeRequest?.(p, val === 'Active')}
                            triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${isActive
                                ? 'bg-green-50 text-success border-green-200 hover:bg-green-100'
                                : 'bg-red-50 text-danger border-red-200 hover:bg-red-100'
                                }`}
                        />
                    </div>
                );
            }
        }] : []),
        ...(canEdit ? [{
            key: 'action',
            header: t('action'),
            align: 'center',
            renderCell: (p) => (
                <div className="flex text-primary items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onEdit && onEdit(p)} className="hover:text-secondary focus:outline-none transition-colors p-1 cursor-pointer">
                        <Pencil className="w-4 h-4 text-secondary" />
                    </button>
                </div>
            )
        }] : [])
    ];

    const cardConfig = {
        avatar: (p) => p.parentName?.split(' ').map(n => n[0]).join('').substring(0, 2),
        title: (p) => p.parentName || "-",
        subtitle: (p) => p.email || "-",
        status: (p) => {
            const isActive = p.isActive === true || p.isActive === 'true';
            return {
                text: isActive ? "Active" : "Inactive",
                color: isActive ? "green" : "red"
            };
        },
        fields: [
            { icon: Users, accessor: (p) => p.student?.name || "No Student" },
            ...(role === ROLES.SUPER_ADMIN || role === ROLES.WARDEN ? [{
                icon: Building, accessor: (p) => p.organization?.name || "N/A",
            }] : [])
        ],
        onEdit: canEdit ? onEdit : undefined
    };

    const addNewButton = canCreate && (
        <button
            onClick={onAddClick}
            className="flex items-center justify-center gap-2 px-3 py-1 sm:px-4  bg-[#0A437A] hover:bg-[#0A437A]/90 text-white rounded-lg transition-colors font-medium text-sm shadow-sm py-2"
        >
            <Plus className="w-4 h-4" />
            <span className="">Add <span className='hidden md:inline'>Parent </span></span>
        </button>
    );

    const toolbarEndSlot = (
        <>
            {canEdit && (
                <Dropdown
                    className="flex-1 "
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
                    triggerClassName="w-full px-3 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm text-[#777777] font-medium shadow-sm md:shadow-none focus:border-[#0A437A] cursor-pointer h-full"
                />
            )}
            {role === ROLES.SUPER_ADMIN && (
                <Dropdown
                    className="flex-1 "
                    options={organizationOptions}
                    value={organizationFilter}
                    onChange={(val) => {
                        setOrganizationFilter(val);
                        onFilterChange?.('organizationId', val);
                    }}
                    placeholder="All Organizations"
                    minWidth="w-40"
                    triggerClassName="w-full px-3 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm text-[#777777] font-medium shadow-sm md:shadow-none focus:border-[#0A437A] cursor-pointer h-full"
                />
            )}

            {onExport && (
                <button
                    onClick={onExport}
                    className="flex items-center justify-center lg:gap-2 p-2 lg:px-4 lg:py-2 bg-white border border-gray-100 lg:border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap h-full"
                >
                    <Download className="w-4 h-4 text-gray-500 lg:text-inherit" />
                    <span className="hidden lg:inline">Export</span>
                </button>
            )}

            {(canEdit || canDelete) && (
                <div className="relative">
                    <button
                        onClick={() => setIsBulkMenuOpen(!isBulkMenuOpen)}
                        className="flex items-center justify-center p-2 bg-white border border-gray-100 lg:border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer h-full"
                    >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    {isBulkMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-[100] py-1 overflow-hidden">
                            {canEdit && (
                                <button
                                    onClick={() => { setIsBulkMenuOpen(false); onActivateSelected?.(); }}
                                    disabled={selectedIds.length === 0}
                                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Active {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={() => { setIsBulkMenuOpen(false); onDeactivateSelected?.(); }}
                                    disabled={selectedIds.length === 0}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Inactive {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );

    return (
        <DataView
            addButton={addNewButton}
            pageScrollMode={true}
            data={parents}
            columns={columns}
            cardConfig={cardConfig}
            searchQuery={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            searchPlaceholder="Search Parents..."
            toolbarEndSlot={toolbarEndSlot}
            onRowClick={onView}
            selectedIds={selectedIds}
            onSelectAll={onSelectAll}
            onSelectRow={onSelect}
            canSelect={canEdit || canDelete}
            loading={loading}
            error={error}
            emptyText="No parents match the selected filter."
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
            totalItems={totalItems}
            totalPages={totalPages}
            className="flex-1 h-full border-none shadow-none"
        />
    );
}
