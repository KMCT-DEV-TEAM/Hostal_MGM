import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import ListToolbar from '@/components/ui/ListToolbar';
import { useMentorOrganizations } from '@/features/dashboard/hooks/mentor/useMentorOrganizations';
import { useDebounce } from '@/hooks/useDebounce';
import MentorOrganizationsTable from '../components/mentor/MentorOrganizationsTable';
import MentorFormModal from '../components/mentor/MentorFormModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { createMentor } from '@/services/mentor.service';
import { useAuthStore } from '@/store/useAuthStore';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

export default function MentorOrganizations() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const role = useAuthStore((s) => s.user?.role);

    const [activeModal, setActiveModal] = useState(null);
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);

    const { organizations, pagination, loading, error } = useMentorOrganizations({
        search: debouncedSearch,
        page,
        limit
    });

    const handleViewOrg = (org) => {
        navigate(`/dashboard/mentors/${org._id}`, { state: { orgName: org.name } });
    };

    const handleAddMentor = () => {
        setActiveModal('add');
    };

    const handleSaveRequest = (payload) => {
        setConfirmConfig({
            title: "Confirm Creation",
            message: "Are you sure you want to create this mentor?",
            confirmText: "Create Mentor",
            action: async () => {
                setIsConfirming(true);
                try {
                    await createMentor(role, payload);
                    showSuccessToast('Mentor created successfully');
                    setActiveModal(null);
                    // We don't need to refetch mentor organizations because creating a mentor 
                    // doesn't immediately change the organizations list (maybe just mentor count)
                    // But if we want to, we can reload the page or trigger a refetch hook
                    window.location.reload(); 
                } catch (error) {
                    showErrorToast(error?.response?.data?.message || error?.message || 'Failed to create mentor');
                    throw error;
                } finally {
                    setIsConfirming(false);
                    setConfirmConfig(null);
                }
            }
        });
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-gray-50 flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="mb-6">
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
                        onAddClick={handleAddMentor}
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

            {activeModal === 'add' && (
                <MentorFormModal
                    onClose={() => setActiveModal(null)}
                    onSave={handleSaveRequest}
                />
            )}

            <ConfirmationModal
                isOpen={!!confirmConfig}
                onClose={() => setConfirmConfig(null)}
                onConfirm={confirmConfig?.action}
                title={confirmConfig?.title}
                message={confirmConfig?.message}
                confirmText={confirmConfig?.confirmText}
                type={confirmConfig?.type}
                isSubmitting={isConfirming}
            />
        </div>
    );
}
