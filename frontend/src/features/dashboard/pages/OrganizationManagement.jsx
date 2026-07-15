import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import ListToolbar from '@/components/ui/ListToolbar';
import BulkActionMenu from '@/components/ui/BulkActionMenu';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import {
    Square, Pencil, Trash2, Plus, Search,
    Download, Mail, Phone, MapPin,
    ChevronDown, Loader2, X,
    CheckSquare,
    Building2,
    ChevronLeft,
    ChevronRight,
    MoreVertical
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { exportToExcel } from '@/utils/exportUtils';
import organizationService from '../../../services/organization.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import { initSocket } from '@/services/socket.service';
import OrganizationTable from '../components/organization/OrganizationTable';
import OrganizationMobileList from '../components/organization/OrganizationMobileList';
import OrganizationDetailView from '../components/organization/OrganizationDetailView';
import OrganizationFormModal from '../components/organization/OrganizationFormModal';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import Dropdown from '@/components/ui/Dropdown';
import { useTranslation } from '@/hooks/useTranslation';

const INITIAL_ORGS = [
    { id: 1, name: 'Jacob Tarakan', email: 'anilkumar@gmail.com', phone: '9987898789', address: 'Abc street, Sarojini nagar', status: 'Active' },
    // ... add more as needed
];

const OrganizationManagement = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const isAdmin = user?.role === ROLES.ADMIN;
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalOrgs, setTotalOrgs] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [view, setView] = useState('list'); // 'list' or 'detail'
    const [selectedOrganizationDetail, setSelectedOrganizationDetail] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isAddConfirmOpen, setIsAddConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState(null);
    const [isBulkStatusConfirmOpen, setIsBulkStatusConfirmOpen] = useState(false);
    const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState(null);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);
    const [isBulkStatusUpdating, setIsBulkStatusUpdating] = useState(false);
    const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        organisationNumber: '',
        email: '',
        phone: '',
        address: ''
    });
    const limit = 10;

    const fetchOrganizations = async () => {
        try {
            setLoading(true);
            const res = await organizationService.getOrganizations({
                page,
                limit,
                search: debouncedSearch,
                status: statusFilter
            });
            if (res && res.data) {
                setOrgs(res.data);
                setTotalOrgs(res.totalCount || 0);
                setTotalPages(res.totalPages || 1);
            }
        } catch (err) {
            console.error("Failed to fetch organizations:", err);
            setError("Failed to fetch organizations. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchOrganizations();
    }, [page, debouncedSearch, statusFilter]);

    useEffect(() => {
        const socket = initSocket();

        const handleOrgEvent = () => {
            fetchOrganizations();
        };

        socket.on('organizationCreated', handleOrgEvent);
        socket.on('organizationUpdated', handleOrgEvent);
        socket.on('organizationDeleted', handleOrgEvent);

        return () => {
            socket.off('organizationCreated', handleOrgEvent);
            socket.off('organizationUpdated', handleOrgEvent);
            socket.off('organizationDeleted', handleOrgEvent);
        };
    }, []);

    const handleStatusChangeClick = (id, currentStatus) => {
        setStatusToUpdate({ id, currentStatus });
        setIsStatusConfirmOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!statusToUpdate) return;
        setIsStatusUpdating(true);
        try {
            await organizationService.toggleStatus(statusToUpdate.id);
            // Re-fetch or locally update the status
            setOrgs((prevOrgs) =>
                prevOrgs.map((org) =>
                    org._id === statusToUpdate.id ? { ...org, isActive: !org.isActive } : org
                )
            );
            setIsStatusConfirmOpen(false);
            setStatusToUpdate(null);
            showSuccessToast('Status Updated', 'Organization status changed successfully');
        } catch (err) {
            console.error("Failed to toggle status:", err);
            showErrorToast('Action Failed', err?.message || 'Failed to update status. Please try again.');
        } finally {
            setIsStatusUpdating(false);
        }
    };

    const openModal = (mode, org = null) => {
        setIsEditMode(mode === 'edit');
        if (mode === 'edit' && org) {
            setEditingId(org._id);
            setFormData({
                name: org.name || '',
                code: org.code || '',
                organisationNumber: org.organisationNumber || '',
                email: org.email || '',
                phone: org.phone || '',
                address: org.address || ''
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                code: '',
                organisationNumber: '',
                email: '',
                phone: '',
                address: ''
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
        if (isEditMode) {
            setIsEditConfirmOpen(true);
        } else {
            setIsAddConfirmOpen(true);
        }
    };

    const saveOrganization = async () => {
        try {
            setIsSubmitting(true);
            if (isEditMode && editingId) {
                await organizationService.updateOrganization(editingId, formData);
                showSuccessToast('Organization Updated', 'Organization details saved successfully');
            } else {
                await organizationService.createOrganization(formData);
                showSuccessToast('Organization Added', 'New organization registered successfully');
            }
            setIsModalOpen(false);
            setIsEditConfirmOpen(false);
            setIsAddConfirmOpen(false);
            fetchOrganizations(); // Refresh list after saving
        } catch (err) {
            console.error("Failed to save organization:", err);
            showErrorToast('Action Failed', err?.message || 'Failed to save organization. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsDiscardConfirmOpen(true);
    };

    const confirmDiscard = () => {
        setIsDiscardConfirmOpen(false);
        setIsModalOpen(false);
    };

    const handleSelectAll = (mobileIds) => {
        // Use _id instead of id
        const currentVisibleIds = (Array.isArray(mobileIds) && typeof mobileIds[0] === 'string') ? mobileIds : orgs.map(h => h._id);
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
        setIsBulkStatusUpdating(true);
        try {
            await organizationService.bulkToggleStatus({ ids: selectedIds, isActive: bulkStatusToUpdate });
            const action = bulkStatusToUpdate ? 'Activated' : 'Deactivated';
            showSuccessToast('Bulk Status Updated', `Successfully ${action.toLowerCase()} ${selectedIds.length} organizations`);
            setSelectedIds([]); // clear selection
            setIsBulkStatusConfirmOpen(false);
            setBulkStatusToUpdate(null);
            fetchOrganizations(); // refresh table
        } catch (error) {
            console.error("Failed to bulk update status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to bulk update status. Please try again.');
        } finally {
            setIsBulkStatusUpdating(false);
        }
    };

    // Step 1: Trigger the dialog
    const initiateExport = () => {
        setIsExportConfirmOpen(true);
    };

    // Step 2: The actual export logic
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

            // Fetch organizations
            const res = await organizationService.getOrganizations(params);

            const responseData = res?.data || res;
            const allOrgs = responseData?.data || responseData || [];

            if (allOrgs && allOrgs.length > 0) {
                const exportData = allOrgs.map((org, index) => ({
                    "S.No": index + 1,
                    "Organization Name": org.name,
                    "Code": org.code,
                    "Registration Number": org.organisationNumber,
                    "Email": org.email,
                    "Phone": org.phone || 'N/A',
                    "Address": org.address || 'N/A',
                    "Status": org.isActive ? "Active" : "Inactive",
                    "Created At": new Date(org.createdAt).toLocaleDateString()
                }));

                const isSuccess = exportToExcel(exportData, "Organizations_Export", "Organizations");

                if (isSuccess) {
                    showSuccessToast('Export Successful', 'The organization list has been downloaded.');
                } else {
                    showErrorToast('Export Failed', 'Could not generate the Excel file.');
                }
            } else {
                showErrorToast('Export Failed', 'No data available to export matching the filters.');
            }
        } catch (err) {
            console.error("Failed to export organizations:", err);
            showErrorToast('Export Failed', err?.message || 'Failed to export organizations. Please try again.');
        } finally {
            setIsExportConfirmOpen(false);
            setIsExporting(false);
        }
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-2 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('org_management')}</h1>
                    <p className="text-[10px] sm:text-xs text-[#777777] mt-0.5 sm:mt-1">Manage all organizations</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                </div>
            </div>

            {/* Filter and Action Bar */}
            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm  flex-1 flex flex-col min-h-0">
                <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
                    <div className="w-full sm:w-auto flex gap-2 flex-1 sm:max-w-xs">
                        <div className="relative w-full">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none placeholder-gray-400 cursor-pointer"
                                placeholder="Search Organization..."
                            />
                        </div>
                        {!isAdmin && (
                            <button
                                onClick={() => openModal('add')}
                                className="flex sm:hidden items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm hover:bg-secondary transition-colors shrink-0 shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4" /> Add
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end">
                        <div className="flex gap-3 w-full sm:w-auto">
                            {!isAdmin && (
                                <Dropdown
                                    className="flex-1 sm:flex-none"
                                    options={[
                                        { label: 'All Status', value: 'All' },
                                        { label: 'Active', value: 'Active' },
                                        { label: 'Inactive', value: 'Inactive' }
                                    ]}
                                    value={statusFilter}
                                    onChange={(val) => setStatusFilter(val)}
                                    placeholder="All Status"
                                    minWidth="w-32"
                                    triggerClassName="w-full appearance-none bg-white border border-gray-100 md:border-gray-200 rounded-lg px-3 py-2 text-sm text-[#777777] font-medium shadow-sm md:shadow-none focus:border-[#0A437A] cursor-pointer"
                                />
                            )}

                            {!isAdmin && (
                                <button
                                    onClick={initiateExport}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                                >
                                    <Download className="w-4 h-4" /> Export
                                </button>
                            )}

                            {!isAdmin && (
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
                            )}
                        </div>
                        {!isAdmin && (
                            <button
                                onClick={() => openModal('add')}
                                className="hidden sm:flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm hover:bg-secondary transition-colors w-full sm:w-auto shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4" /> Add New
                            </button>
                        )}
                    </div>
                </div>

                <OrganizationTable
                    orgs={orgs}
                    loading={loading}
                    error={error}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    setSelectedOrganizationDetail={setSelectedOrganizationDetail}
                    setView={setView}
                    handleStatusChangeClick={handleStatusChangeClick}
                    openModal={openModal}
                    isAdmin={isAdmin}
                />

                <OrganizationMobileList
                    currentPage={page}
                    totalPages={totalPages}
                    hasMore={page < totalPages}
                    onLoadMore={() => setPage(prev => prev + 1)}
                    orgs={orgs}
                    loading={loading}
                    error={error}
                    openModal={openModal}
                    setSelectedOrganizationDetail={setSelectedOrganizationDetail}
                    setView={setView}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    handleStatusChangeClick={handleStatusChangeClick}
                    isAdmin={isAdmin}
                />

                {/* PAGINATION BAR FOOTER */}
                <div className="hidden md:flex flex-row p-3 sm:p-4 bg-white border border-gray-50 items-center justify-between text-[10px] sm:text-xs font-medium text-gray-500 rounded-b-xl shadow-sm shrink-0 mt-auto">
                    <div>
                        <span className="hidden sm:inline">Showing </span>
                        {totalOrgs === 0 ? 0 : (page - 1) * limit + 1}
                        <span className="hidden sm:inline"> to </span>
                        <span className="sm:hidden">-</span>
                        {Math.min(page * limit, totalOrgs)} of {totalOrgs}
                        <span className="hidden sm:inline"> entries</span>
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

            <OrganizationFormModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                isEditMode={isEditMode}
                formData={formData}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                handleCancel={handleCancel}
                isSubmitting={isSubmitting}
            />

            {isEditConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Save Changes</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to save these changes?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setIsEditConfirmOpen(false)}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveOrganization}
                                disabled={isSubmitting}
                                className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <ConfirmationModal
                isOpen={isDiscardConfirmOpen}
                onClose={() => setIsDiscardConfirmOpen(false)}
                onConfirm={confirmDiscard}
                title="Discard Changes"
                message="Are you sure you want to discard your changes? Any unsaved edits will be lost."
                confirmText="Discard"
                confirmButtonClass="bg-danger hover:bg-danger/90"
                cancelText="Continue Editing"
            />


            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Organizations Data"
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


            <ConfirmationModal
                isOpen={isStatusConfirmOpen}
                onClose={() => {
                    setIsStatusConfirmOpen(false);
                    setStatusToUpdate(null);
                }}
                onConfirm={confirmStatusChange}
                isSubmitting={isStatusUpdating}
                title="Change Status"
                message="Are you sure you want to change the status of this organization?"
            />



            <ConfirmationModal
                isOpen={isBulkStatusConfirmOpen}
                onClose={() => {
                    setIsBulkStatusConfirmOpen(false);
                    setBulkStatusToUpdate(null);
                }}
                onConfirm={confirmBulkStatusChange}
                isSubmitting={isBulkStatusUpdating}
                title="Change Status (Bulk)"
                message={`Are you sure you want to set the status of ${selectedIds.length} organization(s) to ${bulkStatusToUpdate ? 'Active' : 'Inactive'}?`}
            />

            {view === 'detail' && (
                <OrganizationDetailView
                    selectedOrganizationDetail={selectedOrganizationDetail}
                    setView={setView}
                />
            )}

            <ConfirmationModal
                isOpen={isAddConfirmOpen}
                onClose={() => setIsAddConfirmOpen(false)}
                onConfirm={saveOrganization}
                isSubmitting={isSubmitting}
                title="Add Organization"
                message="Are you sure you want to add this new organization?"
            />

        </div>
    );
};

export default OrganizationManagement;
