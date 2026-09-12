import React, { useState, useEffect } from 'react';
import { Building, Users, Plus, Download } from 'lucide-react';
import DataView from '@/components/ui/data-view/DataView';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';


export default function MentorOrganizationsTable({
    onSearch,
    onFilterChange,
    onAddClick,
    onExport,
    organizations,
    loading,
    error,
    onView,
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    totalPages,
    searchQuery,
    allOrganizations = [],
    selectedOrgId = '',
    selectedStatus = ''
}) {
    const role = useAuthStore((s) => s.user?.role);
    const isSuperAdmin = role?.toLowerCase() === 'super_admin';
    const canCreate = isSuperAdmin;

    const statusOptions = [
        { label: 'All Status', value: '' },
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' }
    ];

    const columns = [
        {
            key: 'name',
            header: 'Organization Name',
            type: "user",
            truncate: true,
            titleAccessor: (o) => o.name,
            avatarAccessor: (o) => o.name,
        },
        {
            key: 'code',
            header: 'Code',
            icon: Building,
            accessor: (o) => o.code || "-",
        },
        {
            key: 'email',
            header: 'Email',
            accessor: (o) => o.email || "-",
        },
        {
            key: 'mentorCount',
            header: 'Mentors',
            icon: Users,
            accessor: (o) => o.mentorCount || 0,
        }
    ];

    const cardConfig = {
        avatar: (o) => o.name?.split(' ').map(n => n[0]).join('').substring(0, 2),
        title: (o) => o.name || "-",
        subtitle: (o) => o.code || "-",
        status: (o) => ({
            text: `${o.mentorCount || 0} Mentors`,
            color: "blue"
        }),
        fields: [
            { icon: Building, accessor: (o) => o.email || "No Email" }
        ],
        onEdit: undefined
    };

    const addNewButton = canCreate && (
        <Button
            size="sm"
            onClick={onAddClick}
            className="flex items-center justify-center gap-2"
        >
            <Plus className="w-4 h-4" />
            <span className="">Add <span className='hidden md:inline'>Mentor </span></span>
        </Button>
    );

    const toolbarEndSlot = (
        <>
            {/* {isSuperAdmin && allOrganizations.length > 0 && (
                <Dropdown
                    options={[
                        { label: 'All Organizations', value: '' },
                        ...allOrganizations.map((org) => ({ label: org.name, value: org.id }))
                    ]}
                    value={selectedOrgId}
                    onChange={(val) => onFilterChange?.('organizationId', val)}
                    placeholder="All Organizations"
                    minWidth="w-44"
                    triggerClassName="w-full px-3 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm text-[#777777] font-medium shadow-sm md:shadow-none focus:border-[#0A437A] cursor-pointer h-full"
                />
            )} */}

            <Dropdown
                options={statusOptions}
                value={selectedStatus === 'true' ? 'Active' : selectedStatus === 'false' ? 'Inactive' : ''}
                onChange={(val) => onFilterChange?.('isActive', val === 'Active' ? 'true' : val === 'Inactive' ? 'false' : '')}
                placeholder="All Status"
                minWidth="w-32"
                triggerClassName="w-full px-3 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm text-[#777777] font-medium shadow-sm md:shadow-none focus:border-[#0A437A] cursor-pointer h-full"
            />

            {onExport && (
                <button
                    onClick={onExport}
                    className="flex items-center justify-center lg:gap-2 p-2 lg:px-4 lg:py-2 bg-white border border-gray-100 lg:border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap h-full"
                >
                    <Download className="w-4 h-4 lg:hidden" />
                    <span className="hidden lg:inline">Export</span>
                </button>
            )}
        </>
    );

    return (
        <DataView
            data={organizations}
            columns={columns}
            cardConfig={cardConfig}
            loading={loading}
            error={error}
            pageScrollMode={true}
            searchPlaceholder="Search Organizations..."
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
            emptyMessage="No Organizations Found"
        />
    );
}
