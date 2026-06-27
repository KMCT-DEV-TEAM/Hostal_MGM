import React, { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronLeft, ChevronRight, Clock, User, Info, Download, SlidersHorizontal } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";
import DateInput from "@/components/ui/DateInput";
import ExportFilterModal from "@/components/ui/ExportFilterModal";
import LogsFilterModal from "./LogsFilterModal";
import authApi from "@/features/auth/api/authApi";
import { exportToExcel } from "@/utils/exportUtils";
import TableSkeletonLoader from "@/components/ui/TableSkeletonLoader";
import MobileSkeletonLoader from "@/components/ui/MobileSkeletonLoader";
import { logApi } from "@/features/dashboard/api/logApi";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { initSocket } from '@/services/socket.service';

const LogsViewer = ({ entityType }) => {
    const [logs, setLogs] = useState([]);
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
                return 'bg-danger/10 text-danger border-danger/20';
            case 'warning':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="bg-transparent md:bg-white md:rounded-lg md:border md:border-gray-200 md:overflow-hidden flex flex-col min-h-0 h-full">

            {/* Toolbar */}
            <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
                <div className="w-full sm:w-auto flex flex-col gap-2 flex-1 sm:max-w-xs">
                    <div className="relative w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search logs..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none cursor-pointer"
                        />
                    </div>
                    <div className="flex justify-center sm:hidden -mt-1 -mb-2">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer focus:outline-none"
                        >
                            <ChevronDown className={`w-5 h-5 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className={`flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end ${isMobileMenuOpen ? 'flex' : 'hidden sm:flex'}`}>
                    <div className="flex gap-3 w-full sm:w-auto items-center">
                        <button
                            onClick={() => setIsFilterModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 h-9 bg-white border border-gray-200 text-text-secondary rounded-lg text-sm hover:bg-gray-50 transition-colors cursor-pointer shadow-sm md:shadow-none"
                        >
                            <SlidersHorizontal className="w-4 h-4" /> 
                            <span className="sm:hidden">Filter</span>
                        </button>

                        <button
                            onClick={() => setIsExportFilterModalOpen(true)}
                            className="flex items-center justify-center gap-2 h-9 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" /> Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-[#FAFBFD] shadow-sm">
                        <tr className="bg-[#FAFBFD] border-b border-gray-100 text-gray-400 text-xs tracking-wider uppercase font-semibold">
                            <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Timestamp</th>
                            <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Action</th>
                            <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">User</th>
                            <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {isLoading ? (
                            <TableSkeletonLoader columns={4} />
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-400">
                                    No logs found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-50/40 transition-colors">
                                    <td className="p-4 text-start text-gray-500 whitespace-nowrap">
                                        <div className="flex items-center justify-start gap-1.5">
                                            <Clock size={14} className="text-gray-400" />
                                            <span>{new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-start font-medium text-[#444444] whitespace-nowrap">
                                        {log.action}
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
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col gap-4 mt-4 flex-1 overflow-y-auto pb-4 px-2 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {isLoading ? (
                    <MobileSkeletonLoader />
                ) : logs.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
                        No logs found matching your criteria.
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log._id} className="p-4 bg-white rounded-xl shadow-sm flex flex-col relative border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-start gap-3">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">{log.action}</h3>
                                        <div className="flex items-center justify-start gap-1 mt-0.5 text-xs text-gray-500">
                                            <User size={12} className="text-gray-400" />
                                            <span>{log.user?.name || log.user?.email || 'Unknown'}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize border ${getStatusStyles(log.status)}`}>
                                    {log.status}
                                </span>
                            </div>

                            <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <div className="flex items-start gap-1.5">
                                    <Info size={12} className="text-gray-400 mt-0.5 shrink-0" />
                                    <p>{log.details}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mt-3">
                                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <Clock size={10} />
                                    <span>{new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {!isLoading && pagination.totalPages > 0 && (
                <div className="flex flex-row p-3 sm:p-4 bg-white border-t border-gray-100 items-center justify-between text-[10px] sm:text-xs font-medium text-gray-500 rounded-b-xl shadow-sm shrink-0 mt-auto">
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

                        {Array.from({ length: pagination.totalPages }, (_, index) => {
                            const pageNum = index + 1;
                            return (
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
                            );
                        })}

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
        </div>
    );
};

export default LogsViewer;
