import React, { useState } from 'react';
import ParentsHeader from '../components/parents/ParentsHeader';
import ParentsToolbar from '../components/parents/ParentsToolbar';
import ParentsTable from '../components/parents/ParentsTable';
import ParentFormModal from '../components/parents/ParentFormModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

const INITIAL_PARENTS = [
    { id: 1, name: 'Jacob Tarakan', email: 'anilkumar@gmail.com', phone: '9987898789', student: 'Nila Mohan', relation: 'Father', status: 'Active' },
    { id: 2, name: 'Jacob Tarakan', email: 'anilkumar@gmail.com', phone: '9987898789', student: 'Nila Mohan', relation: 'Mother', status: 'Inactive' },
    // ... add more as needed
];

export default function Parents() {
    const [parents, setParents] = useState(INITIAL_PARENTS);
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Modal states
    const [activeModal, setActiveModal] = useState(null);
    const [editingParent, setEditingParent] = useState(null);
    const [pendingStatusChange, setPendingStatusChange] = useState(null);

    const handleSelectAll = () => {
        setSelectedIds(selectedIds.length === parents.length ? [] : parents.map(p => p.id));
    };

    const handleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
        );
    };

    const handleStatusChangeRequest = (parent, newStatus) => {
        setPendingStatusChange({ parent, newStatus });
        setActiveModal('confirm-status');
    };

    const confirmStatusChange = () => {
        if (pendingStatusChange) {
            setParents(prev => prev.map(p =>
                p.id === pendingStatusChange.parent.id ? { ...p, status: pendingStatusChange.newStatus } : p
            ));
        }
    };

    const handleEdit = (parent) => {
        setEditingParent(parent);
        setActiveModal('edit');
    };

    const handleSaveParent = () => {
        // Implement save logic here
        console.log("Saving parent data...");
        setActiveModal(null);
        setEditingParent(null);
    };

    const handleDelete = (parent) => {
        console.log("Delete parent:", parent);
        // showConfirmDelete(parent);
    };

    const handleDeleteSelected = () => {
        console.log("Delete selected:", selectedIds);
        // showConfirmDeleteMultiple(selectedIds);
    };

    const handleSearch = (query) => {
        console.log("Search query:", query);
    };

    const handleExport = () => {
        console.log("Exporting data...");
    };

    return (
        <div className="w-full bg-[#F8FAFC] p-6 text-gray-700">
            <ParentsHeader
                selectedIds={selectedIds}
                parents={parents}
                onEdit={handleEdit}
                onDeleteSelected={handleDeleteSelected}
            />

            <ParentsToolbar
                onSearch={handleSearch}
                onExport={handleExport}
            />

            <ParentsTable
                parents={parents}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onSelect={handleSelect}
                onStatusChangeRequest={handleStatusChangeRequest}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Modals */}
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
