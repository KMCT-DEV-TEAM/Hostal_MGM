import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import { useMentorOrganizations } from '@/features/dashboard/hooks/mentor/useMentorOrganizations';
import { useDebounce } from '@/hooks/useDebounce';
import MentorOrganizationsTable from '../components/mentor/MentorOrganizationsTable';
import MentorFormModal from '../components/mentor/MentorFormModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import { createMentor, getMentorOrganizations } from '@/services/mentor.service';
import { getOrganizations } from '@/services/organization.service';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import { exportToExcel } from '@/utils/exportUtils';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

export default function MentorOrganizations() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [filters, setFilters] = useState({ search: '', isActive: '', organizationId: '' });
    const debouncedSearch = useDebounce(filters.search, 500);
    const role = useAuthStore((s) => s.user?.role);

    const [activeModal, setActiveModal] = useState(null);
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [allOrganizations, setAllOrganizations] = useState([]);

    // Export State
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const isSuperAdmin = role?.toLowerCase() === 'super_admin';

    useEffect(() => {
        if (isSuperAdmin) {
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
                    setAllOrganizations(list);
                })
                .catch((err) => console.error('Failed to load organizations for mentor org filters:', err));
        }
    }, [role, isSuperAdmin]);

    const handleFilterChange = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    }, []);

    const { organizations, pagination, loading, error, refetch } = useMentorOrganizations({
        ...filters,
        search: debouncedSearch,
        page,
        limit
    });

    const handleViewOrg = (org) => {
        navigate(`/dashboard/mentors/${org.id}`, { state: { orgName: org.name } });
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
                    refetch();
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

            const response = await getMentorOrganizations(role, params);

            const dataToExport = response?.data || response?.organizations || [];

            if (!dataToExport.length) {
                showErrorToast("Export failed", "No organizations match the selected criteria");
                setIsExportConfirmOpen(false);
                return;
            }

            const exportData = [];
            let counter = 1;

            dataToExport.forEach((org) => {
                const mentors = Array.isArray(org.mentors) ? org.mentors : [];
                if (mentors.length > 0) {
                    mentors.forEach((mentor) => {
                        exportData.push({
                            "S.No": counter++,
                            "Organization": org?.name ?? "N/A",
                            "Organization Code": org?.code ?? "N/A",
                            "Mentor Name": mentor?.name ?? "N/A",
                            "Mentor Email": mentor?.email ?? "N/A",
                            "Mentor Phone": mentor?.phone ?? "N/A",
                            "Specialization": mentor?.specialization ?? "N/A",
                            "Status": mentor?.isActive ? "Active" : "Inactive",
                        });
                    });
                } else {
                    exportData.push({
                        "S.No": counter++,
                        "Organization": org?.name ?? "N/A",
                        "Organization Code": org?.code ?? "N/A",
                        "Mentor Name": "No Mentors",
                        "Mentor Email": "N/A",
                        "Mentor Phone": "N/A",
                        "Specialization": "N/A",
                        "Status": "N/A",
                    });
                }
            });

            const isSuccess = exportToExcel(exportData, "Mentor_Organizations_Export", "Organizations");

            if (isSuccess) {
                showSuccessToast("Exported successfully");
            } else {
                showErrorToast("Export failed", "Could not generate Excel file");
            }
            setIsExportConfirmOpen(false);
        } catch (err) {
            console.error("Export error:", err);
            showErrorToast("Export failed", err?.message || "Failed to export organizations");
        } finally {
            setIsExporting(false);
        }
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
                    <MentorOrganizationsTable
                        onSearch={(val) => handleFilterChange('search', val)}
                        onFilterChange={handleFilterChange}
                        onAddClick={handleAddMentor}
                        onExport={() => setIsExportConfirmOpen(true)}
                        searchQuery={filters.search}
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
                        allOrganizations={allOrganizations}
                        selectedOrgId={filters.organizationId}
                        selectedStatus={filters.isActive}
                    />
                </div>
            </div>

            {activeModal === 'add' && (
                <MentorFormModal
                    onClose={() => setActiveModal(null)}
                    onSave={handleSaveRequest}
                />
            )}

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Mentor Organizations Data"
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
                    ...(isSuperAdmin ? [{
                        name: "organizationId",
                        label: "Organization",
                        options: [
                            { label: 'All Organizations', value: '' },
                            ...(allOrganizations || []).map(o => ({ label: o.name, value: o.id }))
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
