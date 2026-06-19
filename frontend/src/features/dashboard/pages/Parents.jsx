import React, { useCallback, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getParentPermissions } from '@/features/dashboard/config/parentPermissions';
import { useParents } from '@/features/dashboard/hooks/useParents';
import { useDebounce } from '@/hooks/useDebounce';
import { createParent, toggleParentStatus, updateParent } from '@/services/parent.service';
import ParentsHeader from '../components/parents/ParentsHeader';
import ParentsToolbar from '../components/parents/ParentsToolbar';
import ParentsTable from '../components/parents/ParentsTable';
import ParentsMobileList from '../components/parents/ParentsMobileList';
import ParentFormModal from '../components/parents/ParentFormModal';
import ParentDetailsModal from '../components/parents/ParentDetailsModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';

export default function Parents() {
    const role = useAuthStore((s) => s.user?.role);

    const { canEdit, canDelete, canCreate } = getParentPermissions(role);

    const [activeModal, setActiveModal] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [editingParent, setEditingParent] = useState(null);
    const [pendingStatusChange, setPendingStatusChange] = useState(null);
    const [statusLoadingIds, setStatusLoadingIds] = useState([]);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ search: '', isActive: '', relationship: '' });

    const debouncedSearch = useDebounce(filters.search, 500);

    const handleFilterChange = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1); // Reset page on filter change
    }, []);

    const { parents, setParents, pagination, loading, error, refetch } = useParents({
        ...filters,
        search: debouncedSearch,
        page
    });

    const getParentId = (parent) => parent._id ?? parent.id;

    const applyStatusChange = (ids, response) => {
        const changedIds = new Set(Array.isArray(ids) ? ids : [ids]);
        const nextIsActive = response?.isActive;

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
        setPendingStatusChange({ parent, newStatus });
        setActiveModal('confirm-status');
    };

    const confirmStatusChange = async () => {
        if (!pendingStatusChange || !canEdit) return;
        const { parent } = pendingStatusChange;
        const id = getParentId(parent);

        setStatusLoadingIds((prev) => [...new Set([...prev, id])]);
        setActiveModal(null);
        setPendingStatusChange(null);

        try {
            const response = await toggleParentStatus(role, id);
            // Assume response contains updated parent or { isActive }
            applyStatusChange(id, response);
            refetch(); // Alternatively refetch to ensure consistency
        } catch (err) {
            console.error("Failed to toggle parent status", err);
        } finally {
            setStatusLoadingIds((prev) => prev.filter((loadingId) => loadingId !== id));
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
        try {
            if (editingParent) {
                await updateParent(getParentId(editingParent), payload);
            } else {
                await createParent(payload);
            }
            setActiveModal(null);
            setEditingParent(null);
            refetch();
        } catch (err) {
            console.error("Failed to save parent", err);
            alert("Error saving parent: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteSelected = async () => {
        if (!canDelete) return;
        if (!window.confirm(`Are you sure you want to deactivate ${selectedIds.length} parent(s)?`)) return;

        setStatusLoadingIds((prev) => [...new Set([...prev, ...selectedIds])]);

        try {
            await Promise.all(selectedIds.map((id) => toggleParentStatus(role, id)));
            setSelectedIds([]);
            refetch();
        } catch (err) {
            console.error("Failed to delete selected parents", err);
        } finally {
            setStatusLoadingIds((prev) => prev.filter((id) => !selectedIds.includes(id)));
        }
    };

    const handleSearch = useCallback((query) => {
        setFilters((prev) => ({ ...prev, search: query }));
    }, []);

    const handleExport = () => {
        console.log("Exporting data...");
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden p-4 md:p-6 flex flex-col">
            <ParentsHeader
                selectedIds={selectedIds}
                parents={parents}
                onEdit={handleEdit}
                onDeleteSelected={handleDeleteSelected}
                canEdit={canEdit}
                canDelete={canDelete}
            />

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0">
                <ParentsToolbar
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    onExport={handleExport}
                    canCreate={canCreate}
                />

                {loading ? (
                    <div className="flex justify-center p-8">Loading parents...</div>
                ) : error ? (
                    <div className="flex justify-center p-8 text-red-500">Error loading parents: {error.message}</div>
                ) : (
                    <>
                        <ParentsTable
                            parents={parents}
                            selectedIds={selectedIds}
                            onSelectAll={handleSelectAll}
                            onSelect={handleSelect}
                            onStatusChangeRequest={handleStatusChangeRequest}
                            onEdit={handleEdit}
                            onView={handleView}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            statusLoadingIds={statusLoadingIds}
                        />
                        <ParentsMobileList
                            parents={parents}
                            error={error}
                            selectedIds={selectedIds}
                            onSelectAll={handleSelectAll}
                            onSelect={handleSelect}
                            onEdit={handleEdit}
                            onView={handleView}
                            statusLoadingIds={statusLoadingIds}
                        />
                    </>
                )}

                {parents.length > 0 && !loading && !error && (
                    <Pagination
                        page={page}
                        setPage={setPage}
                        limit={pagination.limit || 10}
                        totalItems={pagination.totalRecords || 0}
                        totalPages={pagination.totalPages || 0}
                    />
                )}
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
                    onClose={() => { setActiveModal(null); setEditingParent(null); }}
                    onSave={handleSaveParent}
                />
            )}

            <ConfirmationModal
                isOpen={activeModal === 'confirm-status'}
                onClose={() => { setActiveModal(null); setPendingStatusChange(null); }}
                onConfirm={confirmStatusChange}
                title="Confirm Status Change"
                message={`Are you sure you want to change the status of ${pendingStatusChange?.parent?.name} to ${pendingStatusChange?.newStatus}?`}
            />
        </div>
    );
}
