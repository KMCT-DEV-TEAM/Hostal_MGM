import { useState, useEffect } from "react";
import { Check, X, Search, Mail, Clock, ShieldCheck, Download, ChevronDown, ChevronLeft, ChevronRight, Square, CheckSquare } from "lucide-react";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { passwordRequestApi } from "@/features/dashboard/api/passwordRequestApi";
import { exportToExcel } from "@/utils/exportUtils";
import ExportFilterModal from "@/components/ui/ExportFilterModal";
import TableSkeletonLoader from "@/components/ui/TableSkeletonLoader";
import MobileSkeletonLoader from "@/components/ui/MobileSkeletonLoader";

const PasswordRequests = () => {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
    const [selectedRequests, setSelectedRequests] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, id: null });
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const pendingIds = requests.filter(req => req.status === 'pending').map(req => req._id);
            setSelectedRequests(pendingIds);
        } else {
            setSelectedRequests([]);
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
            // The API response from sendSuccess spreads the payload directly on the response object
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
        setSelectedRequests([]);
    }, [requests]);

    const openConfirmModal = (type, id = null) => {
        setConfirmModal({ isOpen: true, type, id });
    };

    const closeConfirmModal = () => {
        if (!isActionLoading) {
            setConfirmModal({ isOpen: false, type: null, id: null });
        }
    };

    const executeAction = async () => {
        setIsActionLoading(true);
        try {
            if (confirmModal.type === 'approve') {
                await passwordRequestApi.approvePasswordRequest(confirmModal.id);
                showSuccessToast('Request Approved', 'User password has been successfully updated.');
            } else if (confirmModal.type === 'reject') {
                await passwordRequestApi.rejectPasswordRequest(confirmModal.id);
                showSuccessToast('Request Rejected', 'Password request has been rejected.');
            } else if (confirmModal.type === 'bulkApprove') {
                await Promise.all(selectedRequests.map(id => passwordRequestApi.approvePasswordRequest(id)));
                showSuccessToast('Bulk Approve', `Successfully approved ${selectedRequests.length} requests.`);
                setSelectedRequests([]);
            } else if (confirmModal.type === 'bulkReject') {
                await Promise.all(selectedRequests.map(id => passwordRequestApi.rejectPasswordRequest(id)));
                showSuccessToast('Bulk Reject', `Successfully rejected ${selectedRequests.length} requests.`);
                setSelectedRequests([]);
            }
            fetchRequests(pagination.page);
        } catch (error) {
            showErrorToast('Action Failed', error?.response?.data?.message || 'Operation failed.');
        } finally {
            setIsActionLoading(false);
            closeConfirmModal();
        }
    };

    const handleExport = async (exportFilters) => {
        setIsExporting(true);
        try {
            let apiStatus = statusFilter === 'All' ? 'all' : statusFilter.toLowerCase();
            if (exportFilters && exportFilters.status) {
                apiStatus = exportFilters.status;
            }

            const res = await passwordRequestApi.getPasswordRequests({ 
                page: 1, 
                limit: 100000, 
                status: apiStatus,
                search: debouncedSearch
            });
            const allRequests = res.data.requests || [];
            
            if (allRequests.length > 0) {
                const exportData = allRequests.map((req, index) => ({
                    "SL No": index + 1,
                    "User Name": req.user.name,
                    "Email": req.user.email,
                    "Role": req.user.role,
                    "Status": req.status,
                    "Requested At": new Date(req.createdAt).toLocaleString()
                }));
                exportToExcel(exportData, "Password_Requests_Export", "Requests");
                showSuccessToast('Export Successful', 'Data has been exported.');
            } else {
                showErrorToast('Export Failed', 'No data available to export.');
            }
        } catch (error) {
            showErrorToast('Export Failed', 'Failed to export data.');
        } finally {
            setIsExporting(false);
            setIsExportConfirmOpen(false);
        }
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-2 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Password Requests</h1>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Manage password reset requests</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {selectedRequests.length > 0 && (
                        <div className="flex items-center gap-2 mr-2">
                            <button
                                onClick={() => openConfirmModal('bulkApprove')}
                                className="px-3 py-2 bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <Check className="w-4 h-4" /> Approve ({selectedRequests.length})
                            </button>
                            <button
                                onClick={() => openConfirmModal('bulkReject')}
                                className="px-3 py-2 bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <X className="w-4 h-4" /> Reject ({selectedRequests.length})
                            </button>
                        </div>
                    )}
                </div>
            </div>

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
                                placeholder="Search user or email..."
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
                        <div className="flex gap-3 w-full sm:w-auto">
                            <Dropdown
                                className="flex-1 sm:flex-none"
                                options={[
                                    { value: "All", label: "All Status" },
                                    { value: "Pending", label: "Pending" },
                                    { value: "Approved", label: "Approved" },
                                    { value: "Rejected", label: "Rejected" }
                                ]}
                                value={statusFilter}
                                onChange={(val) => setStatusFilter(val)}
                                placeholder="All"
                                minWidth="w-32"
                                triggerClassName="w-full px-3 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm text-[#777777] font-medium shadow-sm md:shadow-none focus:border-[#0A437A] cursor-pointer"
                            />
                            <button
                                onClick={() => setIsExportConfirmOpen(true)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
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
                                <th className="p-4 w-12 text-center">
                                    <button 
                                        onClick={handleSelectAll} 
                                        className="focus:outline-none text-gray-300 hover:text-gray-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={pendingRequestsCount === 0}
                                    >
                                        {pendingRequestsCount > 0 && selectedRequests.length === pendingRequestsCount ? (
                                            <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                </th>
                                <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">User</th>
                                <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Email</th>
                                <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Role</th>
                                <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Requested At</th>
                                <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Status</th>
                                <th className="p-4 text-center normal-case text-sm font-semibold text-[#222222]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {isLoading ? (
                                <TableSkeletonLoader columns={7} />
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-400">
                                        No pending password requests found.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((request) => (
                                    <tr key={request._id} className={`hover:bg-gray-50/40 transition-colors ${selectedRequests.includes(request._id) ? 'bg-blue-50/40' : ''}`}>
                                        <td className="p-4 text-center">
                                            {request.status === 'pending' ? (
                                                <button onClick={() => handleSelectOne(request._id)} className="focus:outline-none text-gray-300 cursor-pointer">
                                                    {selectedRequests.includes(request._id) ? (
                                                        <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                                    ) : (
                                                        <Square className="w-5 h-5" />
                                                    )}
                                                </button>
                                            ) : (
                                                <button disabled className="focus:outline-none text-gray-300 opacity-50 cursor-not-allowed">
                                                    <Square className="w-5 h-5" />
                                                </button>
                                            )}
                                        </td>
                                        <td className="p-4 font-medium text-[#777777]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                    {request.user.name ? request.user.name.substring(0, 2) : 'NA'}
                                                </div>
                                                <span className="font-medium text-[#777777]">{request.user.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-start text-gray-500">
                                            <div className="flex items-center justify-start gap-1.5 text-gray-500">
                                                <Mail size={14} className="text-gray-400" />
                                                <span>{request.user.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-start">
                                            <div className="flex items-center justify-start gap-1.5 text-gray-500">
                                                <ShieldCheck size={14} className="text-gray-400" />
                                                <span className="capitalize">{request.user.role}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-start text-gray-500">
                                            <div className="flex items-center justify-start gap-1.5">
                                                <Clock size={14} className="text-gray-400" />
                                                <span>{new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-start">
                                            <div className="relative inline-block w-[105px]">
                                                <Dropdown
                                                    minWidth=""
                                                    options={[
                                                        { value: "pending", label: "Pending" },
                                                        { value: "approved", label: "Approved" },
                                                        { value: "rejected", label: "Rejected" }
                                                    ]}
                                                    value={request.status}
                                                    onChange={(val) => {
                                                        if (request.status !== 'pending') {
                                                            showErrorToast('Action Not Allowed', 'Processed requests cannot be changed.');
                                                            return;
                                                        }
                                                        if (val === 'approved') openConfirmModal('approve', request._id);
                                                        else if (val === 'rejected') openConfirmModal('reject', request._id);
                                                    }}
                                                    triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${
                                                        request.status === 'approved' ? 'bg-green-50 text-success border-green-200 hover:bg-green-100' :
                                                        request.status === 'rejected' ? 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/20' :
                                                        'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                                                    }`}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {request.status === 'pending' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        className="px-2.5 py-1.5 bg-green-50 text-success border border-green-200 hover:bg-green-100 rounded text-xs font-medium transition-colors flex items-center cursor-pointer"
                                                        onClick={() => openConfirmModal('approve', request._id)}
                                                    >
                                                        <Check className="w-3.5 h-3.5 mr-1" />
                                                        Approve
                                                    </button>
                                                    <button 
                                                        className="px-2.5 py-1.5 bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 rounded text-xs font-medium transition-colors flex items-center cursor-pointer"

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
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden flex flex-col gap-4 mt-4 flex-1 overflow-y-auto pb-4 px-2 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {pendingRequestsCount > 0 && (
                        <div className="flex items-center gap-2 px-1 mb-1">
                            <button onClick={handleSelectAll} className="focus:outline-none text-gray-400 cursor-pointer flex items-center gap-2">
                                {pendingRequestsCount > 0 && selectedRequests.length === pendingRequestsCount ? (
                                    <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                ) : (
                                    <Square className="w-5 h-5" />
                                )}
                                <span className="text-sm font-medium text-gray-600">Select All</span>
                            </button>
                        </div>
                    )}
                    {isLoading ? (
                        <MobileSkeletonLoader />
                    ) : requests.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
                            No pending password requests found.
                        </div>
                    ) : (
                        requests.map((request) => {
                            const isSelected = selectedRequests.includes(request._id);
                            return (
                            <div key={request._id} className={`p-4 bg-white rounded-xl shadow-sm flex flex-col relative border ${isSelected ? 'border-[#0A437A] bg-blue-50/20' : 'border-gray-200'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-start gap-3">
                                        {request.status === 'pending' ? (
                                            <button onClick={() => handleSelectOne(request._id)} className="focus:outline-none text-gray-300 cursor-pointer mt-0.5 shrink-0">
                                                {isSelected ? (
                                                    <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                                ) : (
                                                    <Square className="w-5 h-5" />
                                                )}
                                            </button>
                                        ) : (
                                            <button disabled className="focus:outline-none text-gray-300 opacity-50 cursor-not-allowed mt-0.5 shrink-0">
                                                <Square className="w-5 h-5" />
                                            </button>
                                        )}
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900">{request.user.name}</h3>
                                            <p className="text-xs text-gray-500">{request.user.email}</p>
                                        </div>
                                    </div>
                                    <div className="relative inline-block w-[100px]">
                                        <Dropdown
                                            minWidth=""
                                            options={[
                                                { value: "pending", label: "Pending" },
                                                { value: "approved", label: "Approved" },
                                                { value: "rejected", label: "Rejected" }
                                            ]}
                                            value={request.status}
                                            onChange={(val) => {
                                                if (request.status !== 'pending') {
                                                    showErrorToast('Action Not Allowed', 'Processed requests cannot be changed.');
                                                    return;
                                                }
                                                if (val === 'approved') openConfirmModal('approve', request._id);
                                                else if (val === 'rejected') openConfirmModal('reject', request._id);
                                            }}
                                            triggerClassName={`px-2 py-1 text-[10px] font-regular border transition-colors ${
                                                request.status === 'approved' ? 'bg-green-50 text-success border-green-200 hover:bg-green-100' :
                                                request.status === 'rejected' ? 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/20' :
                                                'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                                            }`}
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-end mt-4">
                                    <div className="text-[10px] text-gray-500 space-y-1">
                                        <div>Role: <span className="capitalize text-gray-700 font-medium">{request.user.role}</span></div>
                                        <div>{new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                    
                                    {request.status === 'pending' ? (
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                className="px-2 py-1 h-7 text-[10px] text-green-600 border-green-200 hover:bg-green-50 cursor-pointer"
                                                onClick={() => openConfirmModal('approve', request._id)}
                                            >
                                                <Check className="w-3 h-3 mr-1" /> Approve
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="px-2 py-1 h-7 text-[10px] text-danger border-danger/20 hover:bg-danger/10 cursor-pointer"

                                                onClick={() => openConfirmModal('reject', request._id)}
                                            >
                                                <X className="w-3 h-3 mr-1" /> Reject
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-[10px] italic">Processed</span>
                                    )}
                                </div>
                            </div>
                        )})
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
                                onClick={() => fetchRequests(pagination.page - 1)}
                                className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            
                            {Array.from({ length: pagination.totalPages }, (_, index) => {
                                const pageNum = index + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => fetchRequests(pageNum)}
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
                        options: [
                            { label: 'All Status', value: 'all' },
                            { label: 'Pending', value: 'pending' },
                            { label: 'Approved', value: 'approved' },
                            { label: 'Rejected', value: 'rejected' },
                        ]
                    }
                ]}
            />

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
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
                                className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors cursor-pointer flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                                    confirmModal.type === 'approve' || confirmModal.type === 'bulkApprove'
                                        ? 'bg-green-600 hover:bg-green-700'
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
