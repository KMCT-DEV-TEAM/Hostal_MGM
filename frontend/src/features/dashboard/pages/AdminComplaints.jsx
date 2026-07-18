import React, { useState, useEffect } from 'react';
import SuperAdminComplaintsTable from '../components/complaints/SuperAdminComplaintsTable';

import ComplaintsToolbar from '../components/complaints/ComplaintsToolbar';
import WardenComplaints from './WardenComplaints';
import PageHeader from '@/components/ui/PageHeader';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { AlertTriangle, Clock, Loader2, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
    const [viewMode, setViewMode] = useState('hostel'); // 'hostel' or 'all'
    const [limit, setLimit] = useState(10);

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

    const renderToggle = () => (
        <div className="flex shrink-0 mt-2 sm:mt-0 w-full sm:w-80">
            <div className="flex p-1 bg-gray-100/80 rounded-lg w-full border border-gray-200/50">
                <button
                    onClick={() => setViewMode('hostel')}
                    className={`flex-1 px-4 py-2 text-sm font-bold rounded-md transition-all ${viewMode === 'hostel' ? 'bg-white text-[#0A437A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Hostel Wise
                </button>
                <button
                    onClick={() => setViewMode('all')}
                    className={`flex-1 px-4 py-2 text-sm font-bold rounded-md transition-all ${viewMode === 'all' ? 'bg-white text-[#0A437A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    All Complaints
                </button>
            </div>
        </div>
    );

    if (viewMode === 'all') {
        return <WardenComplaints headerActions={renderToggle()} />;
    }

    // Top cards aggregate
    const totalAll = complaints.length;
    const pendingAll = complaints.filter(c => c.status === 'Pending').length;
    const inProgressAll = complaints.filter(c => c.status === 'In progress').length;
    const resolvedAll = complaints.filter(c => c.status === 'Resolved').length;

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 w-full text-left">
                <div>
                    <PageHeader 
                        title="Complaints" 
                        subtitle="Manage and resolve student complaints." 
                    />
                </div>
                
                {renderToggle()}
            </div>

            {/* Stat Cards Section */}
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

            {/* MOBILE KPI CARDS */}
            <div className="md:hidden flex items-center justify-between px-3 py-4 mb-3 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col items-center flex-1">
                    <span className="text-xl font-bold text-red-500">{totalAll < 10 && totalAll > 0 ? `0${totalAll}` : totalAll}</span>
                    <span className="text-[11px] font-medium text-gray-500 mt-1 capitalize text-center leading-tight">Total</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                    <span className="text-xl font-bold text-orange-500">{pendingAll < 10 && pendingAll > 0 ? `0${pendingAll}` : pendingAll}</span>
                    <span className="text-[11px] font-medium text-gray-500 mt-1 capitalize text-center leading-tight">Pending</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                    <span className="text-xl font-bold text-blue-500">{inProgressAll < 10 && inProgressAll > 0 ? `0${inProgressAll}` : inProgressAll}</span>
                    <span className="text-[11px] font-medium text-gray-500 mt-1 capitalize text-center leading-tight">In Progress</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                    <span className="text-xl font-bold text-green-600">{resolvedAll < 10 && resolvedAll > 0 ? `0${resolvedAll}` : resolvedAll}</span>
                    <span className="text-[11px] font-medium text-gray-500 mt-1 capitalize text-center leading-tight">Resolved</span>
                </div>
            </div>

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col mt-2">
                <SuperAdminComplaintsTable
                    complaints={paginatedComplaints}
                    loading={loading}
                    onRowClick={(complaint) => setSelectedHostel(complaint.hostel)}
                    showWarden={true}
                    page={currentPage}
                    setPage={setCurrentPage}
                    limit={limit}
                    setLimit={setLimit}
                    totalPages={totalPages}
                    totalItems={totalComplaintsCount}
                    searchQuery={searchQuery}
                    onSearchChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>


            </div>
        </div>
    );
}

