import React, { useState, useEffect } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
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
import OrganizationHeader from '../components/organization/OrganizationHeader';
import OrganizationTable from '../components/organization/OrganizationTable';

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
    const bulkMenuRef = useClickOutside(() => setIsBulkMenuOpen(false));;
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        organisationNumber: '',
        email: '',
        phone: '',
        address: ''
    });
    const [limit, setLimit] = useState(10);

    const fetchOrganizations = async () => {
        try {
            setLoading(true);
            const res = await organizationService.getOrganizations({
                page,
                limit,
                search: searchQuery,
                status: statusFilter
            });
            if (res && res.data) {
                setOrgs(res.data);
                const total = res.totalCount || 0;
                setTotalOrgs(total);
                setTotalPages(res.totalPages || Math.ceil(total / limit) || 1);
            }
        } catch (err) {
            console.error("Failed to fetch organizations:", err);
            setError("Failed to fetch organizations. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchOrgsRef = React.useRef(fetchOrganizations);
    useEffect(() => {
        fetchOrgsRef.current = fetchOrganizations;
    });

    useEffect(() => {
        fetchOrganizations();
    }, [page, limit, searchQuery, statusFilter]);

    useEffect(() => {
        const socket = initSocket();

        const handleOrgEvent = () => {
            if (fetchOrgsRef.current) {
                fetchOrgsRef.current();
            }
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

    const handleStatusChangeClick = (id, targetStatus) => {
        setStatusToUpdate({ id, targetStatus });
        setIsStatusConfirmOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!statusToUpdate) return;
        setIsStatusUpdating(true);
        try {
            const isTargetActive = typeof statusToUpdate.targetStatus === 'boolean'
                ? statusToUpdate.targetStatus
                : statusToUpdate.targetStatus === 'Active' || statusToUpdate.targetStatus === 'active';

            await organizationService.toggleStatus(statusToUpdate.id, {
                status: isTargetActive ? 'Active' : 'Inactive',
                isActive: isTargetActive
            });
            // Re-fetch or locally update the status
            setOrgs((prevOrgs) =>
                prevOrgs.map((org) =>
                    org.id === statusToUpdate.id ? { ...org, isActive: isTargetActive } : org
                )
            );
            fetchOrganizations();
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
            setEditingId(org.id);
            setFormData({
                name: org.name || '',
                code: org.code || '',
                organisationNumber: org.organisationNumber || '',
                email: org.email || '',
                phone: org.phone || '',
                address: org.address || '',
                status: org.isActive ? 'Active' : 'Inactive',
                isActive: org.isActive,
                originalIsActive: org.isActive
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                code: '',
                organisationNumber: '',
                email: '',
                phone: '',
                address: '',
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
                if (formData.isActive !== formData.originalIsActive) {
                    await organizationService.toggleStatus(editingId);
                }
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
        // Use id
        const currentVisibleIds = (Array.isArray(mobileIds) && typeof mobileIds[0] === 'string') ? mobileIds : orgs.map(h => h.id);
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
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <OrganizationHeader />

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col">
                <OrganizationTable
                    orgs={orgs}
                    loading={loading}
                    error={error}
                    searchValue={searchQuery}
                    onSearch={(val) => { 
                        if (val !== searchQuery) {
                            setSearchQuery(val); 
                            setPage(1); 
                        }
                    }}
                    statusFilter={statusFilter}
                    onStatusFilterChange={(val) => { setStatusFilter(val); setPage(1); }}
                    onExport={initiateExport}
                    onAddClick={() => openModal('add')}
                    onActivateSelected={() => handleBulkStatusClick(true)}
                    onDeactivateSelected={() => handleBulkStatusClick(false)}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    setSelectedOrganizationDetail={setSelectedOrganizationDetail}
                    setView={setView}
                    handleStatusChangeClick={handleStatusChangeClick}
                    openModal={openModal}
                    isAdmin={isAdmin}
                    page={page}
                    setPage={setPage}
                    limit={limit}
                    setLimit={setLimit}
                    totalItems={totalOrgs}
                    totalPages={totalPages}
                />
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
                message={`Are you sure you want to change the status of this organization to ${statusToUpdate?.targetStatus || 'the new status'}?`}
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
        </div>
    );
};

export default OrganizationManagement;
