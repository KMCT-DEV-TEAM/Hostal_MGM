import { useState, useEffect } from "react";
import { Check, X, Search, Mail, Clock, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { passwordRequestApi } from "@/features/dashboard/api/passwordRequestApi";

const PasswordRequests = () => {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });

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

    const handleApprove = async (id) => {
        try {
            await passwordRequestApi.approvePasswordRequest(id);
            showSuccessToast('Request Approved', 'User password has been successfully updated.');
            fetchRequests(pagination.page);
        } catch (error) {
            showErrorToast('Approval Failed', error?.message || 'Failed to approve request');
        }
    };

    const handleReject = async (id) => {
        try {
            await passwordRequestApi.rejectPasswordRequest(id);
            showSuccessToast('Request Rejected', 'Password request has been rejected.');
            fetchRequests(pagination.page);
        } catch (error) {
            showErrorToast('Rejection Failed', error?.message || 'Failed to reject request');
        }
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Password Requests</h1>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search user or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#0A437A] focus:outline-none"
                        />
                    </div>
                    <div className="w-full sm:w-40">
                        <Dropdown
                            options={[
                                { value: "All", label: "All Status" },
                                { value: "Pending", label: "Pending" },
                                { value: "Approved", label: "Approved" },
                                { value: "Rejected", label: "Rejected" }
                            ]}
                            value={statusFilter}
                            onChange={(val) => setStatusFilter(val)}
                            placeholder="Status"
                            triggerClassName="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#777777] font-medium focus:border-[#0A437A] cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-transparent md:bg-white md:rounded-lg md:border md:border-gray-200 md:overflow-hidden flex flex-col min-h-0 h-full">
                
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-[#FAFBFD] shadow-sm">
                            <tr className="bg-[#FAFBFD] border-b border-gray-100 text-gray-400 text-xs tracking-wider uppercase font-semibold">
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
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        Loading requests...
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-400">
                                        No pending password requests found.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((request) => (
                                    <tr key={request._id} className="hover:bg-gray-50/40 transition-colors">
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
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${
                                                request.status === 'approved' ? 'bg-green-50 text-success border-green-200' :
                                                request.status === 'rejected' ? 'bg-danger/10 text-danger border-danger/20' :
                                                'bg-yellow-50 text-yellow-700 border-yellow-200'
                                            }`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {request.status === 'pending' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        className="px-2.5 py-1.5 bg-green-50 text-success border border-green-200 hover:bg-green-100 rounded text-xs font-medium transition-colors flex items-center cursor-pointer"
                                                        onClick={() => handleApprove(request._id)}
                                                    >
                                                        <Check className="w-3.5 h-3.5 mr-1" />
                                                        Approve
                                                    </button>
                                                    <button 
                                                        className="px-2.5 py-1.5 bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 rounded text-xs font-medium transition-colors flex items-center cursor-pointer"
                                                        onClick={() => handleReject(request._id)}
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
                <div className="md:hidden flex-1 overflow-y-auto space-y-3 pb-4">
                    {isLoading ? (
                        <div className="p-6 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                            Loading requests...
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                            No pending password requests found.
                        </div>
                    ) : (
                        requests.map((request) => (
                            <div key={request._id} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">{request.user.name}</h3>
                                        <p className="text-xs text-gray-500">{request.user.email}</p>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                                        request.status === 'approved' ? 'bg-green-50 text-green-700' :
                                        request.status === 'rejected' ? 'bg-danger/10 text-danger' :
                                        'bg-yellow-50 text-yellow-700'
                                    }`}>
                                        {request.status}
                                    </span>
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
                                                onClick={() => handleApprove(request._id)}
                                            >
                                                <Check className="w-3 h-3 mr-1" /> Approve
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="px-2 py-1 h-7 text-[10px] text-danger border-danger/20 hover:bg-danger/10 cursor-pointer"
                                                onClick={() => handleReject(request._id)}
                                            >
                                                <X className="w-3 h-3 mr-1" /> Reject
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-[10px] italic">Processed</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {!isLoading && pagination.totalPages > 1 && (
                    <div className="bg-white px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-3 rounded-b-lg">
                        <span className="text-sm text-gray-500">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                disabled={!pagination.hasPreviousPage}
                                onClick={() => fetchRequests(pagination.page - 1)}
                                className="cursor-pointer"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                disabled={!pagination.hasNextPage}
                                onClick={() => fetchRequests(pagination.page + 1)}
                                className="cursor-pointer"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PasswordRequests;
