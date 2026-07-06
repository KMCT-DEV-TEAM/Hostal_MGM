import { useState, useEffect } from "react";
import { Check, X, Search, Mail, Clock, ShieldCheck, Download, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Square, CheckSquare, MoreVertical, SlidersHorizontal } from "lucide-react";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import ListTable from "@/components/ui/ListTable";
import MobileList, { MobileRow } from "@/components/ui/MobileList";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { passwordRequestApi } from "@/features/dashboard/api/passwordRequestApi";
import { exportToExcel } from '@/utils/exportUtils';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import { initSocket } from '@/services/socket.service';
import ExportFilterModal from "@/components/ui/ExportFilterModal";
import TableSkeletonLoader from "@/components/ui/TableSkeletonLoader";
import MobileSkeletonLoader from "@/components/ui/MobileSkeletonLoader";
import PasswordRequestsFilterModal from "../components/PasswordRequestsFilterModal";

const PasswordRequests = () => {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
    const [selectedRequests, setSelectedRequests] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, id: null });
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleSelectAll = () => {
        if (selectedRequests.length === pendingRequestsCount && pendingRequestsCount > 0) {
            setSelectedRequests([]);
        } else {
            const pendingIds = requests.filter(req => req.status === 'pending').map(req => req._id);
            setSelectedRequests(pendingIds);
        }
    };

    const pendingRequestsCount = requests.filter(req => req.status === 'pending').length;

    const handleSelectOne = (id) => {
        setSelectedRequests(prev =>
            prev.includes(id) ? prev.filter(reqId => reqId !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchRequests = async (page = 1) => {
        setIsLoading(true);
        try {
            const apiStatus = statusFilter === 'All' ? 'all' : statusFilter.toLowerCase();
            const res = await passwordRequestApi.getPasswordRequests({
                page,
                limit: 10,
                status: apiStatus,
                search: debouncedSearch
            });
            setRequests(res.data.requests || []);
            setPagination(res.data.pagination || { page: 1, limit: 10, totalPages: 1 });
        } catch (error) {
            showErrorToast('Failed to load password requests', error?.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests(1);
    }, [statusFilter, debouncedSearch]);

    useEffect(() => {
        const socket = initSocket();

        const handlePasswordRequestEvent = () => {
            fetchRequests(pagination.page);
        };

        socket.on('passwordRequestCreated', handlePasswordRequestEvent);
        socket.on('passwordRequestUpdated', handlePasswordRequestEvent);

        return () => {
            socket.off('passwordRequestCreated', handlePasswordRequestEvent);
            socket.off('passwordRequestUpdated', handlePasswordRequestEvent);
        };
    }, [pagination.page]);

    const handleExport = async (filters) => {
        try {
            setIsExporting(true);
            const { status } = filters;
            const res = await passwordRequestApi.getPasswordRequests({
                page: 1,
                limit: 100000,
                status: status,
                search: debouncedSearch
            });
            const allRequests = res.data.requests || [];
            if (allRequests.length === 0) {
                showErrorToast('No data available to export');
                return;
            }

            const exportData = allRequests.map(req => ({
                'User Name': req.user?.name || 'N/A',
                'User Email': req.user?.email || 'N/A',
                'User Role': req.userRole || 'N/A',
                'Request Status': req.status,
                'Requested At': new Date(req.createdAt).toLocaleString(),
                'Resolved At': req.resolvedAt ? new Date(req.resolvedAt).toLocaleString() : 'N/A',
                'Processed By': req.processedBy?.name || req.processedBy?.email || 'N/A'
            }));

            await exportToExcel(exportData, `Password_Requests_${new Date().toISOString().split('T')[0]}`);
            setIsExportConfirmOpen(false);
            showSuccessToast('Export successful');
        } catch (error) {
            console.error('Export failed:', error);
            showErrorToast('Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    const openConfirmModal = (type, id = null) => {
        setConfirmModal({ isOpen: true, type, id });
    };

    const closeConfirmModal = () => {
        setConfirmModal({ isOpen: false, type: null, id: null });
    };

    const executeAction = async () => {
        const { type, id } = confirmModal;
        setIsActionLoading(true);
        try {
            if (type === 'approve') {
                await passwordRequestApi.approvePasswordRequest(id);
                showSuccessToast('Password request approved');
            } else if (type === 'reject') {
                await passwordRequestApi.rejectPasswordRequest(id);
                showSuccessToast('Password request rejected');
            } else if (type === 'bulkApprove') {
                await Promise.all(selectedRequests.map(reqId => passwordRequestApi.approvePasswordRequest(reqId)));
                showSuccessToast(`${selectedRequests.length} requests approved`);
                setSelectedRequests([]);
            } else if (type === 'bulkReject') {
                await Promise.all(selectedRequests.map(reqId => passwordRequestApi.rejectPasswordRequest(reqId)));
                showSuccessToast(`${selectedRequests.length} requests rejected`);
                setSelectedRequests([]);
            }
            fetchRequests(pagination.page);
            closeConfirmModal();
        } catch (error) {
            showErrorToast(`Failed to ${type.includes('Approve') ? 'approve' : 'reject'} request(s)`, error?.response?.data?.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-2 sm:gap-4 shrink-0">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Password Requests</h1>
                    <p className="text-[10px] sm:text-xs text-[#777777] mt-0.5 sm:mt-1">Manage password reset requests from users</p>
                </div>
            </div>

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm md:overflow-hidden flex flex-col min-h-0 flex-1">
                {/* Toolbar */}
                <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
                    <div className="w-full sm:w-auto flex gap-2 flex-1 sm:max-w-xs">
                        <div className="relative w-full">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => { 
                                    setSearchQuery(e.target.value); 
                                    setIsLoading(true);
                                    setPagination(p => ({ ...p, page: 1 })); 
                                }}
                                placeholder="Search user or email..."
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
                                        onClick={() => { setIsMobileMenuOpen(false); openConfirmModal('bulkApprove'); }}
                                        disabled={selectedRequests.length === 0}
                                        className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                                    >
                                        <Check className="w-4 h-4" /> Approve {selectedRequests.length > 0 ? `(${selectedRequests.length})` : ''}
                                    </button>
                                    <button
                                        onClick={() => { setIsMobileMenuOpen(false); openConfirmModal('bulkReject'); }}
                                        disabled={selectedRequests.length === 0}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" /> Reject {selectedRequests.length > 0 ? `(${selectedRequests.length})` : ''}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            setIsExportConfirmOpen(true);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" /> Export
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            setIsFilterModalOpen(true);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2"
                                    >
                                        <SlidersHorizontal className="w-4 h-4" /> Filter
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
                            onClick={() => setIsExportConfirmOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap h-[38px]"
                        >
                            <Download size={16} /> Export
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                                className="flex items-center justify-center p-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer h-[38px]"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>
                            {isDesktopMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-[100] py-1 overflow-hidden">
                                    <button
                                        onClick={() => { setIsDesktopMenuOpen(false); openConfirmModal('bulkApprove'); }}
                                        disabled={selectedRequests.length === 0}
                                        className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                                    >
                                        <Check className="w-4 h-4" /> Approve {selectedRequests.length > 0 ? `(${selectedRequests.length})` : ''}
                                    </button>
                                    <button
                                        onClick={() => { setIsDesktopMenuOpen(false); openConfirmModal('bulkReject'); }}
                                        disabled={selectedRequests.length === 0}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" /> Reject {selectedRequests.length > 0 ? `(${selectedRequests.length})` : ''}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <ListTable
                    headers={[
                        { label: 'User', align: 'left' },
                        { label: 'Email', align: 'left' },
                        { label: 'Role', align: 'left' },
                        { label: 'Requested At', align: 'left' },
                        { label: 'Status', align: 'left' },
                        { label: 'Actions', align: 'center' }
                    ]}
                    items={requests}
                    loading={isLoading}
                    selectedIds={selectedRequests}
                    onSelectAll={handleSelectAll}
                    onSelect={handleSelectOne}
                    canSelect={true}
                    isSelectableFn={(item) => item.status === 'pending'}
                    emptyText="No pending password requests found."
                    renderRow={(request, index, isSelected) => (
                        <>
                            <td className="p-4 font-medium text-[#777777]">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                        {request.user?.name ? request.user.name.substring(0, 2) : 'NA'}
                                    </div>
                                    <span className="font-medium text-[#777777]">{request.user?.name}</span>
                                </div>
                            </td>
                            <td className="p-4 text-start text-gray-500 whitespace-nowrap">
                                <div className="flex items-center justify-start gap-1.5 text-gray-500">
                                    <Mail size={14} className="text-gray-400" />
                                    <span>{request.user?.email}</span>
                                </div>
                            </td>
                            <td className="p-4 text-start whitespace-nowrap">
                                <div className="flex items-center justify-start gap-1.5 text-gray-500">
                                    <ShieldCheck size={14} className="text-gray-400" />
                                    <span className="capitalize">{request.userRole || request.user?.role}</span>
                                </div>
                            </td>
                            <td className="p-4 text-start text-gray-500 whitespace-nowrap">
                                <div className="flex items-center justify-start gap-1.5">
                                    <Clock size={14} className="text-gray-400" />
                                    <span>{new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </td>
                            <td className="p-4 text-start whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize border ${
                                    request.status === 'approved' ? 'bg-success-50 text-success border-success' :
                                    request.status === 'rejected' ? 'bg-danger-50 text-danger border-danger' :
                                    'bg-transparent text-yellow-600 border-yellow-400'
                                }`}>
                                    {request.status}
                                </span>
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                                {request.status === 'pending' ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            className="px-2.5 py-1.5 bg-success-50 text-success border border-success hover:bg-success-100 rounded text-xs font-medium transition-colors flex items-center cursor-pointer"
                                            onClick={() => openConfirmModal('approve', request._id)}
                                        >
                                            <Check className="w-3.5 h-3.5 mr-1" />
                                            Approve
                                        </button>
                                        <button
                                            className="px-2.5 py-1.5 bg-red-50 text-danger border border-red-200 hover:bg-red-100 rounded text-xs font-medium transition-colors flex items-center cursor-pointer"
                                            onClick={() => openConfirmModal('reject', request._id)}
                                        >
                                            <X className="w-3.5 h-3.5 mr-1" />
                                            Reject
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 text-xs italic">Processed</span>
                                )}
                            </td>
                        </>
                    )}
                />

                <MobileList
                    items={requests}
                    loading={isLoading}
                    selectedIds={selectedRequests}
                    onSelectAll={handleSelectAll}
                    onSelect={handleSelectOne}
                    canSelect={true}
                    isSelectableFn={(item) => item.status === 'pending'}
                    emptyText="No pending password requests found."
                    titleFn={(request) => request.user?.name}
                    renderBody={(request) => (
                        <>
                            <MobileRow label="Email" value={request.user?.email} />
                            <MobileRow label="Role" value={<span className="capitalize">{request.userRole || request.user?.role}</span>} />
                            <MobileRow label="Requested" value={`${new Date(request.createdAt).toLocaleDateString()} at ${new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} />
                            <MobileRow label="Status" value={
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium capitalize border ${
                                    request.status === 'approved' ? 'bg-success-50 text-success border-success' :
                                    request.status === 'rejected' ? 'bg-danger-50 text-danger border-danger' :
                                    'bg-transparent text-yellow-600 border-yellow-400'
                                }`}>
                                    {request.status}
                                </span>
                            } />

                        </>
                    )}
                />

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
                                onClick={() => fetchRequests(pagination.page - 1)}
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
                                        onClick={() => fetchRequests(pageNum)}
                                        className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer ${
                                            pagination.page === pageNum
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
                                onClick={() => fetchRequests(pagination.page + 1)}
                                className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={handleExport}
                isExporting={isExporting}
                title="Export Password Requests"
                fields={[
                    {
                        name: "status",
                        label: "Request Status",
                        defaultValue: "all",
                        options: [
                            { label: 'All Status', value: 'all' },
                            { label: 'Pending', value: 'pending' },
                            { label: 'Approved', value: 'approved' },
                            { label: 'Rejected', value: 'rejected' },
                        ]
                    }
                ]}
            />

            {isFilterModalOpen && (
                <PasswordRequestsFilterModal
                    initialStatus={statusFilter}
                    onClose={() => setIsFilterModalOpen(false)}
                    onApply={(filters) => {
                        setStatusFilter(filters.statusFilter);
                        setIsFilterModalOpen(false);
                        setPagination(p => ({ ...p, page: 1 }));
                    }}
                />
            )}

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">
                            {confirmModal.type === 'approve' || confirmModal.type === 'bulkApprove' ? 'Approve Request' : 'Reject Request'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            {confirmModal.type === 'approve' && 'Are you sure you want to approve this password reset request?'}
                            {confirmModal.type === 'reject' && 'Are you sure you want to reject this password reset request?'}
                            {confirmModal.type === 'bulkApprove' && `Are you sure you want to approve ${selectedRequests.length} requests?`}
                            {confirmModal.type === 'bulkReject' && `Are you sure you want to reject ${selectedRequests.length} requests?`}
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={closeConfirmModal}
                                disabled={isActionLoading}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeAction}
                                disabled={isActionLoading}
                                className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors cursor-pointer flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 ${confirmModal.type === 'approve' || confirmModal.type === 'bulkApprove'
                                    ? 'bg-success hover:bg-success/90'
                                    : 'bg-danger hover:bg-danger/90'
                                    }`}
                            >
                                {isActionLoading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {isActionLoading ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PasswordRequests;
