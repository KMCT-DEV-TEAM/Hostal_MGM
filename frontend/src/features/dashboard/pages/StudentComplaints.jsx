import React, { useState, useEffect } from 'react';
import StudentComplaintsTable from '../components/complaints/StudentComplaintsTable';
import StudentComplaintsHeader from '../components/complaints/StudentComplaintsHeader';
import StudentComplaintsToolbar from '../components/complaints/StudentComplaintsToolbar';
import StudentComplaintFormModal from '../components/complaints/StudentComplaintFormModal';
import StudentComplaintDetailModal from '../components/complaints/StudentComplaintDetailModal';

import ExportFilterModal from '@/components/ui/ExportFilterModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { exportToExcel } from '@/utils/exportUtils';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, Loader2, CheckCircle, Plus } from 'lucide-react';
import ComplaintService from '@/services/complaint.service';
import ComplaintCategoryService from '@/services/complaintCategory.service';
import { initSocket, getSocket } from '@/services/socket.service';
import Dropdown from '@/components/ui/Dropdown';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import StudentComplaintsDesktopView from '../views/StudentComplaintsDesktopView';
import Button from '@/components/ui/Button';
import ComplaintMobileView from '../views/ComplaintMobileView';
import ComplaintDetailsMobileView from '../views/ComplaintDetailsMobileView';
import { useParams, useNavigate } from 'react-router-dom';

export default function StudentComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [apiStats, setApiStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const { isMobile } = useBreakpoint();
    const { tab } = useParams();
    const navigate = useNavigate();

    const activeTab = tab === 'history' ? 'History' : 'My complaints';

    const handleTabChange = (newTab) => {
        if (newTab === 'History') {
            navigate('/dashboard/complaints/history');
        } else {
            navigate('/dashboard/complaints');
        }
    };

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingComplaint, setEditingComplaint] = useState(null);
    const [selectedDetailComplaint, setSelectedDetailComplaint] = useState(null);

    // Confirmation modals state
    const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);
    const [pendingFormData, setPendingFormData] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [confirmCategoryChange, setConfirmCategoryChange] = useState({
        isOpen: false,
        complaintId: null,
        newCategory: null
    });
    const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

    const fetchComplaints = async (clearData = false) => {
        try {
            if (clearData) setComplaints([]);
            setLoading(true);
            const typeParam = isMobile ? (activeTab === 'History' ? 'history' : 'current') : 'all';
            const response = await ComplaintService.getMyComplaints(typeParam);
            
            const fetchedComplaints = response.data?.complaints || response.data || [];
            if (response.data?.stats) {
                setApiStats(response.data.stats);
            }

            // Transform to UI format
            const formatted = fetchedComplaints.map(c => ({
                id: c._id,
                category: c.category?.name || 'Unknown',
                categoryId: c.category?._id,
                subject: c.subject,
                description: c.description,
                roomNo: c.roomNo,
                date: new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                createdAt: c.createdAt,
                status: c.status,
                priority: c.priority,
                hostelName: c.hostelId?.name || 'Unknown',
                timeline: c.timeline || [],
                resolutionNotes: c.resolutionNotes,
                materialsUsed: c.materialsUsed
            }));
            setComplaints(formatted);
        } catch (error) {
            showErrorToast('Failed to load complaints', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints(true);
        // Load categories for the dropdown in the table
        ComplaintCategoryService.getComplaintCategories().then(res => {
            setCategories(res.data || []);
        });

        // Socket.IO real-time updates
        const socket = initSocket();

        const handleComplaintEvent = () => {
            fetchComplaints(false);
        };

        socket.on('complaintCreated', handleComplaintEvent);
        socket.on('complaintUpdated', handleComplaintEvent);
        socket.on('complaintDeleted', handleComplaintEvent);

        return () => {
            socket.off('complaintCreated', handleComplaintEvent);
            socket.off('complaintUpdated', handleComplaintEvent);
            socket.off('complaintDeleted', handleComplaintEvent);
        };
    }, [isMobile, activeTab]);

    useEffect(() => {
        if (selectedDetailComplaint) {
            const updated = complaints.find(c => c.id === selectedDetailComplaint.id);
            if (updated) setSelectedDetailComplaint(updated);
        }
    }, [complaints]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleCategoryChange = (id, newCategory) => {
        // Find category object to get name and ID
        const catObj = categories.find(c => c._id === newCategory || c.name === newCategory);
        setConfirmCategoryChange({
            isOpen: true,
            complaintId: id,
            newCategoryName: catObj ? catObj.name : newCategory,
            newCategoryId: catObj ? catObj._id : newCategory
        });
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
        setPendingFormData(formData);
        setIsSaveConfirmOpen(true);
    };

    const confirmSaveComplaint = async () => {
        if (!pendingFormData) return;

        setIsSubmitting(true);
        try {
            if (editingComplaint) {
                await ComplaintService.updateComplaint(editingComplaint.id, pendingFormData);
                showSuccessToast('Complaint updated successfully');
                fetchComplaints();
                window.dispatchEvent(new CustomEvent('complaintsUpdated'));
            } else {
                await ComplaintService.createComplaint(pendingFormData);
                showSuccessToast('Complaint created successfully');
                fetchComplaints();
                window.dispatchEvent(new CustomEvent('complaintsUpdated'));
            }
        } catch (error) {
            showErrorToast('Failed to save complaint', error.message);
        } finally {
            setIsSubmitting(false);
            setIsSaveConfirmOpen(false);
            setIsModalOpen(false);
            setEditingComplaint(null);
            setPendingFormData(null);
        }
    };

    const confirmDiscard = () => {
        setIsDiscardConfirmOpen(false);
        setIsModalOpen(false);
        setEditingComplaint(null);
    };

    const confirmWithdraw = async () => {
        if (editingComplaint) {
            setIsSubmitting(true);
            try {
                await ComplaintService.deleteComplaint(editingComplaint.id);
                showSuccessToast('Complaint withdrawn successfully');
                fetchComplaints();
                window.dispatchEvent(new CustomEvent('complaintsUpdated'));
            } catch (error) {
                showErrorToast('Failed to withdraw complaint', error.message);
            } finally {
                setIsSubmitting(false);
                setIsWithdrawConfirmOpen(false);
                setIsModalOpen(false);
                setEditingComplaint(null);
            }
        } else {
            setIsWithdrawConfirmOpen(false);
            setIsModalOpen(false);
            setEditingComplaint(null);
        }
    };

    let filteredComplaints = complaints.filter(c => {
        if (!debouncedSearchQuery) return true;
        const query = debouncedSearchQuery.toLowerCase();

        // Check relevant string fields
        const searchableFields = [c.subject, c.category, c.description, c.roomNo, c.status, c.date];

        return searchableFields.some(val =>
            val && String(val).toLowerCase().includes(query)
        );
    });

    if (isMobile) {
        // Mobile filtering is now handled by the backend
    } else {
        if (statusFilter !== 'All') {
            filteredComplaints = filteredComplaints.filter(c => c.status === statusFilter);
        }
    }

    const totalMobileStats = apiStats || {
        total: complaints.length,
        resolved: complaints.filter(c => c.status === 'Resolved').length,
        pending: complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Rejected').length
    };

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
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">



            {/* Stat Cards Section */}


            {isMobile && selectedDetailComplaint ? (
                <ComplaintDetailsMobileView 
                    complaint={selectedDetailComplaint} 
                    onBack={() => setSelectedDetailComplaint(null)} 
                />
            ) : isMobile ? (
                <ComplaintMobileView
                    loading={loading}
                    complaints={paginatedComplaints}
                    totalMobileStats={totalMobileStats}
                    categories={categories}
                    handleCategoryChange={handleCategoryChange}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    openEditModal={handleEdit}
                    onViewDetail={(complaint) => setSelectedDetailComplaint(complaint)}
                    page={currentPage}
                    setPage={setCurrentPage}
                    limit={limit}
                    setLimit={setLimit}
                    totalPages={totalPages}
                    totalItems={totalComplaints}
                    searchValue={searchQuery}
                    onSearchChange={(e) => setSearchQuery(e.target.value)}
                    toolbarStartSlot={
                        <Dropdown
                            options={[
                                { label: 'All Status', value: 'All' },
                                { label: 'Pending', value: 'Pending' },
                                { label: 'Awaiting', value: 'Awaiting' },
                                { label: 'In progress', value: 'In progress' },
                                { label: 'Rejected', value: 'Rejected' },
                                { label: 'Incomplete', value: 'Incomplete' },
                                { label: 'Resolved', value: 'Resolved' }
                            ]}
                            value={statusFilter}
                            onChange={(val) => {
                                setStatusFilter(val);
                                setCurrentPage(1);
                            }}
                            placeholder="All"
                            minWidth="w-32"
                            triggerClassName="w-full sm:w-auto px-3 py-2 bg-white border border-gray-100 lg:border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer h-full font-medium"
                        />
                    }
                    toolbarEndSlot={
                        <button
                            onClick={handleAdd}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-xl text-sm font-medium hover:bg-[#0A437A]/90 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg> Add New
                        </button>
                    }
                />
            ) : (
                <StudentComplaintsDesktopView
                    loading={loading}
                    complaints={paginatedComplaints}
                    categories={categories}
                    handleCategoryChange={handleCategoryChange}
                    openEditModal={handleEdit}
                    onViewDetail={(complaint) => setSelectedDetailComplaint(complaint)}
                    page={currentPage}
                    setPage={setCurrentPage}
                    limit={limit}
                    setLimit={setLimit}
                    totalPages={totalPages}
                    totalItems={totalComplaints}
                    searchValue={searchQuery}
                    onSearchChange={(e) => setSearchQuery(e.target.value)}
                    toolbarStartSlot={null}
                    toolbarEndSlot={
                        <div className='flex gap-2'>
                            <Button onClick={handleAdd} size='sm' variant="primary">
                                <Plus size={16} /> Add New
                            </Button>

                        </div>
                    }
                />
            )}

            {isWithdrawConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-text-primary">Withdraw Complaint</h3>
                        <p className="text-xs text-text-secondary mt-1 mb-6">
                            Are you sure you want to withdraw this complaint? This action cannot be undone.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setIsWithdrawConfirmOpen(false)}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-70"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmWithdraw}
                                disabled={isSubmitting}
                                className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-medium bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Withdraw'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!isMobile && selectedDetailComplaint && (
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
                    { name: 'startDate', label: 'Start Date', type: 'date' },
                    { name: 'endDate', label: 'End Date', type: 'date' },
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

            {isModalOpen && (
                <StudentComplaintFormModal
                    editingComplaint={editingComplaint}
                    isSubmitting={isSubmitting}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingComplaint(null);
                    }}
                    onSave={handleSaveComplaintClick}
                    onCancel={() => setIsDiscardConfirmOpen(true)}
                    onWithdraw={() => setIsWithdrawConfirmOpen(true)}
                />
            )}

            {isSaveConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-text-primary">Save Changes</h3>
                        <p className="text-xs text-text-secondary mt-1 mb-6">
                            Are you sure you want to save these changes?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setIsSaveConfirmOpen(false)}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-70"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSaveComplaint}
                                disabled={isSubmitting}
                                className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isDiscardConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
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

            <ConfirmationModal
                isOpen={confirmCategoryChange.isOpen}
                onClose={() => setConfirmCategoryChange({ isOpen: false, complaintId: null, newCategoryName: null, newCategoryId: null })}
                onConfirm={async () => {
                    try {
                        setIsSubmittingCategory(true);
                        await ComplaintService.updateComplaint(confirmCategoryChange.complaintId, {
                            category: confirmCategoryChange.newCategoryId
                        });
                        setComplaints(complaints.map(c =>
                            c.id === confirmCategoryChange.complaintId
                                ? { ...c, category: confirmCategoryChange.newCategoryName, categoryId: confirmCategoryChange.newCategoryId }
                                : c
                        ));
                        showSuccessToast('Category Updated', `Complaint category changed to ${confirmCategoryChange.newCategoryName}`);
                    } catch (error) {
                        console.error('Failed to update category:', error);
                        showErrorToast('Error', error?.response?.data?.message || 'Failed to update category');
                    } finally {
                        setIsSubmittingCategory(false);
                        setConfirmCategoryChange({ isOpen: false, complaintId: null, newCategoryName: null, newCategoryId: null });
                    }
                }}
                title="Confirm Category Change"
                message={`Are you sure you want to change the category to ${confirmCategoryChange.newCategoryName}?`}
                confirmText="Change"
                isSubmitting={isSubmittingCategory}
                loadingText={<Loader2 size={14} className="animate-spin mx-auto" />}
                confirmButtonClass="bg-primary text-white hover:bg-secondary min-w-[100px]"
            />

        </div>
    );
}
