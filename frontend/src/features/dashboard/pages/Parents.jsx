import React, { useCallback, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getParentPermissions } from '@/features/dashboard/config/parentPermissions';
import { useParents } from '@/features/dashboard/hooks/useParents';
import { createParent, toggleParentStatus, updateParent } from '@/services/parent.service';
import ParentsHeader from '../components/parents/ParentsHeader';
import ParentsToolbar from '../components/parents/ParentsToolbar';
import ParentsTable from '../components/parents/ParentsTable';
import ParentFormModal from '../components/parents/ParentFormModal';
import ParentDetailsModal from '../components/parents/ParentDetailsModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function Parents() {
    const role = useAuthStore((s) => s.user?.role);

    const { canEdit, canDelete, canCreate } = getParentPermissions(role);

    const [activeModal, setActiveModal] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [editingParent, setEditingParent] = useState(null);
    const [pendingStatusChange, setPendingStatusChange] = useState(null);
    const [statusLoadingIds, setStatusLoadingIds] = useState([]);
    const [filters, setFilters] = useState({ search: '', status: '' });

    const { parents, setParents, loading, error, refetch } = useParents(filters);

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
        <div className="w-full bg-[#F8FAFC] p-6 text-gray-700 min-h-screen">
            <ParentsHeader
                selectedIds={selectedIds}
                parents={parents}
                onEdit={handleEdit}
                onDeleteSelected={handleDeleteSelected}
                canEdit={canEdit}
                canDelete={canDelete}
            />

            <ParentsToolbar
                onSearch={handleSearch}
                onExport={handleExport}
                canCreate={canCreate}
            />

            {loading ? (
                <div className="flex justify-center p-8">Loading parents...</div>
            ) : error ? (
                <div className="flex justify-center p-8 text-red-500">Error loading parents: {error.message}</div>
            ) : (
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
                />
            )}

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
