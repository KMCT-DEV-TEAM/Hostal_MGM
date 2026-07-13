import React, { useState, useEffect } from 'react';
import { Plus, Download, Edit2, Box, PackageCheck, PackageOpen } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import furnitureApi from '@/features/furniture/api/furnitureApi';
import DataTable from '@/components/ui/DataTable';
import { InfoCard } from '@/components/ui/InfoCard';
import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import Dropdown from '@/components/ui/Dropdown';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import AddFurnitureModal from '../components/modals/AddFurnitureModal';
import AdminFurnitureDetailsModal from '../components/modals/AdminFurnitureDetailsModal';
import ChangeAssetStatusModal from '../components/modals/ChangeAssetStatusModal';
import AllocateAssetModal from '../components/modals/AllocateAssetModal';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import { useFurnitureTypes } from '../hooks/useFurnitureTypes';
import { useDebounce } from '@/hooks/useDebounce';

export default function AdminFurniture() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const role = useAuthStore((s) => s.user?.role);
    const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;

    const urlSearchQuery = searchParams.get('search') || '';
    const statusFilter = searchParams.get('isActive') || 'All';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 10;

    const [searchInput, setSearchInput] = useState(urlSearchQuery);
    const debouncedSearch = useDebounce(searchInput, 500);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null });
    const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);
    const [selectedType, setSelectedType] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);

    const updateSearchParams = (updates) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '' || value === 'All') {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        });
        setSearchParams(newParams);
    };

    useEffect(() => {
        if (debouncedSearch !== urlSearchQuery) {
            const newParams = new URLSearchParams(searchParams);
            if (!debouncedSearch) {
                newParams.delete('search');
            } else {
                newParams.set('search', debouncedSearch);
            }
            newParams.set('page', 1);
            setSearchParams(newParams);
        }
    }, [debouncedSearch, urlSearchQuery, searchParams, setSearchParams]);

    useEffect(() => {
        setSearchInput(urlSearchQuery);
    }, [urlSearchQuery]);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const res = await furnitureApi.getDashboardStats();
            setDashboardStats(res.data?.summary || res.summary || null);
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        }
    };

    const { data: types, pagination, loading, refetch: fetchFurnitureTypes } = useFurnitureTypes({
        page,
        limit,
        search: debouncedSearch,
        isActive: statusFilter === 'All' ? '' : statusFilter
    });

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
            fetchDashboardStats();
        } catch (error) {
            showErrorToast(error.message || 'Failed to save furniture type');
            throw error;
        }
    };

    const handleAdjustStock = async (typeId, newTotal) => {
        try {
            await furnitureApi.adjustAssetsCount(typeId, { count: newTotal });
            showSuccessToast('Stock adjusted successfully');
            fetchFurnitureTypes();
            fetchDashboardStats();

            if (isDetailsModalOpen && selectedType && selectedType._id === typeId) {
                const diff = newTotal - (selectedType.total || selectedType.assets?.total || 0);
                setSelectedType(prev => ({
                    ...prev,
                    total: newTotal,
                    available: prev.available + diff,
                    assets: prev.assets ? {
                        ...prev.assets,
                        total: newTotal,
                        available: (prev.assets.available || 0) + diff
                    } : undefined
                }));
            }
        } catch (error) {
            showErrorToast(error.message || 'Failed to adjust stock');
        }
    };

    const handleStatusChange = async (assetId, payload) => {
        try {
            await furnitureApi.changeAssetStatus(assetId, payload);
            showSuccessToast('Asset status updated successfully');
            setIsStatusModalOpen(false);
            fetchFurnitureTypes();
            fetchDashboardStats();
        } catch (error) {
            showErrorToast(error.message || 'Failed to update asset status');
            throw error;
        }
    };

    const handleAllocate = async (studentId, assetId) => {
        try {
            await furnitureApi.allocateAsset(studentId, assetId);
            showSuccessToast('Asset allocated successfully');
            setIsAllocateModalOpen(false);
            fetchFurnitureTypes();
            fetchDashboardStats();
        } catch (error) {
            showErrorToast(error.message || 'Failed to allocate asset');
            throw error;
        }
    };

    const confirmExport = async (filters) => {
        setIsExporting(true);
        try {
            // Placeholder for real export
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
            name: "isActive",
            label: "Status",
            options: [
                { label: 'All Status', value: 'All' },
                { label: 'Active', value: 'true' },
                { label: 'Inactive', value: 'false' },
            ]
        }
    ];

    const handleDeleteSelected = async () => {
        setIsConfirmSubmitting(true);
        try {
            for (const id of selectedIds) {
                await furnitureApi.deleteFurnitureType(id);
            }
            showSuccessToast('Selected furniture types deleted');
            setSelectedIds([]);
            fetchFurnitureTypes();
            fetchDashboardStats();
        } catch (error) {
            showErrorToast(error.message || 'Failed to delete some furniture types');
        } finally {
            setIsConfirmSubmitting(false);
            setConfirmModal({ isOpen: false, type: null });
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === types.length && types.length > 0) {
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
        { key: 'organization', label: 'Organization' },
        { key: 'hostel', label: 'Hostel' },
        { key: 'total', label: 'Quantity' },
        { key: 'allocated', label: 'Assigned' },
        { key: 'available', label: 'Available' },
    ];
    if (isAdmin) {
        tableHeaders.push({ key: 'actions', label: 'Action', align: 'center' });
    }

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
            <div className="lg:grid hidden grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
                <StatsCard
                    label="TOTAL FURNITURES"
                    value={totalFurnitures}
                    icon={<Box className="w-5 h-5" />}
                    iconBg="bg-secondary/10 text-secondary"
                    borderColor='border-t-2 border-t-secondary/70'
                />
                <StatsCard
                    label="ASSIGNED FURNITURES"
                    value={assignedFurnitures}
                    icon={<PackageCheck className="w-5 h-5" />}
                    iconBg="bg-success/10 text-success"
                    borderColor='border-t-2 border-t-success/70'
                />
                <StatsCard
                    label="AVAILABLE FURNITURES"
                    value={availableFurnitures}
                    icon={<PackageOpen className="w-5 h-5" />}
                    iconBg="bg-secondary/10 text-secondary/70"
                    borderColor='border-t-2 border-t-secondary/70'
                />
            </div>

            <DataTable
                toolbarActions={
                    <>
                        {isAdmin && selectedIds.length > 0 && (
                            <Button
                                variant="outline"
                                fullWidth={false}
                                size="md"
                                onClick={() => setConfirmModal({ isOpen: true, type: 'deleteSelected' })}
                                className="border-red-200 text-danger bg-red-50 hover:bg-red-100"
                            >
                                Delete ({selectedIds.length})
                            </Button>
                        )}
                        <Dropdown
                            options={[
                                { label: 'All Status', value: 'All' },
                                { label: 'Active', value: 'true' },
                                { label: 'Inactive', value: 'false' }
                            ]}
                            value={statusFilter}
                            onChange={(val) => updateSearchParams({ isActive: val, page: 1 })}
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

                        {isAdmin && (
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
                        )}
                    </>
                }
                searchQuery={searchInput}
                onSearchChange={(e) => setSearchInput(e.target.value)}
                searchPlaceholder="Search furniture types..."
                headers={tableHeaders}
                items={types}
                canSelect={isAdmin}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onSelect={handleSelect}
                onRowClick={handleRowClick}
                emptyText="No furniture types found."
                loading={loading}
                renderRow={(item) => (
                    <>
                        <td className="p-4 flex items-center gap-3 font-bold text-gray-700">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-sm shrink-0">
                                <Box className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-semibold">{item.name}</span>
                        </td>
                        <td className="p-4 text-text-secondary font-medium">
                            {item.organization?.name || "--"}
                        </td>
                        <td className="p-4 text-text-secondary font-medium">
                            {item.hostel?.name || "--"}
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
                        {isAdmin && (
                            <td className="p-4 text-center">
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
                        )}
                    </>
                )}
                page={page}
                setPage={(p) => updateSearchParams({ page: p })}
                limit={limit}
                totalItems={pagination.totalRecords}
                totalPages={pagination.totalPages}
                renderMobileItem={(item) => (
                    <div className="mb-2">
                        <InfoCard
                            avatar={item.name}
                            title={item.name}
                            subtitle={item.organization?.name || "No Organization"}
                            fields={[
                                { label: "Hostel", value: item.hostel?.name || "--" },

                            ]}
                            stats={[
                                { label: "Quantity", value: item.total || item.assets?.total || 0 },
                                { label: "Assigned", value: item.allocated || item.assets?.allocated || 0 },
                                { label: "Available", value: item.available || item.assets?.available || 0 }
                            ]}
                            editable={isAdmin}
                            onEdit={isAdmin ? () => {
                                setSelectedType(item);
                                setIsAddModalOpen(true);
                            } : undefined}
                            onClick={() => handleRowClick(item)}
                        />
                    </div>
                )}
            />

            {isAddModalOpen && isAdmin && (
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
                fields={exportFields}
                title="Export Furniture Options"
            />

            {isStatusModalOpen && (
                <ChangeAssetStatusModal
                    isOpen={isStatusModalOpen}
                    onClose={() => {
                        setIsStatusModalOpen(false);
                        setSelectedAsset(null);
                    }}
                    onSave={handleStatusChange}
                    asset={selectedAsset}
                />
            )}
            {isAllocateModalOpen && (
                <AllocateAssetModal
                    isOpen={isAllocateModalOpen}
                    onClose={() => {
                        setIsAllocateModalOpen(false);
                        setSelectedAsset(null);
                    }}
                    onAllocate={handleAllocate}
                    asset={selectedAsset}
                />
            )}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => !isConfirmSubmitting && setConfirmModal({ isOpen: false, type: null })}
                onConfirm={handleDeleteSelected}
                isSubmitting={isConfirmSubmitting}
                title="Delete Furniture Types"
                message={`Are you sure you want to delete ${selectedIds.length} selected furniture types? This action cannot be undone.`}
                confirmText="Delete"
                confirmButtonVariant="danger"
            />
        </div>
    );
}
