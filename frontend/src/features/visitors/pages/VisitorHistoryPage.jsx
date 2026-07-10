import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import VisitorStats from '../components/VisitorStats';
import VisitorDetailedView from '../components/VisitorDetailedView';
import VisitorHistoryAggregatedView from '../components/VisitorHistoryAggregatedView';
import { getSuperAdminHostelVisits, listVisitorVisits } from '@/services/visitor.service';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import { exportToExcel } from '@/utils/exportUtils';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { formatDateReadable, formatTime } from '@/utils/formatters';

const VisitorHistoryPage = () => {
    const { user } = useAuthStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [visitors, setVisitors] = useState([]);
    const [stats, setStats] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({ status: '', fromDate: '', toDate: '' });
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const isSuperAdmin = user?.role === 'super_admin';
    const canExport = ['super_admin', 'admin', 'warden'].includes(user?.role);

    const urlHostelId = searchParams.get('hostelId');
    const urlHostelName = searchParams.get('hostelName');

    const selectedHostel = useMemo(() => {
        return urlHostelId ? { id: urlHostelId, name: urlHostelName } : null;
    }, [urlHostelId, urlHostelName]);

    const showAggregatedView = isSuperAdmin && !selectedHostel;

    const fetchVisitors = useCallback(async () => {
        try {
            setLoading(true);
            let res;
            const params = { page: 1, limit: 10 };
            if (debouncedSearchQuery) params.search = debouncedSearchQuery;
            if (filters.status) params.status = filters.status;
            if (filters.fromDate) params.startDate = filters.fromDate;
            if (filters.toDate) params.endDate = filters.toDate;

            if (showAggregatedView) {
                res = await getSuperAdminHostelVisits(params);
            } else {
                if (selectedHostel) params.hostel = selectedHostel.id;
                res = await listVisitorVisits(params);
            }

            setVisitors(res.data || []);
            // TODO: Fetch real stats from dashboard-summary if needed
            setStats(null);
        } catch (error) {
            console.error("Failed to fetch visitors", error);
        } finally {
            setLoading(false);
        }
    }, [showAggregatedView, selectedHostel, debouncedSearchQuery, filters]);

    useEffect(() => {
        fetchVisitors();
    }, [fetchVisitors]);

    const handleSearch = (searchTerm) => {
        setSearchQuery(searchTerm);
    };

    const handleFilter = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleExport = () => {
        setIsExportConfirmOpen(true);
    };

    const confirmExport = async (exportFilters) => {
        setIsExporting(true);
        try {
            const params = {};
            if (debouncedSearchQuery) params.search = debouncedSearchQuery;
            if (exportFilters.status || filters.status) params.status = exportFilters.status || filters.status;
            if (exportFilters.fromDate || filters.fromDate) params.startDate = exportFilters.fromDate || filters.fromDate;
            if (exportFilters.toDate || filters.toDate) params.endDate = exportFilters.toDate || filters.toDate;

            let res;
            if (showAggregatedView) {
                res = await getSuperAdminHostelVisits(params);
            } else {
                if (selectedHostel) params.hostel = selectedHostel.id;
                res = await listVisitorVisits(params);
            }

            const dataToExport = res?.data || [];

            if (dataToExport.length === 0) {
                showErrorToast('Export failed', 'No visitor records match the selected filters');
                setIsExportConfirmOpen(false);
                setIsExporting(false);
                return;
            }

            const exportData = showAggregatedView
                ? dataToExport.map((r, index) => ({
                    "S.No": index + 1,
                    "Hostel": r.hostel || r._id || '--',
                    "Warden": r.warden || '--',
                    "Total Visitors": r.totalVisits || r.totalVisitors || 0,
                    "Inside": r.inside || 0,
                    "Completed": r.completed || 0,
                }))
                : dataToExport.map((r, index) => ({
                    "S.No": index + 1,
                    "Visitor Name": r.visitorName || 'Unknown',
                    "Visiting Student": r.studentNames || '--',
                    "Room NO": r.roomNo || '--',
                    "Check In": r.checkInTime ? `${formatDateReadable(r.checkInTime)} ${formatTime(r.checkInTime)}` : '--',
                    "Check Out": r.checkOutTime ? `${formatDateReadable(r.checkOutTime)} ${formatTime(r.checkOutTime)}` : '--',
                    "Status": r.status || 'Unknown',
                }));

            const isSuccess = exportToExcel(exportData, 'Visitor_History_Export', 'History');

            if (isSuccess) {
                showSuccessToast('Exported successfully');
            } else {
                showErrorToast('Export failed', 'Could not generate the Excel file');
            }

            setIsExportConfirmOpen(false);
        } catch (err) {
            console.error("Failed to export history:", err);
            showErrorToast('Export failed', err.message);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden p-4 md:p-6 bg-background-secondary flex flex-col">
            <div className="mb-6 shrink-0 flex items-center gap-4">
                {selectedHostel && isSuperAdmin && (
                    <button
                        onClick={() => {
                            const newParams = new URLSearchParams(searchParams);
                            newParams.delete('hostelId');
                            newParams.delete('hostelName');
                            setSearchParams(newParams);
                        }}
                        className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <PageHeader
                    title={selectedHostel ? `Visitors History - ${selectedHostel.name}` : "Visitors History"}
                    subtitle={showAggregatedView ? "Overview of past visitors across all hostels" : "View historical visitors"}
                />
            </div>

            {/* Shared Stats Component */}
            <div className="shrink-0">
                <VisitorStats stats={stats} />
            </div>

            {/* Role-Based Rendering */}
            {showAggregatedView ? (
                <VisitorHistoryAggregatedView
                    visitors={visitors}
                    loading={loading}
                    searchQuery={searchQuery}
                    filters={filters}
                    onSearch={handleSearch}
                    onHostelFilter={(hostel) => handleFilter({ hostel })}
                    onRowClick={(hostelObj) => {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('hostelId', hostelObj.id);
                        newParams.set('hostelName', hostelObj.name || '');
                        setSearchParams(newParams);
                    }}
                    canExport={canExport}
                    onExportClick={handleExport}
                    userRole={user?.role}
                />
            ) : (
                <VisitorDetailedView
                    visitors={visitors}
                    loading={loading}
                    searchQuery={searchQuery}
                    filters={filters}
                    onSearch={handleSearch}
                    onFilter={handleFilter}
                    onRefresh={() => fetchVisitors(false)}
                    canExport={canExport}
                    onExportClick={handleExport}
                    userRole={user?.role}
                />
            )}

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Visitor History"
                subtitle="Select filters to apply before downloading visitor history records"
                fields={[
                    {
                        name: "status",
                        label: "Status",
                        options: [
                            { label: 'All Status', value: '' },
                            { label: 'Checked In', value: 'Checked In' },
                            { label: 'Completed', value: 'Completed' },
                        ]
                    },
                    {
                        name: "fromDate",
                        label: "From Date",
                        type: "date"
                    },
                    {
                        name: "toDate",
                        label: "To Date",
                        type: "date"
                    }
                ]}
            />
        </div>
    );
};

export default VisitorHistoryPage;
