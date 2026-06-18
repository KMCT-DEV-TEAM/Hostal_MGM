import React, { useState } from 'react';
import ParentsHeader from '../components/parents/ParentsHeader';
import ParentsToolbar from '../components/parents/ParentsToolbar';
import ParentsTable from '../components/parents/ParentsTable';

const INITIAL_PARENTS = [
    { id: 1, name: 'Jacob Tarakan', email: 'anilkumar@gmail.com', phone: '9987898789', student: 'Nila Mohan', relation: 'Father', status: 'Active' },
    { id: 2, name: 'Jacob Tarakan', email: 'anilkumar@gmail.com', phone: '9987898789', student: 'Nila Mohan', relation: 'Mother', status: 'Inactive' },
    // ... add more as needed
];

export default function Parents() {
    const [parents, setParents] = useState(INITIAL_PARENTS);
    const [selectedIds, setSelectedIds] = useState([]);

    const handleSelectAll = () => {
        setSelectedIds(selectedIds.length === parents.length ? [] : parents.map(p => p.id));
    };

    const handleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
        );
    };

    const handleStatusChange = (id, newStatus) => {
        setParents(prev => prev.map(p => 
            p.id === id ? { ...p, status: newStatus } : p
        ));
    };

    const handleEdit = (parent) => {
        console.log("Edit parent:", parent);
        // openEditParentModal(parent);
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
        <div className="w-full min-h-screen bg-[#F8FAFC] p-6 text-gray-700">
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
                onStatusChange={handleStatusChange} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
            />
        </div>
    );
}
