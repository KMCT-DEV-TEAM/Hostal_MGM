import React, { useState, useEffect } from 'react';
import { Pencil, Mail, Phone, Plus, Download, Building, GraduationCap } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import DataView from '@/components/ui/data-view/DataView';
import Dropdown from '@/components/ui/Dropdown';

import { ROLES } from '@/constants/roles';

export default function MentorTable({
    onSearch,
    onFilterChange,
    onExport,
    onAddClick,
    canCreate,
    mentors,
    loading,
    error,
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
    totalPages,
    searchQuery
}) {
    const { t } = useTranslation();

    const [statusFilter, setStatusFilter] = useState('');

    const statusOptions = [
        { label: 'All Status', value: '' },
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' }
    ];

    const columns = [
        {
            key: 'name',
            header: t('name'),
            type: "user",
            truncate: true,
            titleAccessor: (m) => m.name,
            avatarAccessor: (m) => m.name,
        },
        {
            key: 'email',
            header: t('email'),
            icon: Mail,
            accessor: (m) => m.email,
        },
        {
            key: 'phone',
            header: t('phone'),
            icon: Phone,
            accessor: (m) => m.phone,
        },
        {
            key: 'specialization',
            header: t('specialization') || "Specialization",
            icon: GraduationCap,
            accessor: (m) => m.specialization || "-",
        },
        ...(role === ROLES.SUPER_ADMIN ? [{
            key: 'organization',
            header: t('organization'),
            icon: Building,
            accessor: (m) => m.organization?.name || "N/A",
        }] : []),
        ...(canEdit ? [{
            key: 'status',
            header: t('status'),
            renderCell: (m) => {
                const isActive = m.isActive === true || m.isActive === 'true';
                return (
                    <div className="relative inline-block w-[105px]" onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                            minWidth=""
                            options={[
                                { value: "Active", label: "Active" },
                                { value: "Inactive", label: "Inactive" }
                            ]}
                            value={isActive ? 'Active' : 'Inactive'}
                            onChange={(val) => onStatusChangeRequest?.(m, val === 'Active')}
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
            renderCell: (m) => (
                <div className="flex text-primary items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onEdit && onEdit(m)} className="hover:text-secondary focus:outline-none transition-colors p-1 cursor-pointer">
                        <Pencil className="w-4 h-4 text-secondary" />
                    </button>
                </div>
            )
        }] : [])
    ];

    const cardConfig = {
        avatar: (m) => m.name?.split(' ').map(n => n[0]).join('').substring(0, 2),
        title: (m) => m.name || "-",
        subtitle: (m) => m.email || "-",
        status: (m) => {
            const isActive = m.isActive === true || m.isActive === 'true';
            return {
                text: isActive ? "Active" : "Inactive",
                color: isActive ? "green" : "red"
            };
        },
        fields: [
            { icon: GraduationCap, accessor: (m) => m.specialization || "No Specialization" },
            ...(role === ROLES.SUPER_ADMIN ? [{
                icon: Building, accessor: (m) => m.organization?.name || "N/A",
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
            <span className="">Add <span className='hidden md:inline'>Mentor </span></span>
        </button>
    );

    const toolbarEndSlot = (
        <>
            {canEdit && (
                <Dropdown
                    className=" "
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

            {onExport && (
                <button
                    onClick={onExport}
                    className="flex items-center justify-center lg:gap-2 p-2 lg:px-4 lg:py-2 bg-white border border-gray-100 lg:border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap h-full"
                >
                    <Download className="w-4 h-4 lg:hidden" />
                    <span className="hidden lg:inline">{t('export')}</span>
                </button>
            )}
        </>
    );

    return (
        <DataView
            data={mentors}
            columns={columns}
            cardConfig={cardConfig}
            loading={loading}
            error={error}
            pageScrollMode={true}
            searchPlaceholder="Search Mentors..."
            onSearchChange={(e) => onSearch?.(e.target.value)}
            searchQuery={searchQuery}
            toolbarEndSlot={toolbarEndSlot}
            onRowClick={onView}
            addButton={addNewButton}
            pagination={{
                page,
                limit,
                totalItems,
                totalPages,
                onPageChange: setPage,
                onLimitChange: setLimit
            }}
            emptyMessage={t('noMentorsFound') || "No Mentors Found"}
        />
    );
}
