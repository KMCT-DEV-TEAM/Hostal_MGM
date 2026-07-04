import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Download, ChevronDown, ChevronLeft, ChevronRight, Loader2, MoreVertical
} from 'lucide-react';
import ComplaintCategoryService from '../../../services/complaintCategory.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { exportToExcel } from '@/utils/exportUtils';
import ComplaintCategoryTable from '../components/ComplaintCategory/ComplaintCategoryTable';
import ComplaintCategoryMobileList from '../components/ComplaintCategory/ComplaintCategoryMobileList';
import ComplaintCategoryDetailView from '../components/ComplaintCategory/ComplaintCategoryDetailView';
import ComplaintCategoryFormModal from '../components/ComplaintCategory/ComplaintCategoryFormModal';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import Dropdown from '@/components/ui/Dropdown';

const ComplaintCategories = () => {
    const [complaintCategories, setComplaintCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalCategories, setTotalCategories] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [view, setView] = useState('list');
    const [selectedCategoryDetail, setSelectedCategoryDetail] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState(null);
    const [isBulkStatusConfirmOpen, setIsBulkStatusConfirmOpen] = useState(false);
    const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState(null);
    const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const limit = 10;

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await ComplaintCategoryService.getComplaintCategories({
                page,
                limit,
                search: debouncedSearch,
                status: statusFilter
            });
            if (res && res.data) {
                setComplaintCategories(res.data);
                setTotalCategories(res.totalCount || 0);
                setTotalPages(res.totalPages || 1);
            }
        } catch (err) {
            console.error("Failed to fetch complaint categories:", err);
            setError("Failed to fetch categories. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchCategories();
    }, [page, debouncedSearch, statusFilter]);

    const handleStatusChangeClick = (id, currentStatus) => {
        setStatusToUpdate({ id, currentStatus });
        setIsStatusConfirmOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!statusToUpdate) return;
        try {
            setIsConfirming(true);
            await ComplaintCategoryService.toggleStatus(statusToUpdate.id);
            setComplaintCategories((prev) =>
                prev.map((c) =>
                    c._id === statusToUpdate.id ? { ...c, isActive: !c.isActive } : c
                )
            );
            setIsStatusConfirmOpen(false);
            setStatusToUpdate(null);
            showSuccessToast('Status Updated', 'Category status changed successfully');
        } catch (err) {
            console.error("Failed to toggle status:", err);
            showErrorToast('Action Failed', err?.message || 'Failed to update status. Please try again.');
        } finally {
            setIsConfirming(false);
        }
    };

    const openModal = (mode, category = null) => {
        setIsEditMode(mode === 'edit');
        if (mode === 'edit' && category) {
            setEditingId(category._id);
            setFormData({
                name: category.name || '',
                description: category.description || ''
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsEditConfirmOpen(true);
    };

    const saveCategory = async () => {
        try {
            setIsSubmitting(true);
            if (isEditMode && editingId) {
                await ComplaintCategoryService.updateComplaintCategory(editingId, formData);
                showSuccessToast('Category Updated', 'Category details saved successfully');
            } else {
                await ComplaintCategoryService.createComplaintCategory(formData);
                showSuccessToast('Category Added', 'New category created successfully');
            }
            setIsModalOpen(false);
            setIsEditConfirmOpen(false);
            fetchCategories();
        } catch (err) {
            console.error("Failed to save category:", err);
            showErrorToast('Action Failed', err?.response?.data?.message || err?.message || 'Failed to save category. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isEditMode || formData.name.trim() !== '' || formData.description.trim() !== '') {
            setIsDiscardConfirmOpen(true);
        } else {
            setIsModalOpen(false);
        }
    };

    const confirmDiscard = () => {
        setIsDiscardConfirmOpen(false);
        setIsModalOpen(false);
    };

    const handleSelectAll = () => {
        const currentVisibleIds = complaintCategories.map(c => c._id);
        const allSelected = currentVisibleIds.every(id => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds(selectedIds.filter(id => !currentVisibleIds.includes(id)));
        } else {
            setSelectedIds([...new Set([...selectedIds, ...currentVisibleIds])]);
        }
    };

    const handleSelectRow = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkStatusClick = (isActive) => {
        setBulkStatusToUpdate(isActive);
        setIsBulkStatusConfirmOpen(true);
    };

    const confirmBulkStatusChange = async () => {
        if (selectedIds.length === 0 || bulkStatusToUpdate === null) return;
        try {
            setIsConfirming(true);
            await ComplaintCategoryService.bulkToggleStatus({ ids: selectedIds, isActive: bulkStatusToUpdate });
            const action = bulkStatusToUpdate ? 'Activated' : 'Deactivated';
            showSuccessToast('Bulk Status Updated', `Successfully ${action.toLowerCase()} ${selectedIds.length} categories`);
            setSelectedIds([]);
            setIsBulkStatusConfirmOpen(false);
            setBulkStatusToUpdate(null);
            fetchCategories();
        } catch (error) {
            console.error("Failed to bulk update status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to bulk update status. Please try again.');
        } finally {
            setIsConfirming(false);
        }
    };

    const initiateExport = () => {
        setIsExportConfirmOpen(true);
    };

    const confirmExport = async (exportFilters) => {
        setIsExporting(true);
        try {
            const params = { page: 1, limit: 100000 };
            if (debouncedSearch) params.search = debouncedSearch;

            if (exportFilters.isActive !== '') {
                params.status = exportFilters.isActive === 'true' ? 'Active' : 'Inactive';
            } else if (statusFilter !== 'All') {
                params.status = statusFilter;
            }

            const res = await ComplaintCategoryService.getComplaintCategories(params);

            const responseData = res?.data || res;
            const allCategories = responseData?.data || responseData || [];

            if (allCategories && allCategories.length > 0) {
                const exportData = allCategories.map((c, index) => ({
                    "S.No": index + 1,
                    "Category Name": c.name,
                    "Description": c.description,
                    "Status": c.isActive ? "Active" : "Inactive",
                    "Created At": new Date(c.createdAt).toLocaleDateString()
                }));

                const isSuccess = exportToExcel(exportData, "ComplaintCategories_Export", "Complaint Categories");

                if (isSuccess) {
                    showSuccessToast('Export Successful', 'The list has been downloaded.');
                } else {
                    showErrorToast('Export Failed', 'Could not generate the Excel file.');
                }
            } else {
                showErrorToast('Export Failed', 'No data available to export matching the filters.');
            }
        } catch (err) {
            console.error("Failed to export categories:", err);
            showErrorToast('Export Failed', err?.message || 'Failed to export categories. Please try again.');
        } finally {
            setIsExportConfirmOpen(false);
            setIsExporting(false);
        }
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-2 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Complaint Categories</h1>
                    <p className="text-[10px] sm:text-xs text-[#777777] mt-0.5 sm:mt-1">Manage all complaint categories</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                </div>
            </div>

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm  flex-1 flex flex-col min-h-0">
                <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
                    <div className="w-full sm:w-auto flex gap-2 flex-1 sm:max-w-xs">
                        <div className="relative w-full">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search Categories..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none placeholder-gray-400 cursor-pointer"
                            />
                        </div>
                        <button onClick={() => openModal('add')} className="flex sm:hidden items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm hover:bg-secondary transition-colors shrink-0 shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"><Plus className="w-4 h-4" /> Add</button>

                        </div>

                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end">
                        <div className="flex gap-3 w-full sm:w-auto">
                            <Dropdown
                                className="flex-1 sm:flex-none"
                                options={[
                                    { label: 'All Status', value: 'All' },
                                    { label: 'Active', value: 'Active' },
                                    { label: 'Inactive', value: 'Inactive' }
                                ]}
                                value={statusFilter}
                                onChange={(val) => {
                                    setStatusFilter(val);
                                    setPage(1);
                                }}
                                placeholder="Select Status"
                                minWidth="w-32"
                                triggerClassName="w-full px-3 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm text-[#777777] font-medium shadow-sm md:shadow-none focus:border-[#0A437A] cursor-pointer"
                            />

                            <button
                                onClick={initiateExport}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                            >
                                <Download className="w-4 h-4" /> Export
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setIsBulkMenuOpen(!isBulkMenuOpen)}
                                    className="flex items-center justify-center p-2 bg-white border border-gray-200 rounded-lg text-[#777777] hover:bg-gray-50 transition-colors shadow-sm md:shadow-none cursor-pointer"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                                {isBulkMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-[100] py-1 overflow-hidden">
                                        <button
                                            onClick={() => { setIsBulkMenuOpen(false); handleBulkStatusClick(true); }}
                                            disabled={selectedIds.length === 0}
                                            className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            Active {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                                        </button>
                                        <button
                                            onClick={() => { setIsBulkMenuOpen(false); handleBulkStatusClick(false); }}
                                            disabled={selectedIds.length === 0}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            Inactive {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => openModal('add')}
                            className="hidden sm:flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm hover:bg-secondary transition-colors w-full sm:w-auto shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Add New
                        </button>
                    </div>
                </div>

                <ComplaintCategoryTable
                    complaintCategories={complaintCategories}
                    loading={loading}
                    error={error}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    setSelectedCategoryDetail={setSelectedCategoryDetail}
                    setView={setView}
                    handleStatusChangeClick={handleStatusChangeClick}
                    openModal={openModal}
                />

                <ComplaintCategoryMobileList
                    complaintCategories={complaintCategories}
                    loading={loading}
                    error={error}
                    openModal={openModal}
                    setSelectedCategoryDetail={setSelectedCategoryDetail}
                    setView={setView}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    handleStatusChangeClick={handleStatusChangeClick}
                />

                <div className="flex flex-row p-3 sm:p-4 bg-white border border-gray-50 items-center justify-between text-[10px] sm:text-xs font-medium text-gray-500 rounded-b-xl shadow-sm shrink-0 mt-auto">
                    <div className="hidden sm:block">
                        Showing {totalCategories === 0 ? 0 : (page - 1) * limit + 1} to{" "}
                        {Math.min(page * limit, totalCategories)} of {totalCategories} entries
                    </div>
                    <div className="sm:hidden">
                        {totalCategories === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, totalCategories)} of {totalCategories}
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {(() => {
                            let startPage = Math.max(1, page - 1);
                            let endPage = Math.min(totalPages, page + 1);

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
                                    onClick={() => setPage(pageNum)}
                                    className={`w-7 h-7 rounded flex items-center justify-center transition-all ${page === pageNum
                                        ? 'bg-[#0A437A] text-white shadow-sm font-bold'
                                        : 'border border-transparent text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            ));
                        })()}

                        <button
                            disabled={page === totalPages || totalPages === 0}
                            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <ComplaintCategoryFormModal
                isModalOpen={isModalOpen}
                isEditMode={isEditMode}
                formData={formData}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                handleCancel={handleCancel}
                isSubmitting={isSubmitting}
            />

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Categories Data"
            />

            {isEditConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">{isEditMode ? 'Save Changes' : 'Add Category'}</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            {isEditMode ? 'Are you sure you want to save these changes?' : 'Are you sure you want to add this new category?'}
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setIsEditConfirmOpen(false)}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveCategory}
                                disabled={isSubmitting}
                                className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isDiscardConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Discard Changes</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to discard your changes? Any unsaved edits will be lost.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setIsDiscardConfirmOpen(false)}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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

            {isStatusConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Change Status</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to change the status of this category?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setIsStatusConfirmOpen(false);
                                    setStatusToUpdate(null);
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmStatusChange}
                                disabled={isConfirming}
                                className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isConfirming ? <Loader2 size={14} className="animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isBulkStatusConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-gray-900"> Change Status</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to change the status for the {selectedIds.length} selected categor{selectedIds.length === 1 ? 'y' : 'ies'}?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setIsBulkStatusConfirmOpen(false);
                                    setBulkStatusToUpdate(null);
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmBulkStatusChange}
                                disabled={isConfirming}
                                className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isConfirming ? <Loader2 size={14} className="animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {view === 'detail' && (
                <ComplaintCategoryDetailView
                    selectedCategoryDetail={selectedCategoryDetail}
                    setView={setView}
                />
            )}
        </div>
    );
};

export default ComplaintCategories;


