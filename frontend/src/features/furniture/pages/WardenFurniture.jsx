import React, { useState, useEffect } from 'react';
import { Download, Box, PackageCheck, PackageOpen } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import furnitureApi from '@/features/furniture/api/furnitureApi';
import DataTable from '@/components/ui/DataTable';
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
import { formatDate } from '@/utils/formatters';

export default function WardenFurniture() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const urlSearchQuery = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || 'All';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 10;

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
                    'Added On': formatDate(r.createdAt)
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

    const tableHeaders = [
        { key: 'furnitureId', label: 'Furniture Id' },
        { key: 'furniture', label: 'Furniture' },
        { key: 'organization', label: 'Organization' },
        { key: 'assignedTo', label: 'Assigned To' },
        { key: 'status', label: 'Status' }
    ];

    const handleRowClick = (item) => {
        setSelectedAsset(item);
        setIsAssetDetailsModalOpen(true);
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                        />
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                            onClick={() => setIsExportConfirmOpen(true)}
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </>
                }
                searchQuery={searchInput}
                onSearchChange={(e) => setSearchInput(e.target.value)}
                searchPlaceholder="Search furniture assets..."
                headers={tableHeaders}
                items={assets}
                canSelect={false}
                onRowClick={handleRowClick}
                emptyText="No furniture assets found."
                loading={loading}
                renderRow={(item) => (
                    <>
                        <td className="p-4 text-sm text-gray-900 font-medium">{item.furnitureId}</td>
                        <td className="p-4 text-sm text-gray-500 font-medium">{item.typeInfo?.name || '--'}</td>
                        <td className="p-4 text-sm text-gray-500">{item.organization?.name || '--'}</td>
                        <td className="p-4 text-sm text-gray-500">
                            {console.log('this is item: ', item)}
                            {item.studentId?.name ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                                        {item.studentId.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-gray-900 font-medium">{item.studentId.name}</span>
                                </div>
                            ) : '-'}
                        </td>
                        <td className="p-4">
                            <FurnitureStatusBadge status={item.status} />
                        </td>
                    </>
                )}
                page={page}
                setPage={(p) => updateSearchParams({ page: p })}
                limit={limit}
                totalItems={pagination.totalRecords}
                totalPages={pagination.totalPages}
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
    );
}
