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
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import ChangeAssetStatusModal from '../components/modals/ChangeAssetStatusModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import AssetDetailsModal from '../components/modals/AssetDetailsModal';
import FurnitureStatusBadge from '../components/badges/FurnitureStatusBadge';
import { useFurnitureAssets } from '../hooks/useFurnitureAssets';
import { exportToExcel } from '@/utils/exportUtils';
import { formatDate } from '@/utils/formatters';

export default function FurnitureDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();
    const role = useAuthStore((s) => s.user?.role);
    const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
    
    const urlSearchQuery = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const statusFilter = searchParams.get('status') || 'All';

    const [searchInput, setSearchInput] = useState(urlSearchQuery);
    const debouncedSearch = useDebounce(searchInput, 500);

    const [details, setDetails] = useState(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isAssetDetailsModalOpen, setIsAssetDetailsModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, asset: null });
    const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const limit = 10;

    const { data: assets, pagination, loading, refetch: fetchAssets } = useFurnitureAssets(id, {
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter === 'All' ? '' : statusFilter
    });

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
            updateSearchParams({ search: debouncedSearch, page: 1 });
        }
    }, [debouncedSearch]);

    useEffect(() => {
        setSearchInput(urlSearchQuery);
    }, [urlSearchQuery]);

    useEffect(() => {
        if (id) {
            fetchTypeDetails();
        }
    }, [id]);

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

    const handleRowClick = (item) => {
        setSelectedAsset(item);
        setIsAssetDetailsModalOpen(true);
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

    const handleExport = async () => {
        setIsExportConfirmOpen(true);
    };

    const confirmExport = async (filters) => {
        setIsExporting(true);
        try {
            const exportParams = {
                status: statusFilter === 'All' ? '' : statusFilter,
                limit: 5000,
                search: debouncedSearch
            };
            
            const res = await furnitureApi.getFurnitureTypeAssets(id, exportParams);
            const dataToExport = res?.data?.data?.assets || res?.data?.assets || [];

            if (dataToExport.length === 0) {
                showErrorToast('Export failed', 'No furniture records match the selected filters');
                setIsExportConfirmOpen(false);
                setIsExporting(false);
                return;
            }

            const exportData = dataToExport.map((r, index) => {
                return {
                    'Sl No': index + 1,
                    'Furniture ID': r.furnitureId || '--',
                    'Furniture Type': r.furnitureTypeId?.name || '--',
                    'Hostel': r.hostelId?.name || '--',
                    'Assigned To': r.studentId?.name || 'Unassigned',
                    'Status': r.status || '--',
                    'Added On': formatDate(r.createdAt)
                };
            });

            const isSuccess = exportToExcel(exportData, `Furniture_Type_${titleName}_Assets`, "Assets");
            
            if (isSuccess) {
                showSuccessToast('Exported successfully');
            } else {
                showErrorToast('Export failed', 'Could not generate the Excel file');
            }
            setIsExportConfirmOpen(false);
        } catch (error) {
            showErrorToast('Failed to export data', error.message);
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
                { label: 'Allocated', value: 'Allocated' },
                { label: 'Maintenance', value: 'Maintenance' },
                { label: 'Lost', value: 'Lost' }
            ]
        }
    ];

    const tableHeaders = [
        { key: 'code', label: 'Furniture' },
        { key: 'hostel', label: 'Hostel' },
        { key: 'allocatedTo', label: 'Assigned To' },
        { key: 'status', label: 'Status' },
        { key: 'actions', label: 'Action' }
    ];

    const titleName = details?.name || 'Furniture';
    const pageTitle = titleName;
    const pageSubtitle = `Manage all furnitures of ${titleName}`;

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden p-4 md:p-6 flex flex-col">
            {/* Header */}
            <div className="mb-6 shrink-0 flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => navigate('/dashboard/furniture')}
                    className="p-2 border border-gray-200 rounded-xl bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                    title="Back to List"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <PageHeader title={pageTitle} subtitle={pageSubtitle} />
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
                <StatsCard
                    label="TOTAL FURNITURES"
                    value={details?.total || details?.assets?.total || 0}
                    icon={<Box className="w-5 h-5" />}
                    iconBg="bg-blue-50 text-blue-500"
                    borderColor='border-t-2 border-t-blue-500'
                />
                <StatsCard
                    label="ASSIGNED FURNITURES"
                    value={details?.allocated || details?.assets?.allocated || 0}
                    icon={<PackageCheck className="w-5 h-5" />}
                    iconBg="bg-success/10 text-success"
                    borderColor='border-t-2 border-t-success/70'
                />
                <StatsCard
                    label="AVAILABLE FURNITURES"
                    value={details?.available || details?.assets?.available || 0}
                    icon={<PackageOpen className="w-5 h-5" />}
                    iconBg="bg-cyan-50 text-cyan-500"
                    borderColor='border-t-2 border-t-cyan-500'
                />
            </div>

            <DataTable
                toolbarActions={
                    <>
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-danger hover:bg-red-100 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                            >
                                Delete ( {selectedIds.length} )
                            </button>
                        )}
                        <Dropdown
                            options={[
                                { label: 'All Status', value: 'All' },
                                { label: 'Available', value: 'Available' },
                                { label: 'Allocated', value: 'Allocated' },
                                { label: 'Maintenance', value: 'Maintenance' },
                                { label: 'Lost', value: 'Lost' }
                            ]}
                            value={statusFilter}
                            onChange={(val) => updateSearchParams({ status: val, page: 1 })}
                            placeholder="All Status"
                            minWidth="w-[140px]"
                        />
                        <button
                            onClick={handleExport}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-text-secondary hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </>
                }
                searchQuery={searchInput}
                onSearchChange={(e) => setSearchInput(e.target.value)}
                searchPlaceholder="Search assets..."
                headers={tableHeaders}
                items={assets}
                canSelect={true}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onSelect={handleSelect}
                onRowClick={handleRowClick}
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
                                {item.studentId && item.studentId.name && typeof item.studentId.name === 'string' ? (
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
                                <FurnitureStatusBadge status={item.status} />
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {item.status === 'Available' && (
                                        <>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                fullWidth={false}
                                                className="text-warning hover:bg-warning/5"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openConfirmModal('startMaintenance', item);
                                                }}
                                            >
                                                <Hammer className="w-4 h-4 mr-1.5" />
                                                Maintenance
                                            </Button>
                                        </>
                                    )}
                                    {item.status === 'Allocated' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            fullWidth={false}
                                            className="text-success hover:bg-success/5"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openConfirmModal('return', item);
                                            }}
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                            Return
                                        </Button>
                                    )}
                                    {item.status === 'Maintenance' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            fullWidth={false}
                                            className="text-success hover:bg-success/5"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openConfirmModal('completeMaintenance', item);
                                            }}
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                            Complete
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        fullWidth={false}
                                        className="text-gray-400 hover:text-gray-900"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedAsset(item);
                                            setIsStatusModalOpen(true);
                                        }}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </td>
                        </>
                    );
                }}
                page={page}
                setPage={(p) => updateSearchParams({ page: p })}
                limit={limit}
                totalItems={pagination.totalRecords}
                totalPages={pagination.totalPages}
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
            {isAssetDetailsModalOpen && selectedAsset && (
                <AssetDetailsModal
                    isOpen={isAssetDetailsModalOpen}
                    onClose={() => {
                        setIsAssetDetailsModalOpen(false);
                        setSelectedAsset(null);
                    }}
                    assetId={selectedAsset._id || selectedAsset.id}
                    organizationName={details?.organization?.name}
                    hostelName={details?.hostel?.name}
                />
            )}
            
            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Furniture Assets"
                fields={exportFields}
            />
        </div>
    );
}
