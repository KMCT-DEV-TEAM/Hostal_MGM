import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import ListToolbar from '@/components/ui/ListToolbar';
import { useMentorOrganizations } from '@/features/dashboard/hooks/mentor/useMentorOrganizations';
import { useDebounce } from '@/hooks/useDebounce';
import MentorOrganizationsTable from '../components/mentor/MentorOrganizationsTable';

export default function MentorOrganizations() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);

    const { organizations, pagination, loading, error } = useMentorOrganizations({
        search: debouncedSearch,
        page,
        limit
    });

    const handleViewOrg = (org) => {
        navigate(`/dashboard/mentors/${org._id}`, { state: { orgName: org.name } });
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-gray-50 flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
                    <PageHeader
                        title="Mentors Management"
                        subtitle="Manage mentors by organization"
                    />
                </div>

                <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col">
                    {/* <ListToolbar
                        searchPlaceholder="Search organizations..."
                        searchValue={search}
                        onSearchChange={setSearch}
                    /> */}
                    <MentorOrganizationsTable
                        onSearch={setSearch}
                        searchQuery={search}
                        organizations={organizations}
                        loading={loading}
                        error={error}
                        onView={handleViewOrg}
                        page={page}
                        setPage={setPage}
                        limit={limit}
                        setLimit={setLimit}
                        totalItems={pagination.totalRecords}
                        totalPages={pagination.totalPages}
                    />
                </div>
            </div>
        </div>
    );
}
