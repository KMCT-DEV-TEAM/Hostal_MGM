import React, { useState, useEffect } from 'react';
import { Download, Box, PackageCheck, PackageOpen, Building2Icon, User } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import furnitureApi from '@/features/furniture/api/furnitureApi';
import DataView from '@/components/ui/data-view/DataView';
import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import Dropdown from '@/components/ui/Dropdown';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import AssetDetailsModal from '../components/modals/AssetDetailsModal';
import FurnitureStatusBadge from '../components/badges/FurnitureStatusBadge';
import { useFurnitureAssets } from '../hooks/useFurnitureAssets';
import { useDebounce } from '@/hooks/useDebounce';
import { exportToExcel } from '@/utils/exportUtils';
import { formatDateISO } from '@/utils/formatters';

export default function WardenFurniture() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const urlSearchQuery = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || 'All';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const [limit, setLimit] = useState(10);

    const [searchInput, setSearchInput] = useState(urlSearchQuery);
    const debouncedSearch = useDebounce(searchInput, 500);

    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [isAssetDetailsModalOpen, setIsAssetDetailsModalOpen] = useState(false);
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

    const { data: assets, pagination, loading, refetch: fetchFurnitureAssets } = useFurnitureAssets(null, {
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter === 'All' ? '' : statusFilter
    });

    const confirmExport = async (filters) => {
        setIsExporting(true);
        try {
            const params = {
                status: filters.status || statusFilter,
                limit: 5000,
                search: debouncedSearch
            };

            const res = await furnitureApi.getAllFurnitureAssets(params);
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

            const isSuccess = exportToExcel(exportData, `Furniture_Assets_Export`, "Assets");

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

    const pageTitle = 'Manage Furniture';
    const pageSubtitle = 'Manage all furnitures';

    const columns = [
        {
            key: 'furnitureId',
            header: 'Furniture Id',
            accessor: (r) => r.furnitureId || '--'
        },
        {
            key: 'furniture',
            header: 'Furniture',
            accessor: (r) => r.typeInfo?.name || '--'
        },
        {
            key: 'organization',
            header: 'Organization',
            accessor: (r) => r.organization?.name || '--'
        },
        {
            key: 'assignedTo',
            header: 'Assigned To',
            renderCell: (r) => {
                if (!r.studentId?.name) return <span>-</span>;
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                            {r.studentId.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-gray-900 font-medium">{r.studentId.name}</span>
                    </div>
                );
            }
        },
        {
            key: 'status',
            header: 'Status',
            renderCell: (r) => <FurnitureStatusBadge status={r.status} />
        }
    ];

    const cardConfig = {
        avatar: (r) => (r.typeInfo?.name || "F").substring(0, 2),
        title: (r) => r.typeInfo?.name || "Unknown Furniture",
        subtitle: (r) => r.furnitureId || "--",
        status: (r) => ({
            text: r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "Unknown",
            color: r.status === 'available' ? 'green' :
                r.status === 'allocated' ? 'blue' :
                    r.status === 'maintenance' ? 'yellow' :
                        (r.status === 'scrap' || r.status === 'lost') ? 'red' : 'gray'
        }),
        fields: [
            { icon: Building2Icon, accessor: (r) => r.organization?.name || "--" },
            { icon: User, accessor: (r) => r.studentId?.name || "Unassigned" }
        ]
    };

    const handleRowClick = (item) => {
        setSelectedAsset(item);
        setIsAssetDetailsModalOpen(true);
    };

    const totalFurnitures = dashboardStats?.totalAssets || 0;
    const assignedFurnitures = dashboardStats?.allocated || 0;
    const availableFurnitures = dashboardStats?.available || 0;

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-background-secondary flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
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

                <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col mt-4 md:mt-6">
                    <DataView
                        pageScrollMode={true}
                        className="h-full border-none shadow-none"
                        data={assets || []}
                        columns={columns}
                        cardConfig={cardConfig}
                        loading={loading}
                        searchQuery={searchInput}
                        onSearchChange={(e) => setSearchInput(e.target.value)}
                        searchPlaceholder="Search furniture assets..."
                        toolbarEndSlot={
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Dropdown
                                    options={[
                                        { label: 'All Status', value: 'All' },
                                        { label: 'Available', value: 'available' },
                                        { label: 'Allocated', value: 'allocated' },
                                        { label: 'Maintenance', value: 'maintenance' },
                                        { label: 'Inactive', value: 'inactive' },
                                        { label: 'Lost', value: 'lost' },
                                        { label: 'Scrap', value: 'scrap' }
                                    ]}
                                    value={statusFilter}
                                    onChange={(val) => updateSearchParams({ status: val, page: 1 })}
                                    placeholder="All Status"
                                    minWidth="w-[140px]"
                                    triggerClassName="flex-1 md:flex-none px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between transition-colors shadow-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsExportConfirmOpen(true)}
                                    className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-colors shrink-0 text-sm font-semibold shadow-sm w-10 md:w-auto"
                                    title="Export Furniture"
                                >
                                    <Download className="w-4 h-4 shrink-0" />
                                    <span className="hidden md:inline">Export</span>
                                </button>
                            </div>
                        }
                        onRowClick={handleRowClick}
                        page={page}
                        setPage={(p) => updateSearchParams({ page: p })}
                        limit={limit}
                        setLimit={setLimit}
                        totalItems={pagination?.totalRecords || 0}
                        totalPages={pagination?.totalPages || 1}
                        emptyText="No furniture assets found."
                    />

                    <ExportFilterModal
                        isOpen={isExportConfirmOpen}
                        onClose={() => setIsExportConfirmOpen(false)}
                        onExport={confirmExport}
                        isExporting={isExporting}
                        fields={exportFields}
                        title="Export Furniture Options"
                    />

                    {isAssetDetailsModalOpen && selectedAsset && (
                        <AssetDetailsModal
                            isOpen={isAssetDetailsModalOpen}
                            onClose={() => {
                                setIsAssetDetailsModalOpen(false);
                                setSelectedAsset(null);
                            }}
                            assetId={selectedAsset._id || selectedAsset.id}
                            organizationName={selectedAsset.furnitureTypeId?.organization?.name}
                            hostelName={selectedAsset.hostelId?.name}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
