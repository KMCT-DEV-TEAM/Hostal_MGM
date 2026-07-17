import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Archive, CheckCircle2, XCircle, AlertTriangle, Hammer, Hash, Box, PackageCheck, PackageOpen, Trash2, Filter, Download, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import furnitureApi from '@/features/furniture/api/furnitureApi';
import DataView from '@/components/ui/data-view/DataView';
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
import AssetDetailsModal from '../components/modals/AssetDetailsModal';
import FurnitureStatusBadge from '../components/badges/FurnitureStatusBadge';
import { useFurnitureAssets } from '../hooks/useFurnitureAssets';
import { exportToExcel } from '@/utils/exportUtils';
import { formatDateISO } from '@/utils/formatters';
import BackButton from '@/components/ui/BackButton';

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
    const [stats, setStats] = useState(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isAssetDetailsModalOpen, setIsAssetDetailsModalOpen] = useState(false);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [limit, setLimit] = useState(10);

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

            const statsRes = await furnitureApi.getAssetsDashboardSummary(id);
            setStats(statsRes.data?.summary || statsRes.data?.data || statsRes.data || null);
        } catch (error) {
            console.error("Failed to fetch type details or stats:", error);
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




    const handleStatusChange = async (assetId, payload) => {
        try {
            await furnitureApi.changeAssetStatus(assetId, payload);
            showSuccessToast('Status updated successfully');
            fetchAssets();
            setIsStatusModalOpen(false);
        } catch (error) {
            console.error(error);
            showErrorToast('Failed to update status');
        }
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
                    'Added On': formatDateISO(r.createdAt)
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
                { label: 'Available', value: 'available' },
                { label: 'Allocated', value: 'allocated' },
                { label: 'Maintenance', value: 'maintenance' },
                { label: 'Lost', value: 'lost' },
                { label: 'Scrap', value: 'scrap' }
            ]
        }
    ];

    const titleName = details?.name || 'Furniture';
    const pageTitle = titleName;
    const pageSubtitle = `Manage all furnitures of ${titleName}`;

    const columns = [
        {
            key: 'code',
            header: 'Furniture',
            renderCell: (item) => (
                <div className="flex flex-col">
                    <span className="text-gray-900 font-medium">{item.furnitureId}</span>
                    <span className="text-xs text-gray-500">{titleName}</span>
                </div>
            )
        },
        {
            key: 'allocatedTo',
            header: 'Assigned To',
            renderCell: (item) => {
                if (item.studentId && item.studentId.name && typeof item.studentId.name === 'string') {
                    return (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                {item.studentId.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-gray-900 font-medium">{item.studentId.name}</span>
                        </div>
                    );
                }
                return <span className="text-gray-500">-</span>;
            }
        },
        {
            key: 'status',
            header: 'Status',
            renderCell: (item) => <FurnitureStatusBadge status={item.status} />
        },
        {
            key: 'actions',
            header: 'Action',
            align: 'right',
            renderCell: (item) => (
                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
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
            )
        }
    ];

    const cardConfig = {
        avatar: (item) => titleName.split(' ').map(n => n[0]).join('').toUpperCase(),
        title: (item) => item.furnitureId || "--",
        subtitle: (item) => titleName,
        status: (item) => ({
            text: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : "Unknown",
            color: item.status === 'available' ? 'green' :
                item.status === 'allocated' ? 'blue' :
                    item.status === 'maintenance' ? 'yellow' :
                        item.status === 'scrap' || item.status === 'lost' ? 'red' : 'gray'
        }),
        fields: [
            { icon: User, accessor: (item) => item.studentId?.name || "Unassigned" }
        ],
        onEdit: () => setIsStatusModalOpen(true),
        onClick: (item) => handleRowClick(item),
        canSelect: false
    };

    const toolbarEndSlot = (
        <div className="flex items-center gap-2">

            <Dropdown
                options={[
                    { label: 'All Status', value: 'All' },
                    { label: 'Available', value: 'available' },
                    { label: 'Allocated', value: 'allocated' },
                    { label: 'Maintenance', value: 'maintenance' },
                    { label: 'Lost', value: 'lost' },
                    { label: 'Scrap', value: 'scrap' }
                ]}
                value={statusFilter}
                onChange={(val) => updateSearchParams({ status: val, page: 1 })}
                placeholder="All Status"
                minWidth="w-[140px]"
            />
            <Button
                variant='outline'
                fullWidth={false}
                size="md"
                onClick={handleExport}
            >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
            </Button>
        </div>
    );

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="mb-6 shrink-0 flex items-center gap-3">
                    <PageHeader title={pageTitle} subtitle={pageSubtitle} actionButton={<BackButton text="Back to List" onClick={() => navigate('/dashboard/furniture')} />} />
                </div>

                {/* Stat Cards */}
                <div className="lg:grid hidden grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
                    <StatsCard
                        label="TOTAL FURNITURES"
                        value={stats?.totalAssets || 0}
                        icon={<Box className="w-5 h-5" />}
                        iconBg="bg-blue-50 text-blue-500"
                        borderColor='border-t-2 border-t-blue-500'
                    />
                    <StatsCard
                        label="ASSIGNED FURNITURES"
                        value={stats?.allocated || 0}
                        icon={<PackageCheck className="w-5 h-5" />}
                        iconBg="bg-success/10 text-success"
                        borderColor='border-t-2 border-t-success/70'
                    />
                    <StatsCard
                        label="AVAILABLE FURNITURES"
                        value={stats?.available || 0}
                        icon={<PackageOpen className="w-5 h-5" />}
                        iconBg="bg-cyan-50 text-cyan-500"
                        borderColor='border-t-2 border-t-cyan-500'
                    />
                </div>

                <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col mt-4 md:mt-6">
                    <DataView
                        pageScrollMode={true}
                        className="h-full border-none shadow-none"
                        toolbarEndSlot={toolbarEndSlot}
                        searchQuery={searchInput}
                        onSearchChange={(e) => setSearchInput(e.target.value)}
                        searchPlaceholder="Search assets..."
                        columns={columns}
                        cardConfig={cardConfig}
                        data={assets}
                        canSelect={true}
                        selectedIds={selectedIds}
                        onSelectAll={handleSelectAll}
                        onSelectRow={handleSelect}
                        onRowClick={handleRowClick}
                        emptyText="No assets found."
                        loading={loading}
                        page={page}
                        setPage={(p) => updateSearchParams({ page: p })}
                        limit={limit}
                        setLimit={setLimit}
                        totalItems={pagination?.totalRecords || 0}
                        totalPages={pagination?.totalPages || 1}
                    />
                </div>

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
        </div>
    );
}
