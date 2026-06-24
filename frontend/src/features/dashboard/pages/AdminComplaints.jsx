import React, { useState } from 'react';
import SuperAdminComplaintsTable from '../components/complaints/SuperAdminComplaintsTable';
import ComplaintsToolbar from '../components/complaints/ComplaintsToolbar';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import WardenComplaints from './WardenComplaints';
import { exportToExcel } from '@/utils/exportUtils';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { AlertTriangle, Clock, Loader2, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminComplaints() {
    // Mocked complaints matching the requested super admin UI
    const initialComplaints = [
        { id: '1', organization: 'Engineering', hostel: 'Hostel A', warden: 'Priya', totalComplaints: 15, pending: 10, inProgress: 3, resolved: 5 },
        { id: '2', organization: 'Engineering', hostel: 'Hostel A', warden: 'Hima', totalComplaints: 15, pending: 5, inProgress: 6, resolved: 7 },
        { id: '3', organization: 'Engineering', hostel: 'Hostel A', warden: 'Kanaka', totalComplaints: 15, pending: 7, inProgress: 8, resolved: 3 },
        { id: '4', organization: 'Engineering', hostel: 'Hostel A', warden: 'Siddarth', totalComplaints: 15, pending: 9, inProgress: 8, resolved: 6 },
        { id: '5', organization: 'Engineering', hostel: 'Hostel A', warden: 'Arun', totalComplaints: 15, pending: 3, inProgress: 3, resolved: 9 },
        { id: '6', organization: 'Engineering', hostel: 'Hostel A', warden: 'Lalitha', totalComplaints: 15, pending: 2, inProgress: 1, resolved: 10 },
    ];

    const [complaints] = useState(initialComplaints);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOption, setFilterOption] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedHostel, setSelectedHostel] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const limit = 10;

    // Apply filtering
    let filteredComplaints = complaints.filter(c => {
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
                const exportData = dataToExport.map((complaint, index) => ({
                    "Organization": complaint.organization,
                    "Hostel": complaint.hostel,
                    "Warden": complaint.warden,
                    "Total Complaints": complaint.totalComplaints,
                    "Pending": complaint.pending,
                    "In Progress": complaint.inProgress,
                    "Resolved": complaint.resolved,
                }));

                const isSuccess = exportToExcel(exportData, "SuperAdmin_Complaints_Export", "Complaints");

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
    const totalComplaints = filteredComplaints.length;
    const totalPages = Math.ceil(totalComplaints / limit) || 1;
    const paginatedComplaints = filteredComplaints.slice((currentPage - 1) * limit, currentPage * limit);

    if (selectedHostel) {
        return <WardenComplaints hostel={selectedHostel} onBack={() => setSelectedHostel(null)} />;
    }

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-white p-4 md:p-6 md:px-8 text-black flex flex-col">
            
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
                        <h3 className="text-xl font-bold text-gray-900">30</h3>
                    </div>
                    <div className="p-1.5 bg-red-50 rounded text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-orange-300 shadow-sm border-x border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pending</p>
                        <h3 className="text-xl font-bold text-gray-900">15</h3>
                    </div>
                    <div className="p-1.5 bg-orange-50 rounded text-orange-400">
                        <Clock className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-blue-300 shadow-sm border-x border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">In Progress</p>
                        <h3 className="text-xl font-bold text-gray-900">2</h3>
                    </div>
                    <div className="p-1.5 bg-blue-50 rounded text-blue-400">
                        <Loader2 className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-green-300 shadow-sm border-x border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resolved</p>
                        <h3 className="text-xl font-bold text-gray-900">13</h3>
                    </div>
                    <div className="p-1.5 bg-green-50 rounded text-green-500">
                        <CheckCircle className="w-4 h-4" />
                    </div>
                </div>
            </div>

            <div className="bg-white w-full flex-1 flex flex-col min-h-0 border border-transparent">
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
                />

                {/* PAGINATION BAR FOOTER */}
                <div className="flex flex-row p-4 sm:p-5 bg-white items-center justify-between text-xs sm:text-sm font-semibold text-gray-700 shrink-0 mt-auto">
                    <div>
                        Showing {currentPage} Of {totalPages}
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {Array.from({ length: totalPages }, (_, index) => {
                            const pageNum = index + 1;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-8 h-8 rounded flex items-center justify-center transition-all cursor-pointer font-medium ${currentPage === pageNum
                                        ? 'bg-[#0A437A] text-white'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
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

