import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Archive, CheckCircle2, XCircle, AlertTriangle, Hammer, Hash, Box, PackageCheck, PackageOpen, Trash2, Filter, Download } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import furnitureApi from '@/features/furniture/api/furnitureApi';
import DataTable from '@/components/ui/DataTable';
import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import AdjustStockModal from '../components/modals/AdjustStockModal';
import ChangeAssetStatusModal from '../components/modals/ChangeAssetStatusModal';
import AllocateAssetModal from '../components/modals/AllocateAssetModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function FurnitureDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [details, setDetails] = useState(null);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1 });
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, asset: null });
    const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const limit = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (id) {
            fetchTypeDetails();
            fetchAssets();
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchAssets();
    }, [page, debouncedSearch]);

    const fetchTypeDetails = async () => {
        try {
            const res = await furnitureApi.getFurnitureTypeDetails(id);
            setDetails(res.data?.type || res.data || res.type || res.summary || null);
        } catch (error) {
            console.error("Failed to fetch type details:", error);
            showErrorToast(error.message || 'Failed to fetch details');
            navigate('/dashboard/furniture');
        }
    };

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const res = await furnitureApi.getFurnitureTypeAssets(id, {
                page,
                limit,
                search: debouncedSearch
            });
            setAssets(res.data?.data || res.data?.assets || res.assets || []);
            setPagination({
                totalPages: res.data?.totalPages || res.pagination?.totalPages || 1,
                totalRecords: res.data?.totalCount || res.pagination?.totalRecords || 0
            });
        } catch (error) {
            showErrorToast(error.message || 'Failed to fetch assets');
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = () => {
        fetchTypeDetails();
        fetchAssets();
    };

    const handleSelectAll = () => {
        if (selectedIds.length === assets.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(assets.map(a => a._id));
        }
    };

    const handleSelect = (assetId) => {
        setSelectedIds(prev =>
            prev.includes(assetId) ? prev.filter(i => i !== assetId) : [...prev, assetId]
        );
    };

    const handleDeleteSelected = () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} assets?`)) return;
        showSuccessToast('Selected assets deleted successfully');
        setSelectedIds([]);
        fetchDetails();
    };

    const handleAdjustStock = async (count) => {
        try {
            await furnitureApi.adjustAssetsCount(id, count);
            showSuccessToast('Stock adjusted successfully');
            setIsAdjustModalOpen(false);
            fetchDetails();
        } catch (error) {
            showErrorToast(error.message || 'Failed to adjust stock');
            throw error;
        }
    };

    const handleStatusChange = async (assetId, status) => {
        try {
            await furnitureApi.changeAssetStatus(assetId, { status });
            showSuccessToast('Asset status updated successfully');
            setIsStatusModalOpen(false);
            fetchAssets();
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
            fetchDetails(); // refresh everything as total counts might change
        } catch (error) {
            showErrorToast(error.message || 'Failed to allocate asset');
            throw error;
        }
    };

    const handleConfirmAction = async () => {
        if (!confirmModal.asset) return;
        const assetId = confirmModal.asset._id;
        setIsConfirmSubmitting(true);
        try {
            if (confirmModal.type === 'return') {
                const studentId = confirmModal.asset.studentId?._id;
                await furnitureApi.returnAsset(studentId, assetId);
                showSuccessToast('Asset returned successfully');
            } else if (confirmModal.type === 'startMaintenance') {
                await furnitureApi.startMaintenance(assetId);
                showSuccessToast('Maintenance started');
            } else if (confirmModal.type === 'completeMaintenance') {
                await furnitureApi.completeMaintenance(assetId);
                showSuccessToast('Maintenance completed');
            }
            setConfirmModal({ isOpen: false, type: null, asset: null });
            fetchDetails();
        } catch (error) {
            showErrorToast(error.message || `Failed to ${confirmModal.type}`);
        } finally {
            setIsConfirmSubmitting(false);
        }
    };

    const openConfirmModal = (type, asset) => {
        setConfirmModal({ isOpen: true, type, asset });
    };

    const tableHeaders = [
        { key: 'code', label: 'Furniture' },
        { key: 'hostel', label: 'Hostel' },
        { key: 'allocatedTo', label: 'Assigned To' },
        { key: 'status', label: 'Status' },
        { key: 'actions', label: 'Action' }
    ];

    const getStatusStyle = (status) => {
        if (status === 'Available') return 'text-[var(--color-success)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/20';
        if (status === 'Allocated') return 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20';
        if (status === 'Maintenance') return 'text-[var(--color-warning)] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20';
        if (status === 'Lost') return 'text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20';
        return 'text-gray-700 bg-gray-100 border border-gray-200';
    };

    const titleName = details?.name || 'Furniture';
    const pageTitle = titleName;
    const pageSubtitle = `Manage all furnitures of ${titleName}`;

    return (
        <div className="w-full h-full overflow-hidden p-4 md:p-6 flex flex-col bg-background-secondary">
            {/* Header */}
            <div className="mb-6 shrink-0 flex items-center gap-4">
                <button
                    onClick={() => navigate('/dashboard/furniture')}
                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors self-start mt-1"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <PageHeader title={pageTitle} subtitle={pageSubtitle} />
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
                <StatsCard
                    label="TOTAL FURNITURES"
                    value={details?.total || details?.assets?.total || 0}
                    icon={<Box className="w-5 h-5" />}
                    iconBg="bg-blue-50 text-blue-500"
                />
                <StatsCard
                    label="ASSIGNED FURNITURES"
                    value={details?.allocated || details?.assets?.allocated || 0}
                    icon={<PackageCheck className="w-5 h-5" />}
                    iconBg="bg-success/10 text-success"
                />
                <StatsCard
                    label="AVAILABLE FURNITURES"
                    value={details?.available || details?.assets?.available || 0}
                    icon={<PackageOpen className="w-5 h-5" />}
                    iconBg="bg-cyan-50 text-cyan-500"
                />
            </div>

            <DataTable
                toolbarActions={
                    <>
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleDeleteSelected}
                                className="px-4 py-2 border border-red-200 text-danger bg-red-50 hover:bg-red-100 text-sm font-semibold rounded-xl transition-colors"
                            >
                                Delete ( {selectedIds.length} )
                            </button>
                        )}
                        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium inline-flex items-center gap-2 hover:bg-gray-50 transition-colors">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium inline-flex items-center gap-2 hover:bg-gray-50 transition-colors">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </>
                }
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Search assets..."
                headers={tableHeaders}
                items={assets}
                canSelect={true}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onSelect={handleSelect}
                emptyText="No assets found."
                isLoading={loading}
                renderRow={(item) => {
                    return (
                        <>
                            <td className="p-4 text-sm text-gray-500 font-medium">
                                <div className="flex flex-col">
                                    <span className="text-gray-900">{item.furnitureId}</span>
                                    <span className="text-xs">{titleName}</span>
                                </div>
                            </td>
                            <td className="p-4 text-sm text-gray-900 font-medium">
                                {item.hostelId?.name || '--------'}
                            </td>
                            <td className="p-4 text-sm text-gray-500">
                                {item.studentId ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                                            {item.studentId.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-gray-900 font-medium">{item.studentId.name}</span>
                                    </div>
                                ) : (
                                    <span>-</span>
                                )}
                            </td>
                            <td className="p-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(item.status)}`}>
                                    {item.status}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {item.status === 'Available' && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedAsset(item);
                                                    setIsAllocateModalOpen(true);
                                                }}
                                                className="px-2 py-1 text-xs font-semibold text-primary bg-primary/10 rounded hover:bg-primary/20 transition-colors"
                                                title="Allocate to Student"
                                            >
                                                Allocate
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openConfirmModal('startMaintenance', item);
                                                }}
                                                className="px-2 py-1 text-xs font-semibold text-warning bg-warning/10 rounded hover:bg-warning/20 transition-colors"
                                                title="Start Maintenance"
                                            >
                                                Start Maint.
                                            </button>
                                        </>
                                    )}
                                    {item.status === 'Allocated' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openConfirmModal('return', item);
                                            }}
                                            className="px-2 py-1 text-xs font-semibold text-success bg-success/10 rounded hover:bg-success/20 transition-colors"
                                            title="Return Asset"
                                        >
                                            Return
                                        </button>
                                    )}
                                    {item.status === 'Maintenance' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openConfirmModal('completeMaintenance', item);
                                            }}
                                            className="px-2 py-1 text-xs font-semibold text-success bg-success/10 rounded hover:bg-success/20 transition-colors"
                                            title="Complete Maintenance"
                                        >
                                            Complete Maint.
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedAsset(item);
                                            setIsStatusModalOpen(true);
                                        }}
                                        className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors ml-2"
                                        title="Change Status"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
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

            {isAdjustModalOpen && (
                <AdjustStockModal
                    isOpen={isAdjustModalOpen}
                    onClose={() => setIsAdjustModalOpen(false)}
                    onSave={handleAdjustStock}
                    furnitureName={titleName}
                />
            )}

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
                onClose={() => !isConfirmSubmitting && setConfirmModal({ isOpen: false, type: null, asset: null })}
                onConfirm={handleConfirmAction}
                isSubmitting={isConfirmSubmitting}
                title={
                    confirmModal.type === 'return' ? 'Return Asset' :
                        confirmModal.type === 'startMaintenance' ? 'Start Maintenance' : 'Complete Maintenance'
                }
                message={
                    confirmModal.type === 'return' ? `Are you sure you want to mark ${confirmModal.asset?.furnitureId} as returned from ${confirmModal.asset?.studentId?.name}?` :
                        confirmModal.type === 'startMaintenance' ? `Are you sure you want to send ${confirmModal.asset?.furnitureId} for maintenance?` :
                            `Are you sure you want to complete maintenance for ${confirmModal.asset?.furnitureId}?`
                }
                confirmText={confirmModal.type === 'return' ? 'Return Asset' : 'Confirm'}
            />
        </div>
    );
}
