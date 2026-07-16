import React, { useState, useEffect } from 'react';
import { Plus, Download, Edit2, Box, PackageCheck, PackageOpen } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import furnitureApi from '@/features/furniture/api/furnitureApi';
import DataView from '@/components/ui/data-view/DataView';
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
    const [limit, setLimit] = useState(10);

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

    const columns = [
        {
            key: 'name',
            header: 'Furniture',
            type: 'user',
            titleAccessor: (item) => item.name,
            avatarAccessor: (item) => item.name,
        },
        { key: 'organization', header: 'Organization', accessor: (item) => item.organization?.name || "--" },
        { key: 'hostel', header: 'Hostel', accessor: (item) => item.hostel?.name || "--" },
        { key: 'total', header: 'Quantity', accessor: (item) => item.total || item.assets?.total || 0, align: 'center' },
        { key: 'allocated', header: 'Assigned', accessor: (item) => item.allocated || item.assets?.allocated || 0, align: 'center' },
        { key: 'available', header: 'Available', accessor: (item) => item.available || item.assets?.available || 0, align: 'center' },
    ];

    if (isAdmin) {
        columns.push({
            key: 'actions',
            header: 'Action',
            align: 'center',
            renderCell: (item) => (
                <div onClick={(e) => e.stopPropagation()} className="flex justify-center">
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
                </div>
            )
        });
    }

    const cardConfig = {
        avatar: (item) => item.name?.substring(0, 2).toUpperCase(),
        title: (item) => item.name,
        subtitle: (item) => item.organization?.name || "No Organization",
        fields: [
            { icon: Box, accessor: (item) => item.hostel?.name || "--" }
        ],
        stats: (item) => [
            { label: "Quantity", value: item.total || item.assets?.total || 0 },
            { label: "Assigned", value: item.allocated || item.assets?.allocated || 0 },
            { label: "Available", value: item.available || item.assets?.available || 0 }
        ],
        onEdit: isAdmin ? (item) => {
            setSelectedType(item);
            setIsAddModalOpen(true);
        } : undefined
    };

    const toolbarEndSlot = (
        <div className="flex items-center gap-2">

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
                <span className="hidden sm:inline">Export</span>
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
                    <span className="hidden sm:inline">Add New</span>
                </Button>
            )}
        </div>
    );

    const handleRowClick = (item) => {
        setSelectedType(item);
        setIsDetailsModalOpen(true);
    };

    const totalFurnitures = dashboardStats?.totalAssets || 0;
    const assignedFurnitures = dashboardStats?.allocated || 0;
    const availableFurnitures = dashboardStats?.available || 0;

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="mb-6 shrink-0">
                    <PageHeader title={pageTitle} subtitle={pageSubtitle} />
                </div>

                {/* Stat Cards */}
                <div className="md:grid hidden grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
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

                <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col mt-4 md:mt-6">
                    <DataView
                        pageScrollMode={true}
                        className="h-full border-none shadow-none"
                        toolbarEndSlot={toolbarEndSlot}
                        searchQuery={searchInput}
                        onSearchChange={(e) => setSearchInput(e.target.value)}
                        searchPlaceholder="Search furniture types..."
                        columns={columns}
                        cardConfig={cardConfig}
                        data={types}
                        canSelect={isAdmin}
                        selectedIds={selectedIds}
                        onSelectAll={handleSelectAll}
                        onSelectRow={handleSelect}
                        onRowClick={handleRowClick}
                        emptyText="No furniture types found."
                        loading={loading}
                        page={page}
                        setLimit={setLimit}
                        setPage={(p) => updateSearchParams({ page: p })}
                        limit={limit}
                        totalItems={pagination.totalRecords}
                        totalPages={pagination.totalPages}
                    />
                </div>

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
        </div>
    );
}
