import React, { useState, useEffect } from 'react';
import { Building, Users, Plus } from 'lucide-react';
import DataView from '@/components/ui/data-view/DataView';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';


export default function MentorOrganizationsTable({
    onSearch,
    onAddClick,
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
    searchQuery
}) {
    const role = useAuthStore((s) => s.user?.role);
    
    const canCreate = role === ROLES.SUPER_ADMIN;

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
