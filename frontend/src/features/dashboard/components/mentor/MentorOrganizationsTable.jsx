import React, { useState, useEffect } from 'react';
import { Building, Users } from 'lucide-react';
import DataView from '@/components/ui/data-view/DataView';
import { useDebounce } from '@/hooks/useDebounce';

export default function MentorOrganizationsTable({
    onSearch,
    organizations,
    loading,
    error,
    onView,
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    totalPages
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 400);

    useEffect(() => {
        onSearch?.(debouncedSearchTerm);
    }, [debouncedSearchTerm, onSearch]);

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

    return (
        <DataView
            data={organizations}
            columns={columns}
            cardConfig={cardConfig}
            loading={loading}
            error={error}
            searchPlaceholder="Search Organizations..."
            onSearchChange={setSearchTerm}
            searchValue={searchTerm}
            onRowClick={onView}
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
