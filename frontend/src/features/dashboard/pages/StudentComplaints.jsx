import React, { useState } from 'react';
import StudentComplaintsTable from '../components/complaints/StudentComplaintsTable';
import StudentComplaintsHeader from '../components/complaints/StudentComplaintsHeader';
import StudentComplaintsToolbar from '../components/complaints/StudentComplaintsToolbar';
import StudentComplaintFormModal from '../components/complaints/StudentComplaintFormModal';
import StudentComplaintDetailModal from '../components/complaints/StudentComplaintDetailModal';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import { exportToExcel } from '@/utils/exportUtils';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function StudentComplaints() {
    // Initial mocked student complaints
    const initialComplaints = [
        {
            id: '1',
            category: 'Mess',
            subject: 'Food was cold and not fresh',
            date: '12 June',
            status: 'Pending'
        }
    ];

    const [complaints, setComplaints] = useState(initialComplaints);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingComplaint, setEditingComplaint] = useState(null);
    const [selectedDetailComplaint, setSelectedDetailComplaint] = useState(null);
    
    // Confirmation modals state
    const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);
    const [pendingFormData, setPendingFormData] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleCategoryChange = (id, newCategory) => {
        setComplaints(complaints.map(c =>
            c.id === id ? { ...c, category: newCategory } : c
        ));
    };

    const handleEdit = (complaint) => {
        setEditingComplaint(complaint);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingComplaint(null);
        setIsModalOpen(true);
    };

    const handleSaveComplaintClick = (formData) => {
        if (editingComplaint) {
            setPendingFormData(formData);
            setIsSaveConfirmOpen(true);
        } else {
            // Direct save for Add New
            const newComplaint = {
                id: Math.random().toString(36).substr(2, 9),
                category: formData.category,
                subject: formData.subject,
                description: formData.description,
                roomNo: formData.roomNo,
                date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }),
                status: 'Pending'
            };
            setComplaints([newComplaint, ...complaints]);
            setIsModalOpen(false);
            setEditingComplaint(null);
        }
    };

    const confirmSaveComplaint = () => {
        if (!pendingFormData) return;
        
        if (editingComplaint) {
            setComplaints(complaints.map(c => 
                c.id === editingComplaint.id 
                    ? { ...c, category: pendingFormData.category, subject: pendingFormData.subject, description: pendingFormData.description, roomNo: pendingFormData.roomNo }
                    : c
            ));
        } else {
            const newComplaint = {
                id: Math.random().toString(36).substr(2, 9),
                category: pendingFormData.category,
                subject: pendingFormData.subject,
                description: pendingFormData.description,
                roomNo: pendingFormData.roomNo,
                date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }),
                status: 'Pending'
            };
            setComplaints([newComplaint, ...complaints]);
        }
        setIsSaveConfirmOpen(false);
        setIsModalOpen(false);
        setEditingComplaint(null);
        setPendingFormData(null);
    };

    const confirmDiscard = () => {
        setIsDiscardConfirmOpen(false);
        setIsModalOpen(false);
        setEditingComplaint(null);
    };

    const confirmWithdraw = () => {
        if (editingComplaint) {
            // Remove the complaint
            setComplaints(complaints.filter(c => c.id !== editingComplaint.id));
        }
        setIsWithdrawConfirmOpen(false);
        setIsModalOpen(false);
        setEditingComplaint(null);
    };

    // Apply filtering
    let filteredComplaints = complaints.filter(c => {
        const query = searchQuery.toLowerCase();
        return Object.values(c).some(val => 
            String(val).toLowerCase().includes(query)
        );
    });
    if (statusFilter !== 'All') {
        filteredComplaints = filteredComplaints.filter(c => c.status === statusFilter);
    }

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
                    "Category": complaint.category,
                    "Subject": complaint.subject,
                    "Date": complaint.date,
                    "Status": complaint.status,
                }));

                const isSuccess = exportToExcel(exportData, "Student_Complaints_Export", "Complaints");
                
                if (isSuccess) {
                    showSuccessToast('Export Successful', 'Your complaints list has been downloaded.');
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

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <StudentComplaintsHeader />
            <div className="bg-transparent md:bg-[#F8FAFC] md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0 mt-2">
                {/* Toolbar Section */}
                <StudentComplaintsToolbar
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    setCurrentPage={setCurrentPage}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    initiateExport={() => setIsExportConfirmOpen(true)}
                    openAddComplaintModal={handleAdd}
                />

                {/* Table Section */}
                <StudentComplaintsTable
                    complaints={paginatedComplaints}
                    handleCategoryChange={handleCategoryChange}
                    openEditModal={handleEdit}
                    onViewDetail={(complaint) => setSelectedDetailComplaint(complaint)}
                />

                {/* PAGINATION BAR FOOTER */}
                <div className="flex flex-row p-3 sm:p-4 bg-white border border-gray-50 items-center justify-between text-[10px] sm:text-xs font-medium text-text-secondary rounded-b-xl shadow-sm shrink-0 mt-auto">
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
                            className="p-1.5 rounded border border-gray-200 text-text-secondary hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
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
                                        ? 'bg-primary text-white shadow-sm font-bold'
                                        : 'border border-transparent text-text-secondary hover:bg-gray-50'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="p-1.5 rounded border border-gray-200 text-text-secondary hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <StudentComplaintFormModal 
                    editingComplaint={editingComplaint}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingComplaint(null);
                    }}
                    onSave={handleSaveComplaintClick}
                    onCancel={() => {
                        if (editingComplaint) {
                            setIsDiscardConfirmOpen(true);
                        } else {
                            setIsModalOpen(false);
                            setEditingComplaint(null);
                        }
                    }}
                    onWithdraw={() => setIsWithdrawConfirmOpen(true)}
                />
            )}

            {isSaveConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-bold text-text-primary">Save Changes</h3>
                        <p className="text-xs text-text-secondary mt-1 mb-6">
                            Are you sure you want to save these changes?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setIsSaveConfirmOpen(false)}
                                className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSaveComplaint}
                                className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isDiscardConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-bold text-text-primary">Discard Changes</h3>
                        <p className="text-xs text-text-secondary mt-1 mb-6">
                            Are you sure you want to discard your changes? Any unsaved edits will be lost.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setIsDiscardConfirmOpen(false)}
                                className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Continue Editing
                            </button>
                            <button
                                onClick={confirmDiscard}
                                className="px-3 py-1.5 text-xs font-medium bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors cursor-pointer"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isWithdrawConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-bold text-text-primary">Withdraw Complaint</h3>
                        <p className="text-xs text-text-secondary mt-1 mb-6">
                            Are you sure you want to withdraw this complaint? This action cannot be undone.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setIsWithdrawConfirmOpen(false)}
                                className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmWithdraw}
                                className="px-3 py-1.5 text-xs font-medium bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors cursor-pointer"
                            >
                                Withdraw
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedDetailComplaint && (
                <StudentComplaintDetailModal 
                    complaint={selectedDetailComplaint} 
                    onClose={() => setSelectedDetailComplaint(null)} 
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
