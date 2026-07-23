import React, { useCallback, useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import ListToolbar from '@/components/ui/ListToolbar';
import BulkActionMenu from '@/components/ui/BulkActionMenu';
import { useAuthStore } from '@/store/useAuthStore';
import { useMentors } from '@/features/dashboard/hooks/mentor/useMentors';
import { useDebounce } from '@/hooks/useDebounce';
import { createMentor, updateMentorStatus, updateMentor } from '@/services/mentor.service';
import { getOrganizations } from '@/services/organization.service';
import { ROLES } from '@/constants/roles';
import MentorTable from '../components/mentor/MentorTable';
import MentorFormModal from '../components/mentor/MentorFormModal';
import MentorDetailsModal from '../components/mentor/MentorDetailsModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

export default function Mentors() {
    const role = useAuthStore((s) => s.user?.role);
    const { orgId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // We get orgName from navigation state if available
    const orgName = location.state?.orgName || '';

    const canEdit = role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
    const canCreate = role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
    const canDelete = role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;

    const [activeModal, setActiveModal] = useState(null);
    const [editingMentor, setEditingMentor] = useState(null);
    const [pendingStatusChange, setPendingStatusChange] = useState(null);
    const [statusLoadingIds, setStatusLoadingIds] = useState([]);

    // Pagination & Filters for Mentors
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [filters, setFilters] = useState({ search: '', isActive: '', organizationId: orgId || '' });

    const [organizationsList, setOrganizationsList] = useState([]);

    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [pendingPayload, setPendingPayload] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);

    const debouncedSearch = useDebounce(filters.search, 500);

    useEffect(() => {
        if (role === ROLES.SUPER_ADMIN) {
            getOrganizations({ limit: 100, status: 'Active' })
                .then(res => setOrganizationsList(res.data || []))
                .catch(err => console.error("Failed to fetch organizations", err));
        }
    }, [role]);

    useEffect(() => {
        // Ensure filters has the correct organizationId from params
        setFilters(prev => ({ ...prev, organizationId: orgId || '' }));
    }, [orgId]);

    const handleFilterChange = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    }, []);

    const { mentors, pagination: mentorPagination, loading: mentorLoading, error: mentorError, refetch: refetchMentors } = useMentors({
        ...filters,
        search: debouncedSearch,
        page,
        limit
    });

    const getMentorId = (mentor) => mentor._id ?? mentor.id;

    const handleAddClick = () => {
        setEditingMentor(null);
        setActiveModal('edit');
    };


    const handleStatusChangeRequest = (mentor, newStatus) => {
        if (!canEdit) return;
        setPendingStatusChange({
            title: 'Change Status',
            message: `Are you sure you want to change the status of this mentor to ${newStatus ? 'Active' : 'Inactive'}?`,
            confirmText: 'Confirm',
            type: newStatus ? 'primary' : 'danger',
            action: async () => {
                const id = getMentorId(mentor);
                setStatusLoadingIds(prev => [...prev, id]);
                try {
                    await updateMentorStatus(role, id, { isActive: newStatus });
                    showSuccessToast('Status updated successfully');
                    refetchMentors();
                } catch (error) {
                    showErrorToast(error?.response?.data?.message || 'Failed to update status');
                } finally {
                    setStatusLoadingIds(prev => prev.filter(i => i !== id));
                    setPendingStatusChange(null);
                }
            }
        });
    };

    const handleEditClick = (mentor) => {
        setEditingMentor(mentor);
        setActiveModal('edit');
    };

    const handleViewClick = (mentor) => {
        setEditingMentor(mentor);
        setActiveModal('view');
    };

    const handleSaveRequest = (payload) => {
        // Auto-assign organization ID if we are drilled down
        if (!editingMentor && orgId) {
            payload.organizationId = orgId;
        }
        setPendingPayload(payload);
        setIsEditConfirmOpen(true);
    };

    const executeSave = async () => {
        setIsConfirming(true);
        try {
            if (editingMentor) {
                await updateMentor(role, getMentorId(editingMentor), pendingPayload);
                showSuccessToast('Mentor updated successfully');
            } else {
                await createMentor(role, pendingPayload);
                showSuccessToast('Mentor created successfully');
            }
            setActiveModal(null);
            refetchMentors();
        } catch (error) {
            showErrorToast(error?.response?.data?.message || error?.message || `Failed to ${editingMentor ? 'update' : 'create'} mentor`);
            throw error;
        } finally {
            setIsConfirming(false);
            setIsEditConfirmOpen(false);
            setPendingPayload(null);
        }
    };

    const handleSearchChange = useCallback((v) => {
        handleFilterChange('search', v);
    }, [handleFilterChange]);

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-gray-50 flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        {orgId && role === ROLES.SUPER_ADMIN && (
                            <button
                                onClick={() => navigate('/dashboard/mentors')}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                        )}
                        <PageHeader
                            title={orgName ? `Mentors - ${orgName}` : "Mentors Management"}
                            subtitle={orgId ? "Manage mentors for this organization" : "Manage mentor accounts and details"}
                        />
                    </div>
                </div>

                <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col">
                    {/* <ListToolbar
                        searchPlaceholder="Search mentors..."
                        searchValue={filters.search}
                        onSearchChange={(v) => handleFilterChange('search', v)}
                    /> */}

                    <MentorTable
                        onSearch={handleSearchChange}
                        searchQuery={filters.search}
                        mentors={mentors}
                        loading={mentorLoading}
                        error={mentorError}
                        role={role}
                        canCreate={canCreate}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        organizations={organizationsList}
                        page={page}
                        setPage={setPage}
                        limit={limit}
                        setLimit={setLimit}
                        totalItems={mentorPagination.totalRecords}
                        totalPages={mentorPagination.totalPages}
                        onAddClick={handleAddClick}
                        onEdit={handleEditClick}
                        onView={handleViewClick}
                        onFilterChange={handleFilterChange}
                        onStatusChangeRequest={handleStatusChangeRequest}
                        statusLoadingIds={statusLoadingIds}
                    />
                </div>
            </div>

            {activeModal === 'edit' && (
                <MentorFormModal
                    editingMentor={editingMentor}
                    onClose={() => {
                        setActiveModal(null);
                        setEditingMentor(null);
                    }}
                    onSave={handleSaveRequest}
                />
            )}

            {activeModal === 'view' && editingMentor && (
                <MentorDetailsModal
                    mentor={editingMentor}
                    onClose={() => {
                        setActiveModal(null);
                        setEditingMentor(null);
                    }}
                    onEdit={handleEditClick}
                />
            )}

            <ConfirmationModal
                isOpen={isEditConfirmOpen}
                onClose={() => setIsEditConfirmOpen(false)}
                onConfirm={executeSave}
                title={editingMentor ? "Confirm Update" : "Confirm Creation"}
                message={`Are you sure you want to ${editingMentor ? 'update this mentor' : 'create this mentor'}?`}
                confirmText={editingMentor ? "Update Mentor" : "Create Mentor"}
                isSubmitting={isConfirming}
            />

            <ConfirmationModal
                isOpen={!!pendingStatusChange}
                onClose={() => setPendingStatusChange(null)}
                onConfirm={pendingStatusChange?.action}
                title={pendingStatusChange?.title}
                message={pendingStatusChange?.message}
                confirmText={pendingStatusChange?.confirmText}
                type={pendingStatusChange?.type}
            />
        </div>
    );
}
