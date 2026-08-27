import React, { useState, useEffect } from "react";
import { useClickOutside } from '@/hooks/useClickOutside';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Clock, User, Info, Download, SlidersHorizontal, Eye, MoreVertical, Mail, ShieldCheck, Activity } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";
import DateInput from "@/components/ui/DateInput";
import DataView from '@/components/ui/data-view/DataView';
import ExportFilterModal from "@/components/ui/ExportFilterModal";
import LogsFilterModal from "./LogsFilterModal";
import LogDetailView from "./LogDetailView";
import authApi from "@/features/auth/api/authApi";
import { exportToExcel } from "@/utils/exportUtils";
import { logApi } from "@/features/dashboard/api/logApi";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { initSocket } from '@/services/socket.service';

const LogsViewer = ({ entityType }) => {
    const [logs, setLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isExportFilterModalOpen, setIsExportFilterModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [limit, setLimit] = useState(10);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalDocs: 0 });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchLogs = async (page = 1) => {
        setIsLoading(true);
        try {
            const apiStatus = statusFilter === 'All' ? 'all' : statusFilter.toLowerCase();
            const res = await logApi.getLogs({
                page,
                limit: limit,
                status: apiStatus,
                search: debouncedSearch,
                startDate,
                endDate
            });

            const responseData = res.data?.data || res.data;
            let fetchedLogs = responseData.logs || [];
            if (entityType) {
                fetchedLogs = fetchedLogs.filter(log => log.entityType === entityType);
            }

            setLogs(fetchedLogs);
            setPagination({
                page: responseData.currentPage || 1,
                limit: limit,
                totalPages: responseData.totalPages || 1,
                totalDocs: responseData.totalCount || responseData.totalLogs || responseData.totalRecords || responseData.totalDocs || responseData.total || 0
            });
        } catch (error) {
            showErrorToast('Failed to load system logs', error?.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, [statusFilter, debouncedSearch, entityType, startDate, endDate]);

    useEffect(() => {
        const socket = initSocket();

        const handleLogEvent = () => {
            fetchLogs(pagination.page);
        };

        socket.on('logCreated', handleLogEvent);

        return () => {
            socket.off('logCreated', handleLogEvent);
        };
    }, [pagination.page]);

    const handleExportSubmit = async (filters) => {
        setIsExporting(true);
        try {
            const exportStartDate = filters.startDate;
            const exportEndDate = filters.endDate;

            // Fetch all logs matching filter
            const apiStatus = statusFilter === 'All' ? 'all' : statusFilter.toLowerCase();
            const res = await logApi.getLogs({
                limit: 100000,
                page: 1,
                status: apiStatus,
                search: debouncedSearch,
                startDate: exportStartDate,
                endDate: exportEndDate
            });

            const responseData = res.data?.data || res.data;
            let fetchedLogs = responseData.logs || [];
            if (entityType) {
                fetchedLogs = fetchedLogs.filter(log => log.entityType === entityType);
            }

            if (fetchedLogs.length === 0) {
                showErrorToast('Export Failed', 'No logs found matching your criteria.');
                setIsExportFilterModalOpen(false);
                setIsExporting(false);
                return;
            }

            const exportData = fetchedLogs.map((log, index) => ({
                "SL No": index + 1,
                "Timestamp": `${new Date(log.createdAt).toLocaleDateString()} ${new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                "Action": log.action,
                "User": log.user?.name || log.user?.email || 'Unknown',
                "Role": log.userRole || 'N/A',
                "Status": log.status,
                "Details": log.details
            }));

            const isSuccess = exportToExcel(exportData, "System_Logs_Export", "Logs");
            if (isSuccess) {
                showSuccessToast('Export Successful', 'Logs have been downloaded successfully.');
            } else {
                showErrorToast('Export Failed', 'Could not generate the Excel file.');
            }
        } catch (error) {
            console.error("Export Failed", error);
            showErrorToast('Export Failed', error?.response?.data?.message || error?.message || 'Failed to export logs.');
        } finally {
            setIsExportFilterModalOpen(false);
            setIsExporting(false);
        }
    };

    const columns = [
        {
            key: "action",
            header: "Action",
            type: "user",
            titleAccessor: (o) => o.action,
            subtitleAccessor: (o) => "",
            avatarAccessor: (o) => o.action?.substring(0, 2)?.toUpperCase() || "NA",
        },
        {
            key: "timestamp",
            header: "Timestamp",
            icon: Clock,
            accessor: (o) => `${new Date(o.createdAt).toLocaleDateString()} ${new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        },
        {
            key: "user",
            header: "User",
            icon: User,
            renderCell: (o) => (
                <div className="flex items-center gap-1.5">
                    <User size={14} className="text-gray-400" />
                    <span>{o.user?.name || o.user?.email || 'Unknown'} <span className="text-[10px] text-gray-400 ml-1">({o.userRole})</span></span>
                </div>
            )
        },
        {
            key: "details",
            header: "Details",
            truncate: true,
            accessor: (o) => o.details
        },
        {
            key: "view",
            header: "Action",
            align: "center",
            renderCell: (o) => (
                <div className="flex gap-3 items-center justify-center" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => setSelectedLog(o)}
                        className="p-1.5 text-gray-400 hover:text-[#0A437A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                        <Eye className="w-4 h-4 text-secondary" />
                    </button>
                </div>
            )
        }
    ];

    const cardConfig = {
        avatar: (o) => {
            const email = o.user?.email || 'Unknown';
            return email !== 'Unknown' ? email.substring(0, 2).toUpperCase() : 'NA';
        },
        title: (o) => o.user?.email || 'Unknown Email',
        subtitle: (o) => o.action || 'Unknown Action',
        status: (o) => {
            let dotColor = 'bg-gray-500', bgColor = 'bg-gray-50', textColor = 'text-gray-600';
            if (o.status === 'success') { dotColor = 'bg-green-500'; bgColor = 'bg-green-50'; textColor = 'text-green-600'; }
            else if (o.status === 'error') { dotColor = 'bg-red-500'; bgColor = 'bg-red-50'; textColor = 'text-red-600'; }
            else if (o.status === 'warning') { dotColor = 'bg-yellow-500'; bgColor = 'bg-yellow-50'; textColor = 'text-yellow-600'; }
            return {
                label: o.status || 'Unknown',
                dotClass: dotColor,
                bgClass: bgColor,
                textClass: textColor
            };
        },
        fields: [
            { label: "Timestamp", value: (o) => `${new Date(o.createdAt).toLocaleDateString()} ${new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` },
            { label: "Role", value: (o) => o.userRole },
        ]
    };

    return (
        <>
            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex flex-col min-h-0 flex-1 mt-2">
                <DataView
                pageScrollMode={true}
                data={logs}
                columns={columns}
                cardConfig={cardConfig}
                loading={isLoading}
                searchPlaceholder="Search logs..."
                searchQuery={searchQuery}
                onSearchChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPagination(p => ({ ...p, page: 1 }));
                }}
                toolbarEndSlot={
                    <>
                        {/* Mobile Layout: Export button on left side taking available/empty width (flex-1), filter beside */}
                        <div className="flex md:hidden items-center gap-2 w-full">
                            <button
                                onClick={() => setIsExportFilterModalOpen(true)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap h-full font-medium"
                            >
                                <Download size={16} /> Export
                            </button>
                            <button
                                onClick={() => setIsFilterModalOpen(true)}
                                className="flex items-center justify-center p-2 bg-white border border-gray-100 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer shrink-0 h-full"
                                title="Filter"
                            >
                                <SlidersHorizontal className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Desktop Layout: Standard right-aligned buttons */}
                        <div className="hidden md:flex items-center gap-2">
                            <button
                                onClick={() => setIsFilterModalOpen(true)}
                                className="flex items-center justify-center p-2 bg-white border border-gray-100 lg:border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer h-full"
                                title="Filter"
                            >
                                <SlidersHorizontal className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsExportFilterModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 lg:border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap h-full font-medium"
                            >
                                <Download size={16} /> Export
                            </button>
                        </div>
                    </>
                }
                emptyText="No logs found matching your criteria."
                onRowClick={(o) => setSelectedLog(o)}
                page={pagination.page}
                setPage={(p) => fetchLogs(p)}
                limit={limit}
                setLimit={(l) => { setLimit(l); fetchLogs(1); }}
                totalItems={pagination.totalDocs}
                totalPages={pagination.totalPages}
                fetchMore={() => fetchLogs(pagination.page + 1)}
                getItemId={(o) => o.id}
            />
        </div>

            <ExportFilterModal
                isOpen={isExportFilterModalOpen}
                onClose={() => setIsExportFilterModalOpen(false)}
                title="Export Logs"
                subtitle="Select date range to export logs"
                fields={[
                    { name: 'startDate', label: 'From Date', type: 'date' },
                    { name: 'endDate', label: 'To Date', type: 'date' }
                ]}
                onExport={handleExportSubmit}
            />

            {isFilterModalOpen && (
                <LogsFilterModal
                    initialStartDate={startDate}
                    initialEndDate={endDate}
                    initialStatus={statusFilter}
                    onClose={() => setIsFilterModalOpen(false)}
                    onApply={(filters) => {
                        setStartDate(filters.startDate);
                        setEndDate(filters.endDate);
                        setStatusFilter(filters.statusFilter);
                        setIsFilterModalOpen(false);
                    }}
                />
            )}

            <LogDetailView log={selectedLog} onClose={() => setSelectedLog(null)} />
        </>
    );
};

export default LogsViewer;
