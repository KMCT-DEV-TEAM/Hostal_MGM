import React, { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Clock, User, Info, Download, SlidersHorizontal, Eye, MoreVertical } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";
import ListTable from "@/components/ui/ListTable";
import MobileList, { MobileRow, MobileCardStatusBadge } from "@/components/ui/MobileList";
import DateInput from "@/components/ui/DateInput";
import ExportFilterModal from "@/components/ui/ExportFilterModal";
import LogsFilterModal from "./LogsFilterModal";
import LogDetailView from "./LogDetailView";
import authApi from "@/features/auth/api/authApi";
import { exportToExcel } from "@/utils/exportUtils";
import TableSkeletonLoader from "@/components/ui/TableSkeletonLoader";
import MobileSkeletonLoader from "@/components/ui/MobileSkeletonLoader";
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
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [expandedIds, setExpandedIds] = useState([]);

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
                limit: 10,
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
                limit: 10,
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

    const getStatusStyles = (status) => {
        switch (status) {
            case 'success':
                return 'bg-green-50 text-success border-green-200';
            case 'error':
                return 'bg-red-50 text-danger border-red-200';
            case 'warning':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const toggleExpand = (e, id) => {
        e.stopPropagation();
        setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm md:overflow-hidden flex flex-col min-h-0 flex-1">

            {/* Toolbar */}
            <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
                <div className="w-full sm:w-auto flex gap-2 flex-1 sm:max-w-xs">
                    <div className="relative w-full">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setIsLoading(true);
                                setPagination(p => ({ ...p, page: 1 }));
                            }}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none cursor-pointer"
                        />
                    </div>
                    {/* Mobile More Options Button */}
                    <div className="sm:hidden relative">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="flex items-center justify-center p-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer h-[38px]"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>
                        {isMobileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-[100] py-1 overflow-hidden">
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        setIsFilterModalOpen(true);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2"
                                >
                                    <SlidersHorizontal className="w-4 h-4" /> Filter
                                </button>
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        setIsExportFilterModalOpen(true);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" /> Export
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-3 w-full sm:w-auto justify-end">
                    {/* Desktop Buttons */}
                    <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className="flex items-center justify-center p-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer h-[38px] w-[38px]"
                        title="Filter"
                    >
                        <SlidersHorizontal className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsExportFilterModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                    >
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            <ListTable
                headers={['Action', 'Timestamp', 'User', 'Details', { label: 'Action', align: 'center' }]}
                items={logs}
                loading={isLoading}
                canSelect={false}
                emptyText="No logs found matching your criteria."
                renderRow={(log, index) => (
                    <>
                        <td className="p-4 font-medium text-[#777777]">
                            <div
                                className="flex items-center gap-3 cursor-pointer hover:text-[#0A437A]"
                                onClick={() => setSelectedLog(log)}
                            >
                                <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                    {log.action ? log.action.substring(0, 2) : 'NA'}
                                </div>
                                <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors">{log.action}</span>
                            </div>
                        </td>
                        <td className="p-4 text-start text-gray-500 whitespace-nowrap">
                            <div className="flex items-center justify-start gap-1.5">
                                <Clock size={14} className="text-gray-400" />
                                <span>{new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </td>
                        <td className="p-4 text-start text-gray-500 whitespace-nowrap">
                            <div className="flex items-center justify-start gap-1.5">
                                <User size={14} className="text-gray-400" />
                                <span>{log.user?.name || log.user?.email || 'Unknown'} <span className="text-[10px] text-gray-400 ml-1">({log.userRole})</span></span>
                            </div>
                        </td>
                        <td className="p-4 text-start text-gray-500 max-w-md truncate">
                            {log.details}
                        </td>
                        <td className="p-4">
                            <div className="flex gap-3 items-center justify-center">
                                <button
                                    onClick={() => setSelectedLog(log)}
                                    className="p-1.5 text-gray-400 hover:text-[#0A437A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                >
                                    <Eye className="w-4 h-4 text-secondary" />
                                </button>
                            </div>
                        </td>
                    </>
                )}
            />

            <MobileList
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                hasMore={pagination.page < pagination.totalPages}
                onLoadMore={() => fetchLogs(pagination.page + 1)}
                items={logs}
                loading={isLoading}
                canSelect={false}
                emptyText="No logs found matching your criteria."
                iconFn={(log) => (
                    <div className="w-10 h-10 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-sm uppercase">
                        {log.action ? log.action.substring(0, 2) : 'NA'}
                    </div>
                )}
                titleFn={(log) => log.action}
                subtitleFn={(log) => log.user?.name || log.user?.email || 'Unknown'}
                rightTopFn={(log) => `${new Date(log.createdAt).toLocaleDateString()} ${new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                statusBadgeFn={(log) => {
                    let dotColor = 'bg-gray-500', bgColor = 'bg-gray-50', textColor = 'text-gray-600';
                    if (log.status === 'success') { dotColor = 'bg-green-500'; bgColor = 'bg-green-50'; textColor = 'text-green-600'; }
                    else if (log.status === 'error') { dotColor = 'bg-red-500'; bgColor = 'bg-red-50'; textColor = 'text-red-600'; }
                    else if (log.status === 'warning') { dotColor = 'bg-yellow-500'; bgColor = 'bg-yellow-50'; textColor = 'text-yellow-600'; }
                    return (
                        <MobileCardStatusBadge
                            status={log.status || 'Unknown'}
                            dotColorClass={dotColor}
                            bgColorClass={bgColor}
                            textColorClass={textColor}
                        />
                    );
                }}
                onViewDetails={(log) => setSelectedLog(log)}
                renderBody={(log) => (
                    <>
                        <MobileRow label="Status" value={
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize border ${getStatusStyles(log.status)}`}>
                                {log.status}
                            </span>
                        } />
                        <MobileRow label="User" value={log.user?.name || log.user?.email || 'Unknown'} />
                        <MobileRow label="Time" value={`${new Date(log.createdAt).toLocaleDateString()} ${new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} />
                        <MobileRow label="Details" value={
                            <span className="break-words">{log.details}</span>
                        } />
                    </>
                )}
            />

            {!isLoading && pagination.totalPages > 0 && (
                <div className="hidden md:flex flex-row p-3 sm:p-4 bg-white border-t border-gray-100 items-center justify-between text-[10px] sm:text-xs font-medium text-gray-500 rounded-b-xl shadow-sm shrink-0 mt-auto">
                    <div>
                        <span className="hidden sm:inline">Showing </span>
                        {(!pagination.totalDocs && !pagination.totalRecords) ? 0 : (pagination.page - 1) * pagination.limit + 1}
                        <span className="hidden sm:inline"> to </span>
                        <span className="sm:hidden">-</span>
                        {Math.min(pagination.page * pagination.limit, pagination.totalDocs || pagination.totalRecords || 0)} of {pagination.totalDocs || pagination.totalRecords || 0}
                        <span className="hidden sm:inline"> entries</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => fetchLogs(pagination.page - 1)}
                            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {(() => {
                            let startPage = Math.max(1, pagination.page - 1);
                            let endPage = Math.min(pagination.totalPages, pagination.page + 1);

                            if (endPage - startPage < 2) {
                                if (startPage === 1) {
                                    endPage = Math.min(pagination.totalPages, 3);
                                } else if (endPage === pagination.totalPages) {
                                    startPage = Math.max(1, pagination.totalPages - 2);
                                }
                            }

                            const visiblePages = [];
                            for (let i = startPage; i <= endPage; i++) {
                                visiblePages.push(i);
                            }

                            return visiblePages.map(pageNum => (
                                <button
                                    key={pageNum}
                                    onClick={() => fetchLogs(pageNum)}
                                    className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer ${pagination.page === pageNum
                                        ? 'bg-[#0A437A] text-white shadow-sm font-bold'
                                        : 'border border-transparent text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            ));
                        })()}

                        <button
                            disabled={pagination.page >= pagination.totalPages || pagination.totalPages === 0}
                            onClick={() => fetchLogs(pagination.page + 1)}
                            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

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
        </div>
    );
};

export default LogsViewer;
