import React, { useState, useEffect } from 'react';
import WardenComplaintsTable from '../components/complaints/WardenComplaintsTable';
import WardenComplaintsToolbar from '../components/complaints/WardenComplaintsToolbar';
import WardenComplaintsFilterModal from '../components/complaints/WardenComplaintsFilterModal';
import WardenComplaintDetailView from '../components/complaints/WardenComplaintDetailView';
import AssignStaffModal from '../components/complaints/AssignStaffModal';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { exportToExcel } from '@/utils/exportUtils';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ComplaintService from '@/services/complaint.service';
import ComplaintCategoryService from '@/services/complaintCategory.service';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';

export default function WardenComplaints({ hostel, onBack }) {
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
    const isAdmin = user?.role === ROLES.ADMIN;
    const isViewOnly = isSuperAdmin || isAdmin;
    const [complaints, setComplaints] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [assignStaffModalState, setAssignStaffModalState] = useState({ isOpen: false, complaint: null });

    const fetchComplaints = async () => {
        setIsLoading(true);
        try {
            const response = await ComplaintService.getAllComplaints();
            let rawData = response.data || [];
            
            const formatted = rawData.map(c => ({
                id: c._id,
                student: c.studentId?.name || 'Unknown',
                roomNo: c.roomNo || 'N/A',
                category: c.category?.name || 'Unknown',
                categoryId: c.category?._id,
                subject: c.subject,
                description: c.description,
                date: new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                createdAt: c.createdAt,
                priority: c.priority || 'Medium',
                status: c.status,
                hostelId: c.hostelId,
                hostelName: c.hostelId?.name || 'Unknown Hostel',
                assignedStaff: c.assignedStaff,
                timeline: c.timeline || [],
                materialsUsed: c.materialsUsed,
                resolutionNotes: c.resolutionNotes
            }));

            if (hostel) {
                setComplaints(formatted.filter(c => c.hostelName === hostel));
            } else {
                setComplaints(formatted);
            }
        } catch (error) {
            showErrorToast('Failed to load complaints', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
        ComplaintCategoryService.getComplaintCategories().then(res => {
            setCategories(res.data || []);
        }).catch(err => console.error("Failed to fetch categories", err));
    }, [hostel]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [roomNoFilter, setRoomNoFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [viewingComplaint, setViewingComplaint] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [confirmCategoryChange, setConfirmCategoryChange] = useState({
        isOpen: false,
        complaintId: null,
        newCategory: null,
        newCategoryId: null
    });
    const [confirmPriorityChange, setConfirmPriorityChange] = useState({
        isOpen: false,
        complaintId: null,
        newPriority: null
    });
    const [confirmStatusChange, setConfirmStatusChange] = useState({
        isOpen: false,
        complaintId: null,
        newStatus: null
    });
    const limit = 10;

    const handleCategoryChange = (id, newCategoryVal) => {
        const catObj = categories.find(c => c._id === newCategoryVal || c.name === newCategoryVal);
        setConfirmCategoryChange({ isOpen: true, complaintId: id, newCategory: catObj ? catObj.name : newCategoryVal, newCategoryId: catObj ? catObj._id : newCategoryVal });
    };

    const handlePriorityChange = (id, newPriority) => {
        setConfirmPriorityChange({ isOpen: true, complaintId: id, newPriority });
    };

    const handleStatusChange = (id, newStatus) => {
        setConfirmStatusChange({ isOpen: true, complaintId: id, newStatus });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // Reset page on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Apply filtering
    const filteredComplaints = complaints.filter(complaint => {
        const query = debouncedSearch.toLowerCase();
        const matchesSearch = Object.values(complaint).some(val => 
            String(val).toLowerCase().includes(query)
        );
        const matchesStatus = statusFilter === 'All' || complaint.status === statusFilter;
        const matchesPriority = priorityFilter === 'All' || complaint.priority === priorityFilter;
        const matchesCategory = categoryFilter === 'All' || complaint.category === categoryFilter;
        const matchesRoomNo = roomNoFilter === '' || complaint.roomNo.toLowerCase().includes(roomNoFilter.toLowerCase());
        const matchesDate = dateFilter === '' || complaint.date === dateFilter;
        
        return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesRoomNo && matchesDate;
    });

    const confirmExport = async (exportFilters) => {
        setIsExporting(true);
        try {
            let dataToExport = complaints;
            
            if (exportFilters.status) {
                dataToExport = dataToExport.filter(c => c.status === exportFilters.status);
            }

            if (exportFilters.startDate) {
                const start = new Date(exportFilters.startDate).setHours(0,0,0,0);
                dataToExport = dataToExport.filter(c => new Date(c.createdAt).setHours(0,0,0,0) >= start);
            }
            if (exportFilters.endDate) {
                const end = new Date(exportFilters.endDate).setHours(23,59,59,999);
                dataToExport = dataToExport.filter(c => new Date(c.createdAt).setHours(23,59,59,999) <= end);
            }

            if (dataToExport && dataToExport.length > 0) {
                const exportData = dataToExport.map((complaint, index) => ({
                    "SL No": index + 1,
                    "Student": complaint.student,
                    "Room No": complaint.roomNo,
                    "Category": complaint.category,
                    "Subject": complaint.subject,
                    "Priority": complaint.priority,
                    "Date": complaint.date,
                    "Status": complaint.status,
                }));

                const isSuccess = exportToExcel(exportData, "Warden_Complaints_Export", "Complaints");
                
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

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <div className="mb-6">
                {onBack && (
                    <button onClick={onBack} className="flex items-center text-sm text-text-secondary hover:text-primary mb-2 cursor-pointer transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Organizations
                    </button>
                )}
                <h1 className="text-2xl font-bold text-black">
                    {hostel ? `${hostel} Complaints` : 'Complaints'}
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                    {hostel ? `Manage and resolve student complaints in ${hostel}.` : 'Manage and resolve student complaints in your hostel.'}
                </p>
            </div>

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0 mt-2">
                {/* Toolbar Section */}
                <WardenComplaintsToolbar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    openFilterModal={() => setIsFilterModalOpen(true)}
                    initiateExport={() => setIsExportConfirmOpen(true)}
                />

                {/* Table Section */}
                <WardenComplaintsTable
                    loading={isLoading}
                    complaints={paginatedComplaints}
                    categories={categories}
                    handleCategoryChange={handleCategoryChange}
                    handlePriorityChange={handlePriorityChange}
                    handleStatusChange={handleStatusChange}
                    onViewClick={(c) => setViewingComplaint(c)}
                    isViewOnly={isViewOnly}
                />

                {/* Pagination Section */}
                <div className="flex flex-row p-3 sm:p-4 bg-white border border-gray-50 items-center justify-between text-[10px] sm:text-xs font-medium text-gray-500 rounded-b-xl shadow-sm shrink-0 mt-auto">
                    <div>
                        <span className="hidden sm:inline">Showing </span>
                        {totalComplaints === 0 ? 0 : (currentPage - 1) * limit + 1}
                        <span className="hidden sm:inline"> to </span>
                        <span className="sm:hidden">-</span>
                        {Math.min(currentPage * limit, totalComplaints)} of {totalComplaints}
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

            {isFilterModalOpen && (
                <WardenComplaintsFilterModal
                    initialRoomNo={roomNoFilter}
                    initialCategory={categoryFilter}
                    initialDate={dateFilter}
                    initialPriority={priorityFilter}
                    initialStatus={statusFilter}
                    onClose={() => setIsFilterModalOpen(false)}
                    onApply={(filters) => {
                        setRoomNoFilter(filters.roomNo);
                        setCategoryFilter(filters.category);
                        setDateFilter(filters.date);
                        setPriorityFilter(filters.priority);
                        setStatusFilter(filters.status);
                        setCurrentPage(1); // Reset to first page on filter
                        setIsFilterModalOpen(false);
                    }}
                />
            )}

            {viewingComplaint && (
                <WardenComplaintDetailView
                    complaint={viewingComplaint}
                    onClose={() => setViewingComplaint(null)}
                    onOpenAssignStaff={(complaint) => setAssignStaffModalState({ isOpen: true, complaint })}
                    onRefresh={fetchComplaints}
                />
            )}

            <AssignStaffModal
                isOpen={assignStaffModalState.isOpen}
                onClose={() => setAssignStaffModalState({ isOpen: false, complaint: null })}
                complaint={assignStaffModalState.complaint}
                onAssigned={(assignedStaff, updatedComplaintData) => {
                    setComplaints(complaints.map(c => {
                        if (c.id === assignStaffModalState.complaint.id) {
                            return {
                                ...c,
                                assignedStaff,
                                status: updatedComplaintData?.status || 'In progress',
                                timeline: updatedComplaintData?.timeline || c.timeline
                            };
                        }
                        return c;
                    }));
                    if (viewingComplaint && viewingComplaint.id === assignStaffModalState.complaint.id) {
                        setViewingComplaint({
                            ...viewingComplaint,
                            assignedStaff,
                            status: updatedComplaintData?.status || 'In progress',
                            timeline: updatedComplaintData?.timeline || viewingComplaint.timeline
                        });
                    }
                }}
            />

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Complaints Data"
                fields={[
                    { name: 'startDate', label: 'Start Date', type: 'date' },
                    { name: 'endDate', label: 'End Date', type: 'date' },
                    {
                        name: "status",
                        label: "Complaint Status",
                        options: [
                            { label: 'All Status', value: '' },
                            { label: 'Pending', value: 'Pending' },
                            { label: 'In progress', value: 'In progress' },
                            { label: 'Resolved', value: 'Resolved' },
                            { label: 'Incomplete', value: 'Incomplete' },
                        ]
                    }
                ]}
            />

            <ConfirmationModal
                isOpen={confirmCategoryChange.isOpen}
                onClose={() => setConfirmCategoryChange({ isOpen: false, complaintId: null, newCategory: null, newCategoryId: null })}
                onConfirm={async () => {
                    try {
                        await ComplaintService.updateComplaint(confirmCategoryChange.complaintId, { category: confirmCategoryChange.newCategoryId });
                        setComplaints(complaints.map(c =>
                            c.id === confirmCategoryChange.complaintId ? { ...c, category: confirmCategoryChange.newCategory, categoryId: confirmCategoryChange.newCategoryId } : c
                        ));
                        showSuccessToast('Category Updated', `Complaint category changed to ${confirmCategoryChange.newCategory}`);
                        setConfirmCategoryChange({ isOpen: false, complaintId: null, newCategory: null, newCategoryId: null });
                    } catch (error) {
                        showErrorToast('Update Failed', error.message || 'Failed to update category');
                    }
                }}
                title="Confirm Category Change"
                message={`Are you sure you want to change the category to ${confirmCategoryChange.newCategory}?`}
                confirmText="Yes, Change"
            />

            <ConfirmationModal
                isOpen={confirmPriorityChange.isOpen}
                onClose={() => setConfirmPriorityChange({ isOpen: false, complaintId: null, newPriority: null })}
                onConfirm={async () => {
                    try {
                        await ComplaintService.updateComplaint(confirmPriorityChange.complaintId, { priority: confirmPriorityChange.newPriority });
                        setComplaints(complaints.map(c =>
                            c.id === confirmPriorityChange.complaintId ? { ...c, priority: confirmPriorityChange.newPriority } : c
                        ));
                        showSuccessToast('Priority Updated', `Complaint priority changed to ${confirmPriorityChange.newPriority}`);
                        setConfirmPriorityChange({ isOpen: false, complaintId: null, newPriority: null });
                    } catch (error) {
                        showErrorToast('Update Failed', error.message || 'Failed to update priority');
                    }
                }}
                title="Confirm Priority Change"
                message={`Are you sure you want to change the priority to ${confirmPriorityChange.newPriority}?`}
                confirmText="Yes, Change"
            />

            <ConfirmationModal
                isOpen={confirmStatusChange.isOpen}
                onClose={() => setConfirmStatusChange({ isOpen: false, complaintId: null, newStatus: null })}
                onConfirm={async () => {
                    try {
                        await ComplaintService.updateComplaintStatus(confirmStatusChange.complaintId, confirmStatusChange.newStatus, `Status updated to ${confirmStatusChange.newStatus}`);
                        setComplaints(complaints.map(c =>
                            c.id === confirmStatusChange.complaintId ? { ...c, status: confirmStatusChange.newStatus } : c
                        ));
                        showSuccessToast('Status Updated', `Complaint status changed to ${confirmStatusChange.newStatus}`);
                        setConfirmStatusChange({ isOpen: false, complaintId: null, newStatus: null });
                    } catch (error) {
                        showErrorToast('Update Failed', error.message || 'Failed to update status');
                    }
                }}
                title="Confirm Status Change"
                message={`Are you sure you want to change the status to ${confirmStatusChange.newStatus}?`}
                confirmText="Yes, Change"
            />
        </div>
    );
}
