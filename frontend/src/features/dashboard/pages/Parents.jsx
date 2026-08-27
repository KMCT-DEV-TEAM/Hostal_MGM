import React, { useCallback, useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import ListToolbar from '@/components/ui/ListToolbar';
import BulkActionMenu from '@/components/ui/BulkActionMenu';
import { useAuthStore } from '@/store/useAuthStore';
import { getParentPermissions } from '@/features/dashboard/config/parentPermissions';
import { useParents } from '@/features/dashboard/hooks/parent/useParents';
import { useDebounce } from '@/hooks/useDebounce';
import { createParent, toggleParentStatus, updateParent, updateParentByRole, bulkUpdateParentStatus, exportParents } from '@/services/parent.service';
import { getOrganizations } from '@/services/organization.service';
import { ROLES } from '@/constants/roles';
import ParentsHeader from '../components/parents/ParentsHeader';
import ParentsTable from '../components/parents/ParentsTable';
import ParentFormModal from '../components/parents/ParentFormModal';
import ParentDetailsModal from '../components/parents/ParentDetailsModal';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { exportToExcel } from '@/utils/exportUtils';

export default function Parents() {
    const role = useAuthStore((s) => s.user?.role);

    const { canEdit, canDelete, canCreate } = getParentPermissions(role);

    const [activeModal, setActiveModal] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [editingParent, setEditingParent] = useState(null);
    const [pendingStatusChange, setPendingStatusChange] = useState(null);
    const [statusLoadingIds, setStatusLoadingIds] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [filters, setFilters] = useState({ search: '', isActive: '', organizationId: '' });
    const [organizations, setOrganizations] = useState([]);

    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [pendingPayload, setPendingPayload] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const debouncedSearch = useDebounce(filters.search, 500);

    useEffect(() => {
        if (role === ROLES.SUPER_ADMIN) {
            getOrganizations({ limit: 100, status: 'Active' })
                .then(res => setOrganizations(Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : []))
                .catch(err => console.error("Failed to fetch organizations", err));
        }
    }, [role]);

    const handleFilterChange = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1); // Reset page on filter change
    }, []);

    const { parents, setParents, pagination, loading, error, refetch } = useParents({
        ...filters,
        search: debouncedSearch,
        page,
        limit
    });

    const getParentId = (parent) => parent._id ?? parent.id;

    const handleAddClick = () => {
        setEditingParent(null);
        setActiveModal('edit');
    };

    const applyStatusChange = (ids, response) => {
        const changedIds = new Set(Array.isArray(ids) ? ids : [ids]);
        const nextIsActive = response?.data?.isActive ?? response?.isActive;

        if (typeof nextIsActive !== 'boolean') return;

        setParents((prev) => prev.map((parent) => (
            changedIds.has(getParentId(parent))
                ? { ...parent, isActive: nextIsActive, status: nextIsActive ? 'Active' : 'Inactive' }
                : parent
        )));
    };

    const handleSelectAll = () => {
        setSelectedIds(selectedIds.length === parents.length ? [] : parents.map(getParentId));
    };

    const handleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleStatusChangeRequest = (parent, newStatus) => {
        if (!canEdit) return;
        setPendingStatusChange({
            title: 'Change Status',
            message: `Are you sure you want to change the status of this parent?`,
            confirmText: 'Confirm',
            confirmAction: () => confirmStatusChange(parent)
        });
        setActiveModal('confirm-status');
    };

    const confirmStatusChange = async (parent) => {
        if (!canEdit) return;
        const id = getParentId(parent);

        setStatusLoadingIds((prev) => [...new Set([...prev, id])]);
        setIsConfirming(true);

        try {
            const response = await toggleParentStatus(role, id);
            applyStatusChange(id, response);
            showSuccessToast('Status updated successfully');
            setActiveModal(null);
            setPendingStatusChange(null);
        } catch (err) {
            console.error("Failed to toggle parent status", err);
            showErrorToast('Error updating status', err.response?.data?.message || err.message);
        } finally {
            setStatusLoadingIds((prev) => prev.filter((loadingId) => loadingId !== id));
            setIsConfirming(false);
        }
    };

    const handleEdit = (parent) => {
        setEditingParent(parent);
        setActiveModal('edit');
    };

    const handleView = (parent) => {
        setEditingParent(parent);
        setActiveModal('view');
    };

    const handleSaveParent = async (payload) => {
        if (editingParent) {
            setPendingPayload(payload);
            setIsEditConfirmOpen(true);
        } else {
            executeSave(payload);
        }
    };

    const executeSave = async (payload) => {
        setIsSubmitting(true);
        try {
            if (editingParent) {
                await updateParentByRole(role, getParentId(editingParent), payload || pendingPayload);
                showSuccessToast('Parent updated successfully');
            } else {
                await createParent(role, payload || pendingPayload);
                showSuccessToast('Parent created successfully');
            }
            setActiveModal(null);
            setEditingParent(null);
            setIsEditConfirmOpen(false);
            setPendingPayload(null);
            refetch();
        } catch (err) {
            console.error("Failed to save parent", err);
            showErrorToast('Error saving parent', err.response?.data?.message || err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        if (editingParent) {
            setIsDiscardConfirmOpen(true);
        } else {
            setActiveModal(null);
            setEditingParent(null);
        }
    };

    const handleBulkStatusChange = async (targetActive, idsToToggle) => {
        if (!idsToToggle.length) return;

        setStatusLoadingIds((prev) => [...new Set([...prev, ...idsToToggle])]);
        setIsConfirming(true);

        try {
            await bulkUpdateParentStatus(role, { ids: idsToToggle, isActive: targetActive });
            setParents((prev) => prev.map((parent) => (
                idsToToggle.includes(getParentId(parent))
                    ? { ...parent, isActive: targetActive, status: targetActive ? 'Active' : 'Inactive' }
                    : parent
            )));
            setSelectedIds([]);
            showSuccessToast(`Successfully ${targetActive ? 'activated' : 'deactivated'} ${idsToToggle.length} parent(s)`);
            setActiveModal(null);
            setPendingStatusChange(null);
        } catch (err) {
            console.error("Failed to update bulk status", err);
            showErrorToast('Bulk Status Error', err.response?.data?.message || err.message);
        } finally {
            setStatusLoadingIds((prev) => prev.filter((id) => !idsToToggle.includes(id)));
            setIsConfirming(false);
        }
    };

    const prepareBulkStatusChange = (targetActive) => {
        if (!selectedIds.length) return;

        const idsToToggle = selectedIds.filter((id) => {
            const parent = parents.find((parent) => getParentId(parent) === id);
            return parent ? parent.isActive !== targetActive : false;
        });

        if (!idsToToggle.length) {
            setSelectedIds([]);
            return;
        }

        setPendingStatusChange({
            title: targetActive ? 'Confirm Activation' : 'Confirm Deactivation',
            message: `Are you sure you want to ${targetActive ? 'activate' : 'deactivate'} ${idsToToggle.length} selected parent(s)?`,
            confirmText: targetActive ? 'Activate' : 'Deactivate',
            confirmAction: () => handleBulkStatusChange(targetActive, idsToToggle),
        });
        setActiveModal('confirm-status');
    };

    const handleActivateSelected = () => {
        if (!canEdit) return;
        prepareBulkStatusChange(true);
    };

    const handleDeactivateSelected = () => {
        if (!canDelete) return;
        prepareBulkStatusChange(false);
    };

    const handleSearch = useCallback((query) => {
        setFilters((prev) => ({ ...prev, search: query }));
    }, []);

    const handleExport = () => {
        setIsExportConfirmOpen(true);
    };

    const confirmExport = async (exportFilters) => {
        setIsExporting(true);
        try {
            // Merge current table filters (like search) with the export modal filters
            const mergedFilters = { ...filters, ...exportFilters };

            // Clean up empty string values so they don't corrupt the backend query
            const params = Object.fromEntries(
                Object.entries(mergedFilters).filter(([, value]) => value !== '')
            );

            // Fetch all matching parents for export using the dedicated export endpoint
            const response = await exportParents(role, params);

            const dataToExport = response?.parents || response?.data?.parents || [];

            if (dataToExport.length === 0) {
                showErrorToast('Export failed', 'No parents match the selected filters');
                setIsExportConfirmOpen(false);
                return;
            }

            const exportData = dataToExport.map((p, index) => ({
                "S.No": index + 1,
                "Parent Name": p.parentName,
                "Email": p.email,
                "Phone": p.phone || 'N/A',
                "Student": typeof p.student === 'object' ? p.student?.name : p.student,
                "Organization": p.organization?.name || 'N/A',
                "Status": p.isActive ? "Active" : "Inactive"
            }));

            const isSuccess = exportToExcel(exportData, "Parents_Export", "Parents");

            if (isSuccess) {
                showSuccessToast('Exported successfully');
            } else {
                showErrorToast('Export failed', 'Could not generate the Excel file');
            }

            setIsExportConfirmOpen(false);
        } catch (err) {
            console.error("Failed to export parents:", err);
            showErrorToast('Export failed', err.message);
        } finally {
            setIsExporting(false);
        }
    };

    const exportFields = [
        {
            name: "isActive",
            label: "Account Status",
            options: [
                { label: 'All Statuses', value: '' },
                { label: 'Active Only', value: 'true' },
                { label: 'Inactive Only', value: 'false' },
            ],
            defaultValue: filters.isActive === 'true' ? 'true' : (filters.isActive === 'false' ? 'false' : '')
        }
    ];

    if (role === ROLES.SUPER_ADMIN) {
        exportFields.push({
            name: "organizationId",
            label: "Organization",
            options: [
                { label: 'All Organizations', value: '' },
                ...organizations.map(org => ({ label: org.name, value: org._id }))
            ],
            defaultValue: filters.organizationId || ''
        });
    }

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <ParentsHeader />

                <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col">
                    <ParentsTable
                        onSearch={handleSearch}
                        onFilterChange={handleFilterChange}
                        onExport={handleExport}
                        onAddClick={handleAddClick}
                        canCreate={canCreate}
                        organizations={organizations}
                        parents={parents}
                        loading={loading}
                        error={error ? error.message || error : null}
                        selectedIds={selectedIds}
                        onSelectAll={handleSelectAll}
                        onSelect={handleSelect}
                        onStatusChangeRequest={handleStatusChangeRequest}
                        onEdit={handleEdit}
                        onView={handleView}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        statusLoadingIds={statusLoadingIds}
                        role={role}
                        page={page}
                        setPage={setPage}
                        limit={limit}
                        setLimit={setLimit}
                        totalItems={pagination.totalRecords || 0}
                        totalPages={pagination.totalPages || 0}
                        onActivateSelected={handleActivateSelected}
                        onDeactivateSelected={handleDeactivateSelected}
                    />
                </div>

            {/* Modals */}
            {activeModal === 'view' && (
                <ParentDetailsModal
                    parent={editingParent}
                    onClose={() => { setActiveModal(null); setEditingParent(null); }}
                />
            )}

            {activeModal === 'edit' && (
                <ParentFormModal
                    editingParent={editingParent}
                    onClose={handleCloseModal}
                    onSave={handleSaveParent}
                />
            )}

            <ConfirmationModal
                isOpen={activeModal === 'confirm-status'}
                onClose={() => { setActiveModal(null); setPendingStatusChange(null); }}
                onConfirm={pendingStatusChange?.confirmAction || (() => confirmStatusChange(pendingStatusChange?.parent))}
                title={pendingStatusChange?.title || "Confirm Status Change"}
                message={pendingStatusChange?.message || `Are you sure you want to change the status of ${pendingStatusChange?.parent?.parentName || 'this parent'} to ${pendingStatusChange?.newStatus}?`}
                isSubmitting={isConfirming}
            />

            <ConfirmationModal
                isOpen={isEditConfirmOpen}
                onClose={() => setIsEditConfirmOpen(false)}
                onConfirm={() => executeSave()}
                title="Confirm Edit"
                message="Are you sure you want to save these changes?"
                confirmText="Save Changes"
                isSubmitting={isSubmitting}
            />

            <ConfirmationModal
                isOpen={isDiscardConfirmOpen}
                onClose={() => setIsDiscardConfirmOpen(false)}
                onConfirm={() => {
                    setIsDiscardConfirmOpen(false);
                    setActiveModal(null);
                    setEditingParent(null);
                }}
                title="Discard Changes"
                message="Are you sure you want to discard your changes? Any unsaved edits will be lost."
                confirmText="Discard"
                cancelText="Continue Editing"
                confirmButtonClass="bg-red-600 text-white hover:bg-red-700"
            />

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Parents Data"
                fields={exportFields}
            />
            </div>
        </div>
    );
}
