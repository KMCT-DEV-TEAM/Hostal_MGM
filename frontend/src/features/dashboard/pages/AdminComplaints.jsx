import React, { useState } from 'react';
import ComplaintsTable from '../components/complaints/ComplaintsTable';
import ComplaintsToolbar from '../components/complaints/ComplaintsToolbar';
import AdminComplaintDetailModal from '../components/complaints/AdminComplaintDetailModal';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import WardenComplaints from './WardenComplaints';
import { exportToExcel } from '@/utils/exportUtils';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { AlertTriangle, Clock, Loader2, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminComplaints() {
    // Initial mocked complaints summary
    const initialComplaints = [
        { id: '1', student: 'Nila Mohan', hostel: 'Hostel A', category: 'Mess', priority: 'High', date: '12 June', due: '2 days', status: 'Pending' },
        { id: '2', student: 'Nila Mohan', hostel: 'Hostel A', category: 'Wifi', priority: 'High', date: '11 June', due: '------', status: 'Resolved' },
        { id: '3', student: 'Nila Mohan', hostel: 'Hostel A', category: 'Mess', priority: 'High', date: '12 June', due: '2 days', status: 'Pending' },
        { id: '4', student: 'Nila Mohan', hostel: 'Hostel A', category: 'Mess', priority: 'High', date: '12 June', due: '2 days', status: 'Resolved' },
        { id: '5', student: 'Nila Mohan', hostel: 'Hostel A', category: 'Mess', priority: 'High', date: '12 June', due: '------', status: 'Pending' },
        { id: '6', student: 'Nila Mohan', hostel: 'Hostel A', category: 'Mess', priority: 'High', date: '12 June', due: '2 days', status: 'Resolved' },
        { id: '7', student: 'Nila Mohan', hostel: 'Hostel A', category: 'Mess', priority: 'High', date: '12 June', due: '------', status: 'In progress' },
        { id: '8', student: 'Nila Mohan', hostel: 'Hostel A', category: 'Mess', priority: 'High', date: '12 June', due: '2 days', status: 'Resolved' }
    ];

    const [complaints] = useState(initialComplaints);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [selectedHostel, setSelectedHostel] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const limit = 10;

    // Apply filtering
    let filteredComplaints = complaints.filter(c => {
        const query = searchQuery.toLowerCase();
        return (
            c.student.toLowerCase().includes(query) ||
            c.hostel.toLowerCase().includes(query) ||
            c.category.toLowerCase().includes(query) ||
            c.priority.toLowerCase().includes(query) ||
            c.status.toLowerCase().includes(query) ||
            c.date.toLowerCase().includes(query) ||
            (c.id && c.id.toLowerCase().includes(query))
        );
    });

    const confirmExport = async (exportFilters) => {
        setIsExporting(true);
        try {
            let dataToExport = complaints;
            
            if (exportFilters.status) {
                dataToExport = dataToExport.filter(c => c.status === exportFilters.status);
            }

            if (dataToExport && dataToExport.length > 0) {
                const exportData = dataToExport.map((complaint, index) => ({
                    "SL No": index + 1,
                    "Student": complaint.student,
                    "Hostel": complaint.hostel,
                    "Category": complaint.category,
                    "Priority": complaint.priority,
                    "Date": complaint.date,
                    "Due": complaint.due || 'N/A',
                    "Status": complaint.status,
                }));

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
    const totalComplaints = filteredComplaints.length;
    const totalPages = Math.ceil(totalComplaints / limit) || 1;
    const paginatedComplaints = filteredComplaints.slice((currentPage - 1) * limit, currentPage * limit);

    if (selectedHostel) {
        return <WardenComplaints hostel={selectedHostel} onBack={() => setSelectedHostel(null)} />;
    }

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            {/* Header Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#0A437A]">Complaints</h1>
                <p className="text-sm text-gray-500 mt-1">Monitor complaint performance across organizations.</p>
            </div>

            {/* Stat Cards Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-danger shadow-sm border border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Complaints</p>
                        <h3 className="text-2xl font-bold text-gray-900">30</h3>
                    </div>
                    <div className="p-1.5 bg-red-50 rounded text-danger">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-warning shadow-sm border border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pending</p>
                        <h3 className="text-2xl font-bold text-gray-900">15</h3>
                    </div>
                    <div className="p-1.5 bg-orange-50 rounded text-warning  ">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-primary/80 flex justify-between items-start">
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">In Progress</p>
                        <h3 className="text-2xl font-bold text-gray-900">2</h3>
                    </div>
                    <div className="p-1.5 bg-blue-50 rounded text-primary">
                        <Loader2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-success shadow-sm border border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Resolved</p>
                        <h3 className="text-2xl font-bold text-gray-900">13</h3>
                    </div>
                    <div className="p-1.5 bg-green-50 rounded text-green-500">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                </div>
            </div>

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0">
                {/* Toolbar Section */}
                <ComplaintsToolbar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    initiateExport={() => setIsExportConfirmOpen(true)}
                    openFilterModal={() => console.log('Open Filter Modal')}
                />

                {/* Table Section */}
                <ComplaintsTable
                    complaints={paginatedComplaints}
                    handleCategoryChange={(id, newCategory) => {
                        // TODO: Implement category change
                        console.log('Category changed:', id, newCategory);
                    }}
                    onRowClick={(complaint) => setSelectedComplaint(complaint)}
                    onHostelClick={(hostel) => setSelectedHostel(hostel)}
                />

                {/* PAGINATION BAR FOOTER */}
                <div className="flex flex-row p-3 sm:p-4 bg-white border border-gray-50 items-center justify-between text-[10px] sm:text-xs font-medium text-gray-500 rounded-b-xl shadow-sm shrink-0 mt-auto">
                    <div className="hidden sm:block">
                        Showing {totalComplaints === 0 ? 0 : (currentPage - 1) * limit + 1} to{" "}
                        {Math.min(currentPage * limit, totalComplaints)} of {totalComplaints} entries
                    </div>
                    <div className="sm:hidden">
                        {totalComplaints === 0 ? 0 : (currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, totalComplaints)} of {totalComplaints}
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
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
                                        : 'border border-transparent text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {selectedComplaint && (
                <AdminComplaintDetailModal
                    complaint={selectedComplaint}
                    onClose={() => setSelectedComplaint(null)}
                />
            )}

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Complaints Data"
                fields={[
                    {
                        name: "status",
                        label: "Complaint Status",
                        options: [
                            { label: 'All Status', value: '' },
                            { label: 'Pending', value: 'Pending' },
                            { label: 'In progress', value: 'In progress' },
                            { label: 'Resolved', value: 'Resolved' },
                        ]
                    }
                ]}
            />
        </div>
    );
}
