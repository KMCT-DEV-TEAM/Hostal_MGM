import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import BackButton from '@/components/ui/BackButton';
import { useAuthStore } from '@/store/useAuthStore';
import { useMentors } from '@/features/dashboard/hooks/mentor/useMentors';
import { useDebounce } from '@/hooks/useDebounce';
import { createMentor, updateMentorStatus, updateMentor, getMentors } from '@/services/mentor.service';
import { getOrganizations } from '@/services/organization.service';
import { ROLES } from '@/constants/roles';
import MentorTable from '../components/mentor/MentorTable';
import MentorFormModal from '../components/mentor/MentorFormModal';
import MentorDetailsModal from '../components/mentor/MentorDetailsModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import { exportToExcel } from '@/utils/exportUtils';
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
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [statusLoadingIds, setStatusLoadingIds] = useState([]);
    const [organizations, setOrganizations] = useState([]);

    // Export State
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Pagination & Filters for Mentors
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [filters, setFilters] = useState({ search: '', isActive: '', organizationId: orgId || '' });

    const [isConfirming, setIsConfirming] = useState(false);

    const debouncedSearch = useDebounce(filters.search, 500);

    useEffect(() => {
        // Ensure filters has the correct organizationId from params
        setFilters(prev => ({ ...prev, organizationId: orgId || '' }));
    }, [orgId]);

    const isSuperAdmin = role === ROLES.SUPER_ADMIN || role === 'SUPER_ADMIN';

    useEffect(() => {
        if (isSuperAdmin && !orgId) {
            getOrganizations({ page: 1, limit: 100, status: 'Active' })
                .then((res) => {
                    const list = Array.isArray(res?.data)
                        ? res.data
                        : Array.isArray(res?.organizations)
                        ? res.organizations
                        : Array.isArray(res?.data?.data)
                        ? res.data.data
                        : Array.isArray(res)
                        ? res
                        : [];
                    setOrganizations(list);
                })
                .catch((err) => console.error('Failed to load organizations for mentor filters:', err));
        }
    }, [role, isSuperAdmin, orgId]);

    useEffect(() => {
        if (location.state?.openAddModal) {
            setActiveModal('edit');
            setEditingMentor(null);
            // Clear the state so it doesn't trigger again on reload
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

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

    const getMentorId = (mentor) => mentor.id ?? mentor._id ?? mentor.id;

    const handleAddClick = () => {
        setEditingMentor(null);
        setActiveModal('edit');
    };

    const handleStatusChangeRequest = (mentor, newStatus) => {
        if (!canEdit) return;
        setConfirmConfig({
            title: 'Change Status',
            message: `Are you sure you want to change the status of this mentor to ${newStatus ? 'Active' : 'Inactive'}?`,
            confirmText: 'Confirm',
            type: newStatus ? 'primary' : 'danger',
            action: async () => {
                const id = getMentorId(mentor);
                setStatusLoadingIds(prev => [...prev, id]);
                setIsConfirming(true);
                try {
                    await updateMentorStatus(role, id, { isActive: newStatus });
                    showSuccessToast('Status updated successfully');
                    refetchMentors();
                } catch (error) {
                    showErrorToast(error?.message || 'Failed to update status');
                } finally {
                    setStatusLoadingIds(prev => prev.filter(i => i !== id));
                    setIsConfirming(false);
                    setConfirmConfig(null);
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

        setConfirmConfig({
            title: editingMentor ? "Confirm Update" : "Confirm Creation",
            message: `Are you sure you want to ${editingMentor ? 'update this mentor' : 'create this mentor'}?`,
            confirmText: editingMentor ? "Update Mentor" : "Create Mentor",
            action: async () => {
                setIsConfirming(true);
                try {
                    if (editingMentor) {
                        await updateMentor(role, getMentorId(editingMentor), payload);
                        showSuccessToast('Mentor updated successfully');
                    } else {
                        await createMentor(role, payload);
                        showSuccessToast('Mentor created successfully');
                    }
                    setActiveModal(null);
                    refetchMentors();
                } catch (error) {
                    showErrorToast(error?.response?.data?.message || error?.message || `Failed to ${editingMentor ? 'update' : 'create'} mentor`);
                    throw error;
                } finally {
                    setIsConfirming(false);
                    setConfirmConfig(null);
                }
            }
        });
    };

    const confirmExport = async (exportFilters) => {
        setIsExporting(true);
        try {
            const params = {
                ...filters,
                search: debouncedSearch,
                page: 1,
                limit: 99990,
                isExport: true,
            };

            if (exportFilters?.isActive && exportFilters.isActive !== 'all' && exportFilters.isActive !== '') {
                params.isActive = exportFilters.isActive;
            }
            if (exportFilters?.organizationId) {
                params.organizationId = exportFilters.organizationId;
            }

            const response = await getMentors(role, params);
            const dataToExport = response?.data || response?.mentors || [];

            if (!dataToExport.length) {
                showErrorToast("Export failed", "No mentors match the selected filters");
                setIsExportConfirmOpen(false);
                return;
            }

            const exportData = dataToExport.map((mentor, index) => ({
                "S.No": index + 1,
                "Name": mentor?.name ?? "N/A",
                "Email": mentor?.email ?? "N/A",
                "Phone": mentor?.phone ?? "N/A",
                "Specialization": mentor?.specialization ?? "N/A",
                "Organization": mentor?.organization?.name ?? mentor?.organization ?? "N/A",
                "Status": mentor?.isActive ? "Active" : "Inactive",
                "Created At": mentor?.createdAt ? new Date(mentor.createdAt).toLocaleDateString() : "N/A",
            }));

            const isSuccess = exportToExcel(exportData, "Mentors_Export", "Mentors");

            if (isSuccess) {
                showSuccessToast("Exported successfully");
            } else {
                showErrorToast("Export failed", "Could not generate Excel file");
            }
            setIsExportConfirmOpen(false);
        } catch (err) {
            console.error("Failed to export mentors:", err);
            showErrorToast("Export failed", err?.message || "Failed to export mentors");
        } finally {
            setIsExporting(false);
        }
    };

    const handleSearchChange = useCallback((v) => {
        handleFilterChange('search', v);
    }, [handleFilterChange]);

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-gray-50 flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="mb-6">
                    <PageHeader
                        title={orgName ? `Mentors - ${orgName}` : "Mentors Management"}
                        subtitle={orgId ? "Manage mentors for this organization" : "Manage mentor accounts and details"}
                        actionButton={
                            orgId && role === ROLES.SUPER_ADMIN ? (
                                <BackButton text="Back to Organizations" onClick={() => navigate('/dashboard/mentors')} />
                            ) : null
                        }
                    />
                </div>

                <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col">

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
                        onExport={() => setIsExportConfirmOpen(true)}
                        organizations={organizations}
                        selectedOrgId={filters.organizationId}
                        isDrilledDown={!!orgId}
                    />
                </div>
            </div>

            {activeModal === 'edit' && (
                <MentorFormModal
                    editingMentor={editingMentor}
                    orgId={orgId}
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

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Mentors Data"
                fields={[
                    {
                        name: "isActive",
                        label: "Account Status",
                        options: [
                            { label: 'All Status', value: '' },
                            { label: 'Active Only', value: 'true' },
                            { label: 'Inactive Only', value: 'false' },
                        ],
                        defaultValue: filters.isActive || ''
                    },
                    ...(isSuperAdmin && !orgId ? [{
                        name: "organizationId",
                        label: "Organization",
                        options: [
                            { label: 'All Organizations', value: '' },
                            ...(organizations || []).map(o => ({ label: o.name || o.label, value: o.id || o.value }))
                        ],
                        defaultValue: filters.organizationId || ''
                    }] : [])
                ]}
            />

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
