import React, { useState, useEffect } from 'react';
import { Plus, Download, Edit2, Box, PackageCheck, PackageOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import furnitureApi from '@/features/furniture/api/furnitureApi';
import DataTable from '@/components/ui/DataTable';
import PageHeader from '@/components/ui/PageHeader';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import AddFurnitureModal from '../components/modals/AddFurnitureModal';

export default function AdminFurniture() {
    const navigate = useNavigate();

    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1 });
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedType, setSelectedType] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const limit = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchFurnitureTypes();
    }, [page, debouncedSearch, statusFilter]);

    const fetchFurnitureTypes = async () => {
        try {
            setLoading(true);
            const res = await furnitureApi.getFurnitureTypes({
                page,
                limit,
                search: debouncedSearch,
                status: statusFilter
            });
            setTypes(res.data?.data || res.data || []);
            setPagination({
                totalPages: res.data?.totalPages || res.totalPages || 1,
                totalRecords: res.data?.totalCount || res.totalCount || 0
            });
        } catch (error) {
            showErrorToast(error.message || 'Failed to fetch furniture types');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveType = async (data) => {
        try {
            if (selectedType) {
                await furnitureApi.updateFurnitureType(selectedType._id, data);
                showSuccessToast('Furniture type updated successfully');
            } else {
                await furnitureApi.createFurnitureType(data);
                showSuccessToast('Furniture type created successfully');
            }
            setIsAddModalOpen(false);
            setSelectedType(null);
            fetchFurnitureTypes();
        } catch (error) {
            showErrorToast(error.message || 'Failed to save furniture type');
            throw error;
        }
    };

    const handleDeleteSelected = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} furniture types?`)) return;
        try {
            for (const id of selectedIds) {
                await furnitureApi.deleteFurnitureType(id);
            }
            showSuccessToast('Selected furniture types deleted');
            setSelectedIds([]);
            fetchFurnitureTypes();
        } catch (error) {
            showErrorToast(error.message || 'Failed to delete some furniture types');
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === types.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(types.map(t => t._id));
        }
    };

    const handleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const pageTitle = 'Manage Furniture';
    const pageSubtitle = 'Manage all furnitures';

    const tableHeaders = [
        { key: 'name', label: 'Furniture' },
        { key: 'total', label: 'Quantity' },
        { key: 'allocated', label: 'Assigned' },
        { key: 'available', label: 'Available' },
        { key: 'actions', label: 'Action' },
    ];

    const handleRowClick = (item) => {
        navigate(`/dashboard/furniture/${item._id}`);
    };

    // Calculate stats from current page for mockup representation
    const totalFurnitures = types.reduce((acc, t) => acc + (t.total || t.assets?.total || 0), 0);
    const assignedFurnitures = types.reduce((acc, t) => acc + (t.allocated || t.assets?.allocated || 0), 0);
    const availableFurnitures = types.reduce((acc, t) => acc + (t.available || t.assets?.available || 0), 0);

    return (
        <div className="w-full h-full overflow-hidden p-4 md:p-6 flex flex-col bg-background-secondary">
            {/* Header */}
            <div className="mb-6 shrink-0">
                <PageHeader title={pageTitle} subtitle={pageSubtitle} />
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">TOTAL FURNITURES</p>
                        <p className="text-2xl font-bold text-gray-900">{totalFurnitures}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                        <Box className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ASSIGNED FURNITURES</p>
                        <p className="text-2xl font-bold text-gray-900">{assignedFurnitures}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
                        <PackageCheck className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">AVAILABLE FURNITURES</p>
                        <p className="text-2xl font-bold text-gray-900">{availableFurnitures}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-500 flex items-center justify-center">
                        <PackageOpen className="w-5 h-5" />
                    </div>
                </div>
            </div>

            <DataTable
                toolbarActions={
                    <>
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleDeleteSelected}
                                className="px-4 py-2 border border-red-200 text-danger bg-red-50 hover:bg-red-100 text-sm font-semibold rounded-xl transition-colors"
                            >
                                Delete ({selectedIds.length})
                            </button>
                        )}
                        <select
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All</option>
                            <option value="Available">Available</option>
                        </select>
                        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium inline-flex items-center gap-2 hover:bg-gray-50 transition-colors">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={() => {
                                setSelectedType(null);
                                setIsAddModalOpen(true);
                            }}
                            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl inline-flex items-center gap-2 hover:bg-secondary transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add New
                        </button>
                    </>
                }
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search furniture types..."
                headers={tableHeaders}
                items={types}
                canSelect={true}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onSelect={handleSelect}
                onRowClick={handleRowClick}
                emptyText="No furniture types found."
                isLoading={loading}
                renderRow={(item) => {
                    const isSelected = selectedIds.includes(item._id);
                    return (
                        <>
                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelect(item._id)}
                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                                />
                            </td>
                            <td className="p-4 text-sm text-gray-500 font-medium">
                                {item.name}
                            </td>
                            <td className="p-4 text-sm text-gray-500">
                                {item.total || item.assets?.total || 0}
                            </td>
                            <td className="p-4 text-sm text-gray-500">
                                {item.allocated || item.assets?.allocated || 0}
                            </td>
                            <td className="p-4 text-sm text-gray-500">
                                {item.available || item.assets?.available || 0}
                            </td>
                            <td className="p-4 text-right">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedType(item);
                                        setIsAddModalOpen(true);
                                    }}
                                    className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </td>
                        </>
                    );
                }}
                page={page}
                setPage={setPage}
                limit={limit}
                totalItems={pagination.totalRecords}
                totalPages={pagination.totalPages}
            />

            {isAddModalOpen && (
                <AddFurnitureModal
                    isOpen={isAddModalOpen}
                    onClose={() => {
                        setIsAddModalOpen(false);
                        setSelectedType(null);
                    }}
                    onSave={handleSaveType}
                    initialData={selectedType}
                />
            )}
        </div>
    );
}
