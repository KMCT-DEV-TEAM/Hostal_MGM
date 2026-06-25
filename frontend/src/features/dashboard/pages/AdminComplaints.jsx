import React, { useState, useEffect } from 'react';
import SuperAdminComplaintsTable from '../components/complaints/SuperAdminComplaintsTable';
import ComplaintsToolbar from '../components/complaints/ComplaintsToolbar';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import WardenComplaints from './WardenComplaints';
import { exportToExcel } from '@/utils/exportUtils';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { AlertTriangle, Clock, Loader2, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import ComplaintService from '@/services/complaint.service';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';

export default function AdminComplaints() {
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
    const [complaints, setComplaints] = useState([]);
    const [aggregatedData, setAggregatedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOption, setFilterOption] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedHostel, setSelectedHostel] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
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
                // Note: Warden name isn't directly on complaint, we could get it if we populated it,
                // but for now we put a placeholder or "N/A"
                const wardenName = 'N/A';

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
    }, []);

    // Apply filtering on aggregated data
    let filteredComplaints = aggregatedData.filter(c => {
        // Dropdown filter
        if (filterOption !== 'All' && c.hostel !== filterOption && c.organization !== filterOption) return false;

        // Search Query
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            c.organization.toLowerCase().includes(query) ||
            c.hostel.toLowerCase().includes(query) ||
            c.warden.toLowerCase().includes(query)
        );
    });

    const confirmExport = async (exportFilters) => {
        setIsExporting(true);
        try {
            let dataToExport = filteredComplaints;

            if (dataToExport && dataToExport.length > 0) {
                const exportData = dataToExport.map((complaint, index) => {
                    const row = {
                        "Organization": complaint.organization,
                        "Hostel": complaint.hostel,
                        "Total Complaints": complaint.totalComplaints,
                        "Pending": complaint.pending,
                        "In Progress": complaint.inProgress,
                        "Resolved": complaint.resolved,
                    };
                    if (isSuperAdmin) {
                        // Insert Warden before Total Complaints in export
                        const entries = Object.entries(row);
                        entries.splice(2, 0, ["Warden", complaint.warden]);
                        return Object.fromEntries(entries);
                    }
                    return row;
                });

                const isSuccess = exportToExcel(exportData, "Complaints_Export", "Complaints");

                if (isSuccess) {
                    showSuccessToast('Export Successful', 'The complaints list has been downloaded.');
                } else {
                    showErrorToast('Export Failed', 'Could not generate the Excel file.');
                }
            } else {
                showErrorToast('Export Failed', 'No data available to export matching the filters.');
            }
        } catch (error) {
            console.error("Export Failed", error);
            showErrorToast('Export Failed', error?.message || 'Failed to export data.');
        } finally {
            setIsExportConfirmOpen(false);
            setIsExporting(false);
        }
    };

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
            <div className="mb-6 w-full text-left">
                <h1 className="text-2xl font-bold text-black">Complaints</h1>
                <p className="text-sm text-gray-500 mt-1">Monitor complaint performance across organizations.</p>
            </div>

            {/* Stat Cards Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
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

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0 mt-2">
                {/* Toolbar Section */}
                <ComplaintsToolbar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    initiateExport={() => setIsExportConfirmOpen(true)}
                    filterOption={filterOption}
                    setFilterOption={setFilterOption}
                />

                {/* Table Section */}
                <SuperAdminComplaintsTable
                    complaints={paginatedComplaints}
                    onRowClick={(complaint) => setSelectedHostel(complaint.hostel)}
                    showWarden={isSuperAdmin}
                />

                {/* PAGINATION BAR FOOTER */}
                <div className="flex flex-row p-3 sm:p-4 bg-white border border-gray-50 items-center justify-between text-[10px] sm:text-xs font-medium text-gray-500 rounded-b-xl shadow-sm shrink-0 mt-auto">
                    <div className="hidden sm:block">
                        Showing {totalComplaintsCount === 0 ? 0 : (currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, totalComplaintsCount)} of {totalComplaintsCount}
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {Array.from({ length: totalPages }, (_, index) => {
                            const pageNum = index + 1;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer ${currentPage === pageNum
                                        ? 'bg-[#0A437A] text-white shadow-sm font-bold'
                                        : 'border border-transparent text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

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

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Complaints Data"
                fields={[]}
            />
        </div>
    );
}

