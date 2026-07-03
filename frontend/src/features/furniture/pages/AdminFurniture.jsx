import React, { useState, useEffect } from 'react';
import { Plus, Download, Edit2, Box, PackageCheck, PackageOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import furnitureApi from '@/features/furniture/api/furnitureApi';
import DataTable from '@/components/ui/DataTable';
import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import Dropdown from '@/components/ui/Dropdown';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import AddFurnitureModal from '../components/modals/AddFurnitureModal';
import AdminFurnitureDetailsModal from '../components/modals/AdminFurnitureDetailsModal';
import Button from '@/components/ui/Button';

export default function AdminFurniture() {
    const navigate = useNavigate();

    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1 });
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedType, setSelectedType] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [dashboardStats, setDashboardStats] = useState(null);
    const limit = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    useEffect(() => {
        fetchFurnitureTypes();
    }, [page, debouncedSearch, statusFilter]);

    const fetchDashboardStats = async () => {
        try {
            const res = await furnitureApi.getDashboardStats();
            setDashboardStats(res.data?.summary || res.summary || null);
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        }
    };

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

    const handleAdjustStock = async (typeId, count) => {
        try {
            await furnitureApi.adjustAssetsCount(typeId, { count });
            showSuccessToast('Stock adjusted successfully');
            fetchFurnitureTypes();
            fetchDashboardStats();

            if (isDetailsModalOpen && selectedType && selectedType._id === typeId) {
                setSelectedType(prev => ({
                    ...prev,
                    total: prev.total + count,
                    available: prev.available + count,
                    assets: prev.assets ? {
                        ...prev.assets,
                        total: (prev.assets.total || 0) + count,
                        available: (prev.assets.available || 0) + count
                    } : undefined
                }));
            }
        } catch (error) {
            showErrorToast(error.message || 'Failed to adjust stock');
        }
    };

    const confirmExport = async (filters) => {
        setIsExporting(true);
        try {
            // Implement actual export logic here
            showSuccessToast('Furniture data exported successfully');
            setIsExportConfirmOpen(false);
        } catch (error) {
            showErrorToast('Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    const exportFields = [
        {
            name: "status",
            label: "Status",
            options: [
                { label: 'All Status', value: '' },
                { label: 'Available', value: 'Available' },
            ]
        }
    ];

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
        { key: 'hostel', label: 'Hostel' },
        { key: 'total', label: 'Quantity' },
        { key: 'allocated', label: 'Assigned' },
        { key: 'available', label: 'Available' },
        { key: 'actions', label: 'Action' },
    ];

    const handleRowClick = (item) => {
        setSelectedType(item);
        setIsDetailsModalOpen(true);
    };

    const totalFurnitures = dashboardStats?.totalAssets || 0;
    const assignedFurnitures = dashboardStats?.allocated || 0;
    const availableFurnitures = dashboardStats?.available || 0;

    return (
        <div className="w-full h-full overflow-hidden p-4 md:p-6 flex flex-col bg-background-secondary">
            {/* Header */}
            <div className="mb-6 shrink-0">
                <PageHeader title={pageTitle} subtitle={pageSubtitle} />
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
                <StatsCard
                    label="TOTAL FURNITURES"
                    value={totalFurnitures}
                    icon={<Box className="w-5 h-5" />}
                    iconBg="bg-blue-50 text-blue-500"
                />
                <StatsCard
                    label="ASSIGNED FURNITURES"
                    value={assignedFurnitures}
                    icon={<PackageCheck className="w-5 h-5" />}
                    iconBg="bg-success/10 text-success"
                />
                <StatsCard
                    label="AVAILABLE FURNITURES"
                    value={availableFurnitures}
                    icon={<PackageOpen className="w-5 h-5" />}
                    iconBg="bg-cyan-50 text-cyan-500"
                />
            </div>

            <DataTable
                toolbarActions={
                    <>
                        {selectedIds.length > 0 && (
                            <Button
                                variant="outline"
                                fullWidth={false}
                                size="md"
                                onClick={handleDeleteSelected}
                                className="border-red-200 text-danger bg-red-50 hover:bg-red-100"
                            >
                                Delete ({selectedIds.length})
                            </Button>
                        )}
                        <Dropdown
                            options={[
                                { label: 'All Status', value: 'All' },
                                { label: 'Available', value: 'Available' }
                            ]}
                            value={statusFilter}
                            onChange={(val) => setStatusFilter(val)}
                            placeholder="All Status"
                            minWidth="w-[140px]"
                        />
                        <Button
                            variant='outline'
                            fullWidth={false}
                            size="md"
                            onClick={() => setIsExportConfirmOpen(true)}
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </Button>

                        <Button
                            variant="primary"
                            fullWidth={false}
                            size="md"
                            onClick={() => {
                                setSelectedType(null);
                                setIsAddModalOpen(true);
                            }}
                        >
                            <Plus className="w-4 h-4" />
                            Add New
                        </Button>
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
                renderRow={(item) => (
                    <>
                        <td className="p-4 flex items-center gap-3 font-bold text-gray-700">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-sm shrink-0">
                                <Box className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-semibold">{item.name}</span>
                        </td>
                        <td className="p-4 text-text-secondary font-medium">
                            {item.hostel?.name || item.organization?.name || "--"}
                        </td>
                        <td className="p-4 text-text-secondary">
                            {item.total || item.assets?.total || 0}
                        </td>
                        <td className="p-4 text-text-secondary">
                            {item.allocated || item.assets?.allocated || 0}
                        </td>
                        <td className="p-4 text-text-secondary">
                            {item.available || item.assets?.available || 0}
                        </td>
                        <td className="p-4 text-right">
                            <Button
                                variant="ghost"
                                fullWidth={false}
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedType(item);
                                    setIsAddModalOpen(true);
                                }}
                                title="Edit"
                            >
                                <Edit2 className="w-4 h-4" />
                            </Button>
                        </td>
                    </>
                )}
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

            {isDetailsModalOpen && selectedType && (
                <AdminFurnitureDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={() => {
                        setIsDetailsModalOpen(false);
                        setSelectedType(null);
                    }}
                    item={selectedType}
                    onViewList={(item) => navigate(`/dashboard/furniture/${item._id}`)}
                    onUpdateSuccess={handleAdjustStock}
                />
            )}

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Furniture"
                subtitle="Select status filter before downloading"
                fields={exportFields}
            />
        </div>
    );
}
