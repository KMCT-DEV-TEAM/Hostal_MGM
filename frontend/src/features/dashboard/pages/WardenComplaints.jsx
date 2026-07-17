import React, { useState, useEffect } from 'react';
import WardenComplaintsTable from '../components/complaints/WardenComplaintsTable';

import WardenComplaintsToolbar from '../components/complaints/WardenComplaintsToolbar';
import WardenComplaintsFilterModal from '../components/complaints/WardenComplaintsFilterModal';
import WardenComplaintDetailView from '../components/complaints/WardenComplaintDetailView';
import AssignStaffModal from '../components/complaints/AssignStaffModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import { exportToExcel } from '@/utils/exportUtils';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, Loader2, CheckCircle, LayoutGrid, List } from 'lucide-react';
import ComplaintService from '@/services/complaint.service';
import ComplaintCategoryService from '@/services/complaintCategory.service';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import { initSocket, getSocket } from '@/services/socket.service';
import BackButton from '@/components/ui/BackButton';
import PageHeader from '@/components/ui/PageHeader';

export default function WardenComplaints({ hostel, onBack }) {
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
    const isAdmin = user?.role === ROLES.ADMIN;
    const isViewOnly = isSuperAdmin || isAdmin;
    const [complaints, setComplaints] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showKPIs, setShowKPIs] = useState(false);
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
                internalNotes: c.internalNotes || [],
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

        // Socket.IO real-time updates
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
    }, [hostel]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [roomNoFilter, setRoomNoFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
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
    });
    const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
    const [isSubmittingPriority, setIsSubmittingPriority] = useState(false);
    const [limit, setLimit] = useState(10);

    useEffect(() => {
        if (viewingComplaint) {
            const updated = complaints.find(c => c.id === viewingComplaint.id);
            if (updated) setViewingComplaint(updated);
        }
    }, [complaints]);
    const handleCategoryChange = (id, newCategoryVal) => {
        const catObj = categories.find(c => c._id === newCategoryVal || c.name === newCategoryVal);
        setConfirmCategoryChange({ isOpen: true, complaintId: id, newCategory: catObj ? catObj.name : newCategoryVal, newCategoryId: catObj ? catObj._id : newCategoryVal });
    };

    const handlePriorityChange = (id, newPriority) => {
        setConfirmPriorityChange({ isOpen: true, complaintId: id, newPriority });
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

        let matchesDate = true;
        if (startDateFilter || endDateFilter) {
            const complaintDate = new Date(complaint.createdAt).setHours(0, 0, 0, 0);
            if (startDateFilter) {
                const start = new Date(startDateFilter).setHours(0, 0, 0, 0);
                if (complaintDate < start) matchesDate = false;
            }
            if (endDateFilter && matchesDate) {
                const end = new Date(endDateFilter).setHours(23, 59, 59, 999);
                if (complaintDate > end) matchesDate = false;
            }
        }

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
                const start = new Date(exportFilters.startDate).setHours(0, 0, 0, 0);
                dataToExport = dataToExport.filter(c => new Date(c.createdAt).setHours(0, 0, 0, 0) >= start);
            }
            if (exportFilters.endDate) {
                const end = new Date(exportFilters.endDate).setHours(23, 59, 59, 999);
                dataToExport = dataToExport.filter(c => new Date(c.createdAt).setHours(23, 59, 59, 999) <= end);
            }
            if (exportFilters.category) {
                dataToExport = dataToExport.filter(c => c.category === exportFilters.category);
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

    // Top cards aggregate
    const totalAll = complaints.length;
    const pendingAll = complaints.filter(c => c.status === 'Pending').length;
    const inProgressAll = complaints.filter(c => c.status === 'In progress').length;
    const resolvedAll = complaints.filter(c => c.status === 'Resolved').length;

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-6">
                <div>
                    <PageHeader
                        title="Complaints"
                        subtitle="Manage and resolve student complaints in your hostel."
                        actionButton={onBack && <BackButton text="Back to Organizations" onClick={onBack} />}
                    />
                </div>

                <div className="hidden md:flex items-center self-end sm:self-auto">
                    <button
                        onClick={() => setShowKPIs(!showKPIs)}
                        className="flex items-center gap-2 p-2 text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        {showKPIs ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Stat Cards Section */}
            {showKPIs && (
                <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full shrink-0">
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

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col mt-2">
                <WardenComplaintsTable
                    loading={isLoading}
                    complaints={paginatedComplaints}
                    categories={categories}
                    handleCategoryChange={handleCategoryChange}
                    handlePriorityChange={handlePriorityChange}
                    onViewClick={(c) => setViewingComplaint(c)}
                    isViewOnly={isViewOnly}
                    page={currentPage}
                    setPage={setCurrentPage}
                    limit={limit}
                    setLimit={setLimit}
                    totalPages={totalPages}
                    totalItems={totalComplaints}
                    searchValue={searchQuery}
                    onSearchChange={(e) => setSearchQuery(e.target.value)}
                    toolbarStartSlot={
                        <div className="flex md:hidden items-center gap-2">
                            <button
                                onClick={() => setIsFilterModalOpen(true)}
                                className="flex items-center justify-center p-2 bg-white border border-gray-100 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer shadow-sm h-full"
                                title="Filter Complaints"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sliders-horizontal"><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>
                            </button>
                            <button
                                onClick={() => setIsExportConfirmOpen(true)}
                                className="flex items-center justify-center p-2 bg-white border border-gray-100 text-[#777777] rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-sm cursor-pointer h-full whitespace-nowrap"
                                title="Export Complaints"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download text-gray-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                            </button>
                        </div>
                    }
                    toolbarEndSlot={
                        <div className="hidden md:flex items-center gap-2 h-full">
                            <button
                                onClick={() => setIsFilterModalOpen(true)}
                                className="flex items-center justify-center p-2 bg-white border border-gray-100 lg:border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer shadow-sm h-full"
                                title="Filter Complaints"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sliders-horizontal"><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>
                            </button>
                            <button
                                onClick={() => setIsExportConfirmOpen(true)}
                                className="flex items-center justify-center lg:gap-2 p-2 lg:px-4 lg:py-2 bg-white border border-gray-100 lg:border-gray-200 text-[#777777] rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-sm cursor-pointer h-full whitespace-nowrap"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download text-gray-500 lg:text-inherit"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                <span className="hidden lg:inline">Export</span>
                            </button>
                        </div>
                    }
                />
            </div>
            {isFilterModalOpen && (
                <WardenComplaintsFilterModal
                    initialRoomNo={roomNoFilter}
                    initialCategory={categoryFilter}
                    initialStartDate={startDateFilter}
                    initialEndDate={endDateFilter}
                    initialPriority={priorityFilter}
                    initialStatus={statusFilter}
                    categories={categories}
                    onClose={() => setIsFilterModalOpen(false)}
                    onApply={(filters) => {
                        setRoomNoFilter(filters.roomNo);
                        setCategoryFilter(filters.category);
                        setStartDateFilter(filters.startDate);
                        setEndDateFilter(filters.endDate);
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
                        name: "category",
                        label: "Category",
                        options: [
                            { label: 'All Categories', value: '' },
                            ...categories.map(cat => ({ label: cat.name, value: cat.name }))
                        ],
                        defaultValue: categoryFilter === 'All' ? '' : categoryFilter
                    },
                    {
                        name: "status",
                        label: "Complaint Status",
                        options: [
                            { label: 'All Status', value: '' },
                            { label: 'Pending', value: 'Pending' },
                            { label: 'Awaiting', value: 'Awaiting' },
                            { label: 'In progress', value: 'In progress' },
                            { label: 'Rejected', value: 'Rejected' },
                            { label: 'Incomplete', value: 'Incomplete' },
                            { label: 'Resolved', value: 'Resolved' }
                        ],
                        defaultValue: statusFilter === 'All' ? '' : statusFilter
                    }
                ]}
            />

            <ConfirmationModal
                isOpen={confirmCategoryChange.isOpen}
                onClose={() => setConfirmCategoryChange({ isOpen: false, complaintId: null, newCategory: null, newCategoryId: null })}
                onConfirm={async () => {
                    try {
                        setIsSubmittingCategory(true);
                        await ComplaintService.updateComplaint(confirmCategoryChange.complaintId, { category: confirmCategoryChange.newCategoryId });
                        setComplaints(complaints.map(c =>
                            c.id === confirmCategoryChange.complaintId ? { ...c, category: confirmCategoryChange.newCategory, categoryId: confirmCategoryChange.newCategoryId } : c
                        ));
                        showSuccessToast('Category Updated', `Complaint category changed to ${confirmCategoryChange.newCategory}`);
                    } catch (error) {
                        showErrorToast('Update Failed', error.message || 'Failed to update category');
                    } finally {
                        setIsSubmittingCategory(false);
                        setConfirmCategoryChange({ isOpen: false, complaintId: null, newCategory: null, newCategoryId: null });
                    }
                }}
                title="Confirm Category Change"
                message={`Are you sure you want to change the category to ${confirmCategoryChange.newCategory}?`}
                confirmText="Change"
                isSubmitting={isSubmittingCategory}
                loadingText={<Loader2 size={14} className="animate-spin mx-auto" />}
                confirmButtonClass="bg-primary text-white hover:bg-secondary min-w-[100px]"
            />

            <ConfirmationModal
                isOpen={confirmPriorityChange.isOpen}
                onClose={() => setConfirmPriorityChange({ isOpen: false, complaintId: null, newPriority: null })}
                onConfirm={async () => {
                    try {
                        setIsSubmittingPriority(true);
                        await ComplaintService.updateComplaint(confirmPriorityChange.complaintId, { priority: confirmPriorityChange.newPriority });
                        setComplaints(complaints.map(c =>
                            c.id === confirmPriorityChange.complaintId ? { ...c, priority: confirmPriorityChange.newPriority } : c
                        ));
                        showSuccessToast('Priority Updated', `Complaint priority changed to ${confirmPriorityChange.newPriority}`);
                    } catch (error) {
                        showErrorToast('Update Failed', error.message || 'Failed to update priority');
                    } finally {
                        setIsSubmittingPriority(false);
                        setConfirmPriorityChange({ isOpen: false, complaintId: null, newPriority: null });
                    }
                }}
                title="Confirm Priority Change"
                message={`Are you sure you want to change the priority to ${confirmPriorityChange.newPriority}?`}
                confirmText="Change"
                isSubmitting={isSubmittingPriority}
                loadingText={<Loader2 size={14} className="animate-spin mx-auto" />}
                confirmButtonClass="bg-primary text-white hover:bg-secondary min-w-[100px]"
            />
            </div>
        </div>
    );
}
