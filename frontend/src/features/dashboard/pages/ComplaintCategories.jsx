import React, { useState, useEffect } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import PageHeader from '@/components/ui/PageHeader';
import ListToolbar from '@/components/ui/ListToolbar';
import BulkActionMenu from '@/components/ui/BulkActionMenu';
import {
    Plus, Search, Download, ChevronDown, ChevronLeft, ChevronRight, Loader2, MoreVertical
} from 'lucide-react';
import ComplaintCategoryService from '../../../services/complaintCategory.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { exportToExcel } from '@/utils/exportUtils';
import ComplaintCategoryHeader from '../components/ComplaintCategory/ComplaintCategoryHeader';
import ComplaintCategoryTable from '../components/ComplaintCategory/ComplaintCategoryTable';

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
    const bulkMenuRef = useClickOutside(() => setIsBulkMenuOpen(false));
    const [isConfirming, setIsConfirming] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [limit, setLimit] = useState(10);

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
                const total = res.totalCount || 0;
                setTotalCategories(total);
                setTotalPages(res.totalPages || Math.ceil(total / limit) || 1);
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

    const handleStatusChangeClick = (id, targetStatus) => {
        setStatusToUpdate({ id, targetStatus });
        setIsStatusConfirmOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!statusToUpdate) return;
        try {
            setIsConfirming(true);
            const isTargetActive = typeof statusToUpdate.targetStatus === 'boolean'
                ? statusToUpdate.targetStatus
                : statusToUpdate.targetStatus === 'Active' || statusToUpdate.targetStatus === 'active';

            await ComplaintCategoryService.toggleStatus(statusToUpdate.id, {
                status: isTargetActive ? 'Active' : 'Inactive',
                isActive: isTargetActive
            });
            setComplaintCategories((prev) =>
                prev.map((c) =>
                    (c.id || c._id) === statusToUpdate.id ? { ...c, isActive: isTargetActive } : c
                )
            );
            fetchCategories();
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
            setEditingId(category.id || category._id);
            setFormData({
                name: category.name || '',
                description: category.description || '',
                status: category.isActive ? 'Active' : 'Inactive',
                isActive: category.isActive,
                originalIsActive: category.isActive
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                description: '',
                status: 'Active',
                isActive: true
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
                if (formData.isActive !== formData.originalIsActive) {
                    await ComplaintCategoryService.toggleStatus(editingId);
                }
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
        const currentVisibleIds = complaintCategories.map(c => c.id || c._id);
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

            // Allow export modal filter to override table filter completely
            if (exportFilters.isActive === 'true') {
                params.status = 'Active';
            } else if (exportFilters.isActive === 'false') {
                params.status = 'Inactive';
            } else {
                delete params.status;
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
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <ComplaintCategoryHeader />

                <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col mt-2">
                    <ComplaintCategoryTable
                        complaintCategories={complaintCategories}
                        loading={loading}
                        error={error}
                        searchValue={searchQuery}
                        onSearch={(val) => { setSearchQuery(val); setPage(1); }}
                        statusFilter={statusFilter}
                        onStatusFilterChange={(val) => { setStatusFilter(val); setPage(1); }}
                        onExport={initiateExport}
                        onAddClick={() => openModal('add')}
                        onActivateSelected={() => handleBulkStatusClick(true)}
                        onDeactivateSelected={() => handleBulkStatusClick(false)}
                        selectedIds={selectedIds}
                        handleSelectAll={handleSelectAll}
                        handleSelectRow={handleSelectRow}
                        setSelectedCategoryDetail={setSelectedCategoryDetail}
                        setView={setView}
                        handleStatusChangeClick={handleStatusChangeClick}
                        openModal={openModal}
                        page={page}
                        setPage={setPage}
                        limit={limit}
                        setLimit={setLimit}
                        totalPages={totalPages}
                        totalItems={totalCategories}
                    />
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
                fields={[
                    {
                        name: "isActive",
                        label: "Account Status",
                        options: [
                            { label: 'All Status', value: 'all' },
                            { label: 'Active Only', value: 'true' },
                            { label: 'Inactive Only', value: 'false' },
                        ],
                        defaultValue: statusFilter === 'Active' ? 'true' : (statusFilter === 'Inactive' ? 'false' : 'all')
                    }
                ]}
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
                            Are you sure you want to set the status of this category to <strong>{statusToUpdate?.targetStatus || 'the new status'}</strong>?
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
        </div>
    );
};

export default ComplaintCategories;
