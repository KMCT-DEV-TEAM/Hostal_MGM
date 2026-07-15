import React, { useState, useEffect } from 'react';
import SuperAdminComplaintsTable from '../components/complaints/SuperAdminComplaintsTable';
import AdminComplaintsMobileList from '../components/complaints/AdminComplaintsMobileList';
import ComplaintsToolbar from '../components/complaints/ComplaintsToolbar';
import WardenComplaints from './WardenComplaints';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { AlertTriangle, Clock, Loader2, CheckCircle, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import ComplaintService from '@/services/complaint.service';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import { initSocket } from '@/services/socket.service';

export default function AdminComplaints() {
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
    const [complaints, setComplaints] = useState([]);
    const [aggregatedData, setAggregatedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedHostel, setSelectedHostel] = useState(null);
    const [showKPIs, setShowKPIs] = useState(false);
    const limit = 10;

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const response = await ComplaintService.getAllComplaints();
            const rawComplaints = response.data || [];
            setComplaints(rawComplaints);

            // Aggregate data by Hostel
            const hostelMap = {};
            rawComplaints.forEach(c => {
                const hostelName = c.hostelId?.name || 'Unknown Hostel';
                const orgName = c.organizationId?.name || 'Unknown Org';
                const wardenName = c.hostelId?.wardens?.length > 0 
                    ? c.hostelId.wardens.map(w => w.name).join(', ') 
                    : 'N/A';

                if (!hostelMap[hostelName]) {
                    hostelMap[hostelName] = {
                        id: hostelName,
                        organization: orgName,
                        hostel: hostelName,
                        warden: wardenName,
                        totalComplaints: 0,
                        pending: 0,
                        inProgress: 0,
                        resolved: 0
                    };
                }

                hostelMap[hostelName].totalComplaints++;
                if (c.status === 'Pending') hostelMap[hostelName].pending++;
                if (c.status === 'In progress') hostelMap[hostelName].inProgress++;
                if (c.status === 'Resolved') hostelMap[hostelName].resolved++;
            });

            setAggregatedData(Object.values(hostelMap));
        } catch (error) {
            showErrorToast('Failed to load complaints', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
        
        const socket = initSocket();
        
        const handleComplaintEvent = () => {
            fetchComplaints();
        };

        socket.on('complaintCreated', handleComplaintEvent);
        socket.on('complaintUpdated', handleComplaintEvent);
        socket.on('complaintDeleted', handleComplaintEvent);

        return () => {
            socket.off('complaintCreated', handleComplaintEvent);
            socket.off('complaintUpdated', handleComplaintEvent);
            socket.off('complaintDeleted', handleComplaintEvent);
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // Reset page on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Apply filtering on aggregated data
    let filteredComplaints = aggregatedData.filter(c => {
        // Search Query
        if (!debouncedSearch) return true;
        const query = debouncedSearch.toLowerCase();
        return (
            c.organization.toLowerCase().includes(query) ||
            c.hostel.toLowerCase().includes(query) ||
            c.warden.toLowerCase().includes(query)
        );
    });


    // Apply pagination
    const totalComplaintsCount = filteredComplaints.length;
    const totalPages = Math.ceil(totalComplaintsCount / limit) || 1;
    const paginatedComplaints = filteredComplaints.slice((currentPage - 1) * limit, currentPage * limit);

    if (selectedHostel) {
        return <WardenComplaints hostel={selectedHostel} onBack={() => setSelectedHostel(null)} />;
    }

    // Top cards aggregate
    const totalAll = complaints.length;
    const pendingAll = complaints.filter(c => c.status === 'Pending').length;
    const inProgressAll = complaints.filter(c => c.status === 'In progress').length;
    const resolvedAll = complaints.filter(c => c.status === 'Resolved').length;

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] p-4 md:p-6 md:px-8 text-black flex flex-col">

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-6 w-full text-left">
                <div>
                    <h1 className="text-2xl font-bold text-black">Complaints</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor complaint performance across organizations.</p>
                </div>
                
                <div className="hidden md:flex items-center self-end sm:self-auto">
                    <button
                        onClick={() => setShowKPIs(!showKPIs)}
                        className="flex items-center gap-2 p-2 text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        {showKPIs ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Stat Cards Section */}
            {showKPIs && (
            <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-red-300 shadow-sm border-x border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Complaints</p>
                        <h3 className="text-xl font-bold text-gray-900">{totalAll}</h3>
                    </div>
                    <div className="p-1.5 bg-red-50 rounded text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-orange-300 shadow-sm border-x border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pending</p>
                        <h3 className="text-xl font-bold text-gray-900">{pendingAll}</h3>
                    </div>
                    <div className="p-1.5 bg-orange-50 rounded text-orange-400">
                        <Clock className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-blue-300 shadow-sm border-x border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">In Progress</p>
                        <h3 className="text-xl font-bold text-gray-900">{inProgressAll}</h3>
                    </div>
                    <div className="p-1.5 bg-blue-50 rounded text-blue-400">
                        <Loader2 className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-green-300 shadow-sm border-x border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resolved</p>
                        <h3 className="text-xl font-bold text-gray-900">{resolvedAll}</h3>
                    </div>
                    <div className="p-1.5 bg-green-50 rounded text-green-500">
                        <CheckCircle className="w-4 h-4" />
                    </div>
                </div>
            </div>
            )}

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0 mt-2">
                {/* Toolbar Section */}
                <ComplaintsToolbar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />

                {/* Table Section */}
                <div className="hidden md:block flex-1 min-h-0">
                    <SuperAdminComplaintsTable
                        complaints={paginatedComplaints}
                        loading={loading}
                        onRowClick={(complaint) => setSelectedHostel(complaint.hostel)}
                        showWarden={true}
                    />
                </div>

                <AdminComplaintsMobileList
                    currentPage={currentPage}
                    totalPages={totalPages}
                    hasMore={currentPage < totalPages}
                    onLoadMore={() => setCurrentPage(prev => prev + 1)}
                    complaints={paginatedComplaints}
                    loading={loading}
                    onRowClick={(complaint) => setSelectedHostel(complaint.hostel)}
                    showWarden={true}
                />

                {/* PAGINATION BAR FOOTER */}
                <div className="hidden md:flex flex-row p-3 sm:p-4 bg-white border border-gray-50 items-center justify-between text-[10px] sm:text-xs font-medium text-gray-500 rounded-b-xl shadow-sm shrink-0 mt-auto">
                    <div>
                        <span className="hidden sm:inline">Showing </span>
                        {totalComplaintsCount === 0 ? 0 : (currentPage - 1) * limit + 1}
                        <span className="hidden sm:inline"> to </span>
                        <span className="sm:hidden">-</span>
                        {Math.min(currentPage * limit, totalComplaintsCount)} of {totalComplaintsCount}
                        <span className="hidden sm:inline"> entries</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {(() => {
                            let startPage = Math.max(1, currentPage - 1);
                            let endPage = Math.min(totalPages, currentPage + 1);

                            if (endPage - startPage < 2) {
                                if (startPage === 1) {
                                    endPage = Math.min(totalPages, 3);
                                } else if (endPage === totalPages) {
                                    startPage = Math.max(1, totalPages - 2);
                                }
                            }

                            const visiblePages = [];
                            for (let i = startPage; i <= endPage; i++) {
                                visiblePages.push(i);
                            }

                            return visiblePages.map(pageNum => (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-7 h-7 rounded flex items-center justify-center transition-all ${currentPage === pageNum
                                        ? 'bg-[#0A437A] text-white shadow-sm font-bold'
                                        : 'border border-transparent text-gray-600 hover:bg-gray-50'
                                        } cursor-pointer`}
                                >
                                    {pageNum}
                                </button>
                            ));
                        })()}

                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>


        </div>
    );
}

