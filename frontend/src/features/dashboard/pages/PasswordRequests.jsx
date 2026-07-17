import { useState, useEffect } from "react";
import { Check, X, Search, Mail, Clock, ShieldCheck, Download, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Square, CheckSquare, MoreVertical, SlidersHorizontal, Key } from "lucide-react";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import DataView from '@/components/ui/data-view/DataView';
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { passwordRequestApi } from "@/features/dashboard/api/passwordRequestApi";
import { exportToExcel } from '@/utils/exportUtils';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import { initSocket } from '@/services/socket.service';
import ExportFilterModal from "@/components/ui/ExportFilterModal";
import PasswordRequestsHeader from "../components/PasswordRequestsHeader";
import PasswordRequestsFilterModal from "../components/PasswordRequestsFilterModal";
import { useClickOutside } from "@/hooks/useClickOutside";

const PasswordRequests = () => {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [limit, setLimit] = useState(10);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuRef = useClickOutside(() => setIsMobileMenuOpen(false));
    const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, id: null });
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const [selectedRequests, setSelectedRequests] = useState([]);

    const handleSelectAll = (mobileIds) => {
        let pendingIds = requests.filter(req => req.status === 'pending').map(req => req._id);
        if (Array.isArray(mobileIds) && typeof mobileIds[0] === 'string') {
            pendingIds = mobileIds; 
        }

        if (selectedRequests.length === pendingIds.length && pendingIds.length > 0) {
            setSelectedRequests([]);
        } else {
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
                limit: limit,
                status: apiStatus,
                search: debouncedSearch
            });
            const dataPayload = res.data || {};
            setRequests(dataPayload.requests || dataPayload.data || (Array.isArray(dataPayload) ? dataPayload : []));
            setPagination({
                page: dataPayload.pagination?.page || res.page || dataPayload.page || page,
                limit: dataPayload.pagination?.limit || res.limit || dataPayload.limit || 10,
                totalPages: dataPayload.pagination?.totalPages || res.totalPages || dataPayload.totalPages || 1,
                totalDocs: dataPayload.pagination?.totalDocs || res.totalCount || dataPayload.totalCount || 0
            });
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

    const columns = [
        {
            key: "user",
            header: "User",
            type: "user",
            titleAccessor: (o) => o.user?.name,
            subtitleAccessor: (o) => "",
            avatarAccessor: (o) => o.user?.name ? o.user.name.substring(0, 2).toUpperCase() : 'NA'
        },
        {
            key: "email",
            header: "Email",
            icon: Mail,
            accessor: (o) => o.user?.email
        },
        {
            key: "role",
            header: "Role",
            icon: ShieldCheck,
            accessor: (o) => o.userRole || o.user?.role,
            renderCell: (o) => (
                <div className="flex items-center justify-start gap-1.5 text-gray-500">
                    <ShieldCheck size={14} className="text-gray-400" />
                    <span className="capitalize">{o.userRole || o.user?.role}</span>
                </div>
            )
        },
        {
            key: "requestedAt",
            header: "Requested At",
            icon: Clock,
            accessor: (o) => `${new Date(o.createdAt).toLocaleDateString()} at ${new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        },
        {
            key: "status",
            header: "Status",
            renderCell: (o) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize border ${
                    o.status === 'approved' ? 'bg-success-50 text-success border-success' :
                    o.status === 'rejected' ? 'bg-danger-50 text-danger border-danger' :
                    'bg-transparent text-yellow-600 border-yellow-400'
                }`}>
                    {o.status}
                </span>
            )
        },
        {
            key: "actions",
            header: "Actions",
            align: "center",
            renderCell: (o) => (
                <div className="text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    {o.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-2">
                            <button
                                className="px-2.5 py-1.5 bg-success-50 text-success border border-success hover:bg-success-100 rounded text-xs font-medium transition-colors flex items-center cursor-pointer"
                                onClick={() => openConfirmModal('approve', o._id)}
                            >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Approve
                            </button>
                            <button
                                className="px-2.5 py-1.5 bg-red-50 text-danger border border-red-200 hover:bg-red-100 rounded text-xs font-medium transition-colors flex items-center cursor-pointer"
                                onClick={() => openConfirmModal('reject', o._id)}
                            >
                                <X className="w-3.5 h-3.5 mr-1" />
                                Reject
                            </button>
                        </div>
                    ) : (
                        <span className="text-gray-400 text-xs italic">Processed</span>
                    )}
                </div>
            )
        }
    ];

    const cardConfig = {
        avatar: (o) => o.user?.name ? o.user.name.substring(0, 2).toUpperCase() : 'NA',
        title: (o) => o.user?.name || 'Unknown User',
        subtitle: (o) => o.user?.email || 'N/A',
        status: (o) => {
            let dotColor = 'bg-yellow-500', bgColor = 'bg-yellow-50', textColor = 'text-yellow-600';
            if (o.status === 'approved') { dotColor = 'bg-green-500'; bgColor = 'bg-green-50'; textColor = 'text-green-600'; }
            else if (o.status === 'rejected') { dotColor = 'bg-red-500'; bgColor = 'bg-red-50'; textColor = 'text-red-600'; }
            return {
                label: o.status || 'Pending',
                dotClass: dotColor,
                bgClass: bgColor,
                textClass: textColor
            };
        },
        fields: [
            { label: "Role", value: (o) => o.userRole || o.user?.role || 'User' },
        ],
        actionSlot: (o) => (
            o.status === 'pending' && (
                <div className="flex items-center gap-1.5 mt-2" onClick={e => e.stopPropagation()}>
                    <button
                        className="px-2 py-1 bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 rounded text-[10px] font-medium transition-colors flex items-center cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); openConfirmModal('approve', o._id); }}
                    >
                        <Check className="w-3 h-3 mr-0.5" />
                        Approve
                    </button>
                    <button
                        className="px-2 py-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded text-[10px] font-medium transition-colors flex items-center cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); openConfirmModal('reject', o._id); }}
                    >
                        <X className="w-3 h-3 mr-0.5" />
                        Reject
                    </button>
                </div>
            )
        )
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <PasswordRequestsHeader />

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col min-h-0 mt-2">
                <DataView
                    pageScrollMode={true}
                    data={requests}
                    columns={columns}
                    cardConfig={cardConfig}
                    loading={isLoading}
                    searchPlaceholder="Search user or email..."
                    searchQuery={searchQuery}
                    onSearchChange={(e) => { 
                        setSearchQuery(e.target.value); 
                        setPagination(p => ({ ...p, page: 1 })); 
                    }}
                    toolbarEndSlot={
                        <>
                            <div className="relative">
                                <button
                                    onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                                    className="flex items-center justify-center p-2 bg-white border border-gray-100 lg:border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer h-full"
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
                            <button
                                onClick={() => setIsFilterModalOpen(true)}
                                className="flex items-center justify-center p-2 bg-white border border-gray-100 lg:border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer h-full w-[38px]"
                                title="Filter"
                            >
                                <SlidersHorizontal className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsExportConfirmOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 lg:border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap h-full"
                            >
                                <Download size={16} /> Export
                            </button>
                        </>
                    }
                    emptyText="No pending password requests found."
                    selection={{
                        selectedIds: selectedRequests,
                        onSelectAll: handleSelectAll,
                        onSelectRow: handleSelectOne,
                        getItemId: (o) => o._id,
                        isSelectable: (o) => o.status === 'pending'
                    }}
                    pagination={{
                        currentPage: pagination.page,
                        totalPages: pagination.totalPages,
                        onPageChange: (p) => fetchRequests(p),
                        limit: limit,
                        onLimitChange: (l) => { setLimit(l); fetchRequests(1); },
                        totalItems: pagination.totalDocs,
                    }}
                    mobilePagination={{
                        hasMore: pagination.page < pagination.totalPages,
                        onLoadMore: () => fetchRequests(pagination.page + 1),
                    }}
                    getItemId={(o) => o._id}
                />
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
                        defaultValue: statusFilter.toLowerCase(),
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
        </div>
    );
};

export default PasswordRequests;
