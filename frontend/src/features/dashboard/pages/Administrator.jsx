import ConfirmationModal from '@/components/ui/ConfirmationModal';
import ListToolbar from '@/components/ui/ListToolbar';
import BulkActionMenu from '@/components/ui/BulkActionMenu';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import {
    Square,
    CheckSquare,
    Pencil,
    Trash2,
    Plus,
    Search,
    SlidersHorizontal,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    X,
    Phone,
    Download,
    User,
    ArrowLeft,
    Check,
    Loader2,
    MoreVertical
} from 'lucide-react';

import AdminsTable from '../components/admin/AdminsTable';
import AdminsHeader from '../components/admin/AdminsHeader';
import AdminFormModal from '../components/admin/AdminFormModal';
import AdminDetailView from '../components/admin/AdminDetailView';
import Dropdown from '@/components/ui/Dropdown';
import ExportFilterModal from '@/components/ui/ExportFilterModal';

const INITIAL_ADMINS = [
    { id: 1, name: 'Jacob Tarakan', email: 'anilkumar@gmail.com', phone: '9987898789', hostel: 'Kmct Hostel 1', status: 'Active' },
    { id: 2, name: 'Jacob Tarakan', email: 'anilkumar@gmail.com', phone: '9987898789', hostel: 'Kmct Hostel 2', status: 'Inactive' },
    { id: 3, name: 'Anil kumar', email: 'anilkumar@gmail.com', phone: '9987898789', hostel: 'Kmct Hostel 3', status: 'Active' },
    { id: 4, name: 'Jacob Tarakan', email: 'anilkumar@gmail.com', phone: '9987898789', hostel: 'Kmct Hostel 4', status: 'Inactive' },
    { id: 5, name: 'Anil kumar', email: 'anilkumar@gmail.com', phone: '9987898789', hostel: 'Kmct Hostel 5', status: 'Active' },
    { id: 6, name: 'Jacob Tarakan', email: 'anilkumar@gmail.com', phone: '9987898789', hostel: 'Kmct Hostel 6', status: 'Active' },
    { id: 7, name: 'Anil kumar', email: 'anilkumar@gmail.com', phone: '9987898789', hostel: 'Kmct Hostel 7', status: 'Inactive' },
    { id: 8, name: 'Jacob Tarakan', email: 'anilkumar@gmail.com', phone: '9987898789', hostel: 'Kmct Hostel 8', status: 'Active' },
    { id: 9, name: 'Anil kumar', email: 'anilkumar@gmail.com', phone: '9987898789', hostel: 'Kmct Hostel 9', status: 'Active' },
    { id: 10, name: 'Jacob Tarakan', email: 'anilkumar@gmail.com', phone: '9987898789', hostel: 'Kmct Hostel 10', status: 'Active' },
];



import adminService from '../../../services/admin.service';
import organizationService from '../../../services/organization.service';
import otpService from '../../../services/otp.service';
import { exportToExcel } from '@/utils/exportUtils';
import authService from '../../../services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import { initSocket } from '@/services/socket.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

export default function Administrator() {
    const [activeModal, setActiveModal] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [view, setView] = useState('list');
    const [selectedAdminDetail, setSelectedAdminDetail] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isAddConfirmOpen, setIsAddConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isBulkStatusConfirmOpen, setIsBulkStatusConfirmOpen] = useState(false);
    const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState(null);
    const [isOrgConfirmOpen, setIsOrgConfirmOpen] = useState(false);
    const [orgChangeToConfirm, setOrgChangeToConfirm] = useState(null);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);
    const [isBulkStatusUpdating, setIsBulkStatusUpdating] = useState(false);
    const [isOrgUpdating, setIsOrgUpdating] = useState(false);
    const [isEmailUpdating, setIsEmailUpdating] = useState(false);
    const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false)
    const bulkMenuRef = useClickOutside(() => setIsBulkMenuOpen(false));

    // Email Change Flow State
    const [isEmailChangeModalOpen, setIsEmailChangeModalOpen] = useState(false);
    const [emailChangeForm, setEmailChangeForm] = useState('');
    const [newEmailForm, setNewEmailForm] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [emailChangeAdminId, setEmailChangeAdminId] = useState(null);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [otpSource, setOtpSource] = useState(null);
    const [isEmailChangeSuccessModalOpen, setIsEmailChangeSuccessModalOpen] = useState(false);
    const [resendTimer, setResendTimer] = useState(300);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

    const [admins, setAdmins] = useState([]);
    const [totalAdmins, setTotalAdmins] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [organizations, setOrganizations] = useState([]);

    // Pagination State
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);


    // Form State for Adding / Editing Admin
    const [adminForm, setAdminForm] = useState({
        name: '',
        email: '',
        phone: '',
        hostel: 'Kmct Hostel 1',
        status: 'Active'
    });

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const res = await adminService.getAdmins({
                page: currentPage,
                limit: limit,
                search: debouncedSearch,
                status: statusFilter
            });
            console.log('[Administrator] getAdmins response:', res);
            
            // Handle both { data: [...] } and { admins: [...] } or direct array
            const adminList = res?.data?.data || res?.data || res?.admins || [];
            const total = res?.data?.totalCount || res?.totalCount || 0;
            const totalPgs = res?.data?.totalPages || res?.totalPages || Math.ceil(total / limit) || 1;
            
            if (adminList) {
                setAdmins(Array.isArray(adminList) ? adminList : []);
                setTotalAdmins(total);
                setTotalPages(totalPgs);
            }
        } catch (err) {
            console.error("Failed to fetch admins:", err);
            setError("Failed to fetch admins. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const res = await organizationService.getOrganizations({ limit: 100, status: 'All' });
                if (res && res.data) {
                    const orgList = res.data.data || res.data || [];
                    setOrganizations(Array.isArray(orgList) ? orgList : []);
                }
            } catch (err) {
                console.error("Failed to fetch organizations:", err);
            }
        };
        fetchOrganizations();
    }, []);

    useEffect(() => {
        let interval = null;
        if (isOtpModalOpen && isTimerActive && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        } else if (resendTimer === 0) {
            setIsTimerActive(false);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isOtpModalOpen, isTimerActive, resendTimer]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    useEffect(() => {
        fetchAdmins();
    }, [currentPage, limit, debouncedSearch, statusFilter]);

    useEffect(() => {
        const socket = initSocket();

        const handleAdminEvent = (data) => {
            if (!data?.role || data?.role?.toLowerCase() === 'admin' || data?.bulk) {
                fetchAdmins();
            }
        };

        socket.on('userCreated', handleAdminEvent);
        socket.on('userUpdated', handleAdminEvent);
        socket.on('userDeleted', handleAdminEvent);

        return () => {
            socket.off('userCreated', handleAdminEvent);
            socket.off('userUpdated', handleAdminEvent);
            socket.off('userDeleted', handleAdminEvent);
        };
    }, [currentPage]);

    // ==========================================
    // SELECTION & ACTION HANDLERS
    // ==========================================
    const handleSelectAll = (mobileIds) => {
        const currentVisibleIds = (Array.isArray(mobileIds) && typeof mobileIds[0] === 'string') ? mobileIds : admins.map(w => w.id);
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

    const handleDeleteAdmin = (id) => {
        if (window.confirm("Are you sure you want to delete this admin?")) {
            setAdmins(admins.filter(w => w.id !== id));
            setSelectedIds(selectedIds.filter(item => item !== id));
        }
    };

    const handleDeleteSelected = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} admin(s)?`)) {
            setAdmins(admins.filter(w => !selectedIds.includes(w.id)));
            setSelectedIds([]);
            setCurrentPage(1);
        }
    };

    const handleStatusChangeClick = (id, currentStatus) => {
        setStatusToUpdate({ id, currentStatus });
        setIsStatusConfirmOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!statusToUpdate) return;
        setIsStatusUpdating(true);
        try {
            const res = await adminService.toggleStatus(statusToUpdate.id);
            if (res && (res.data || res.success)) {
                const newIsActive = statusToUpdate.currentStatus !== 'Active';
                setAdmins(admins.map(w => w.id === statusToUpdate.id ? { ...w, isActive: newIsActive } : w));
                fetchAdmins();
                showSuccessToast('Status Updated', res?.message || `Administrator status changed to ${newIsActive ? 'Active' : 'Inactive'}`);
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to change administrator status');
        } finally {
            setIsStatusUpdating(false);
            setIsStatusConfirmOpen(false);
            setStatusToUpdate(null);
        }
    };

    const openChangeEmailModal = (admin) => {
        setEmailChangeAdminId(admin.id);
        setEmailChangeForm(admin.email || '');
        setNewEmailForm('');
        setPasswordConfirm('');
        setIsEmailVerified(false);
        setIsEmailChangeModalOpen(true);
    };

    const confirmEmailChange = async (e) => {
        e.preventDefault();
        if (!emailChangeAdminId || !newEmailForm || !passwordConfirm) return;
        setIsEmailUpdating(true);
        try {
            await adminService.updateEmail(emailChangeAdminId, {
                oldEmail: emailChangeForm,
                newEmail: newEmailForm,
                password: passwordConfirm
            });

            setAdmins(admins.map(a => a.id === emailChangeAdminId ? { ...a, email: newEmailForm } : a));
            fetchAdmins();

            if (selectedAdminDetail && selectedAdminDetail.id === emailChangeAdminId) {
                setSelectedAdminDetail({ ...selectedAdminDetail, email: newEmailForm });
            }

            setIsEmailChangeModalOpen(false);
            setIsEmailChangeSuccessModalOpen(true);
            showSuccessToast('Email Updated', 'Administrator email updated successfully');
            setTimeout(() => {
                setIsEmailChangeSuccessModalOpen(false);
                setEmailChangeAdminId(null);
                setNewEmailForm('');
            }, 2500);
        } catch (error) {
            showErrorToast('Error', error?.message || 'Failed to update email');
        } finally {
            setIsEmailUpdating(false);
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
            const res = await adminService.bulkToggleStatus({
                ids: selectedIds,
                isActive: bulkStatusToUpdate
            });
            if (res && res.success) {
                // Optimistically update local state
                setAdmins(admins.map(admin =>
                    selectedIds.includes(admin.id) ? { ...admin, isActive: bulkStatusToUpdate } : admin
                ));
                fetchAdmins();
                const action = bulkStatusToUpdate ? 'Activated' : 'Deactivated';
                showSuccessToast('Bulk Status Updated', res?.message || `Successfully ${action.toLowerCase()} ${selectedIds.length} administrators`);
            }
        } catch (error) {
            console.error("Failed to update bulk status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to update bulk status');
        } finally {
            setIsBulkStatusUpdating(false);
            setSelectedIds([]);
            setIsBulkStatusConfirmOpen(false);
            setBulkStatusToUpdate(null);
        }
    };

    const handleOrganizationChange = (id, organizationId) => {
        setOrgChangeToConfirm({ id, organizationId });
        setIsOrgConfirmOpen(true);
    };

    const confirmOrganizationChange = async () => {
        if (!orgChangeToConfirm) return;
        const { id, organizationId } = orgChangeToConfirm;
        setIsOrgUpdating(true);
        try {
            const res = await adminService.updateOrganization(id, { organizationId });
            if (res && (res.data || res.success)) {
                const newOrg = organizations.find(o => o.id === organizationId);
                setAdmins(admins.map(admin =>
                    admin.id === id ? { ...admin, organization: newOrg ? newOrg : { id: organizationId } } : admin
                ));
                fetchAdmins();
                showSuccessToast('Organization Assigned', res?.message || 'Administrator organization updated successfully');
            }
        } catch (err) {
            console.error("Failed to update organization:", err);
            showErrorToast('Action Failed', err?.message || 'Failed to update organization');
        } finally {
            setIsOrgUpdating(false);
            setIsOrgConfirmOpen(false);
            setOrgChangeToConfirm(null);
        }
    };

    // ==========================================
    // MODAL OPEN / SUBMIT HANDLERS
    // ==========================================
    const openAddAdminModal = () => {
        setEditingAdmin(null);
        setAdminForm({ name: '', email: '', phone: '', organization: organizations[0]?.id || '', status: 'Active' });
        setIsEmailVerified(false);
        setActiveModal('admin');
    };

    const openEditAdminModal = (admin) => {
        setEditingAdmin(admin);
        setAdminForm({ ...admin, organization: admin.organization?.id || admin.organization });
        setIsEmailVerified(true);
        setActiveModal('admin');
    };

    const handleSaveAdmin = (e) => {
        e.preventDefault();
        if (!adminForm.name || !adminForm.email || !adminForm.phone || (!editingAdmin && !adminForm.organization)) {
            showErrorToast('Validation Error', 'Please fill in all required fields');
            return;
        }

        if (adminForm.phone.length !== 10) {
            showErrorToast('Validation Error', 'Phone number must be exactly 10 digits');
            return;
        }

        if (!isEmailVerified && !editingAdmin) {
            showErrorToast('Validation Error', 'Please verify your email before saving');
            return;
        }

        if (editingAdmin) {
            setIsEditConfirmOpen(true);
        } else {
            setIsAddConfirmOpen(true);
        }
    };

    const handleVerifyClick = async (email, source = 'addAdmin') => {
        if (!email) {
            showErrorToast('Validation Error', 'Please enter an email first');
            return;
        }
        setIsVerifying(true);
        try {
            await otpService.sendOtp(email);
            setOtpSource(source);
            setOtpCode(['', '', '', '', '', '']);
            setResendTimer(300);
            setIsTimerActive(true);
            setIsOtpModalOpen(true);
            if (source === 'emailChange') {
                setIsEmailChangeModalOpen(false);
            }
        } catch (error) {
            showErrorToast('Error', error?.message || 'Failed to send OTP');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        setIsVerifying(true);
        const emailToVerify = otpSource === 'emailChange' ? newEmailForm : adminForm.email;
        try {
            await otpService.sendOtp(emailToVerify);
            setResendTimer(300);
            setIsTimerActive(true);
            showSuccessToast('Success', 'OTP resent successfully!');
        } catch (error) {
            showErrorToast('Error', error?.message || 'Failed to resend OTP');
        } finally {
            setIsVerifying(false);
        }
    };

    const saveAdmin = async () => {
        setIsSubmitting(true);
        if (editingAdmin) {
            try {
                // Update Existing Record via API
                const res = await adminService.updateAdmin(editingAdmin.id, {
                    name: adminForm.name,
                    phone: adminForm.phone
                });

                let updatedAdmin = { ...res.data };

                // Check if Organization changed
                const oldOrgId = editingAdmin.organization?.id || editingAdmin.organization;
                if (adminForm.organization !== oldOrgId) {
                    await adminService.updateOrganization(editingAdmin.id, { organizationId: adminForm.organization });
                    const newOrg = organizations.find(o => o.id === adminForm.organization);
                    updatedAdmin.organization = newOrg ? newOrg : { _id: adminForm.organization };
                }

                // Check if Status changed
                if (adminForm.isActive !== editingAdmin.isActive) {
                    await adminService.bulkToggleStatus({ ids: [editingAdmin.id], isActive: adminForm.isActive });
                    updatedAdmin.isActive = adminForm.isActive;
                }

                if (res && (res.data || res.success)) {
                    setAdmins(admins.map(w => w.id === editingAdmin.id ? { ...w, ...updatedAdmin } : w));
                    fetchAdmins();
                    showSuccessToast('Administrator Updated', res?.message || 'Administrator details saved successfully');
                }
            } catch (error) {
                console.error("Failed to update admin:", error);
                showErrorToast('Action Failed', error?.message || 'Failed to update administrator details');
                setIsEditConfirmOpen(false);
                setIsSubmitting(false);
                return;
            }
        } else {
            // Create New Record via API
            try {
                const res = await adminService.createAdmin({
                    name: adminForm.name,
                    email: adminForm.email,
                    phone: adminForm.phone,
                    organizationId: adminForm.organization
                });
                if (res && res.success) {
                    const newAdmin = res.data;
                    if (newAdmin) {
                        // Optimistically populate organization details for the table
                        const org = organizations.find(o => o.id === adminForm.organization);
                        const populatedAdmin = { ...newAdmin, organization: org || { _id: adminForm.organization } };
                        setAdmins(prev => [populatedAdmin, ...prev]);
                    }
                    setCurrentPage(1);
                    fetchAdmins(); // re-fetch to ensure pagination is consistent and fields are populated
                    showSuccessToast('Administrator Added', res?.message || 'New administrator registered successfully');
                }
            } catch (error) {
                console.error("Failed to create admin:", error);
                showErrorToast('Action Failed', error?.message || 'Failed to register new administrator');
                setIsEditConfirmOpen(false);
                setIsSubmitting(false);
                return;
            }
        }
        setActiveModal(null);
        setIsEditConfirmOpen(false);
        setIsAddConfirmOpen(false);
        setIsSubmitting(false);
    };

    const handleCancel = () => {
        setIsDiscardConfirmOpen(true);
    };

    const confirmDiscard = () => {
        setIsDiscardConfirmOpen(false);
        setActiveModal(null);
    };

    const initiateExport = () => {
        setIsExportConfirmOpen(true);
    };

    const confirmExport = async (exportFilters) => {
        setIsExporting(true);
        try {
            // Construct API parameters
            const params = { limit: 100000 };
            if (searchQuery) params.search = searchQuery;

            // Allow export modal filter to override table filter completely
            if (exportFilters.isActive === 'true') {
                params.status = 'Active';
            } else if (exportFilters.isActive === 'false') {
                params.status = 'Inactive';
            } else {
                delete params.status;
            }

            const res = await adminService.getAdmins(params);

            // Handle different possible response structures
            const responseData = res?.data || res;
            const allAdmins = responseData?.data || responseData || [];

            if (!allAdmins || allAdmins.length === 0) {
                showErrorToast('Export failed', 'No administrators match the selected filters');
                setIsExportConfirmOpen(false);
                return;
            }

            const exportData = allAdmins.map((admin, index) => ({
                "SL No": index + 1,
                "Name": admin.name || 'N/A',
                "Email": admin.email || 'N/A',
                "Phone": admin.phone || 'N/A',
                "Organization": admin.organization?.name || admin.organization || 'N/A',
                "Status": admin.isActive ? 'Active' : 'Inactive'
            }));

            const isSuccess = exportToExcel(exportData, "Admins_Export", "Admins");

            if (isSuccess) {
                showSuccessToast('Export Successful', 'Administrator list downloaded');
            } else {
                showErrorToast('Export Failed', 'Could not generate the Excel file');
            }
        } catch (error) {
            console.error("Export Failed", error);
            showErrorToast('Export Failed', error?.message || 'Failed to export administrators');
        } finally {
            setIsExportConfirmOpen(false);
            setIsExporting(false);
        }
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">

            <AdminsHeader />

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col">
                <AdminsTable
                    admins={admins}
                    organizations={organizations}
                    loading={loading}
                    error={error}
                    canCreate={true}
                    canEdit={true}
                    canDelete={true}
                    searchValue={searchQuery}
                    onSearch={(val) => { setSearchQuery(val); setCurrentPage(1); }}
                    statusFilter={statusFilter}
                    onStatusFilterChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                    onExport={initiateExport}
                    onAddClick={openAddAdminModal}
                    onActivateSelected={() => handleBulkStatusClick(true)}
                    onDeactivateSelected={() => handleBulkStatusClick(false)}
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    onSelectRow={handleSelectRow}
                    onViewClick={(admin) => { setSelectedAdminDetail(admin); setView('detail'); }}
                    onEditClick={openEditAdminModal}
                    onStatusChangeClick={(id, status) => handleStatusChangeClick(id, status)}
                    onOrganizationChange={handleOrganizationChange}
                    page={currentPage}
                    setPage={setCurrentPage}
                    limit={limit}
                    setLimit={setLimit}
                    totalItems={totalAdmins}
                    totalPages={totalPages}
                />
            </div>

            {/* ==========================================
    MODAL 1: ADMINS (ADD & EDIT WORKFLOWS)
    ========================================== */}

            {activeModal === 'admin' && (
                <AdminFormModal
                    activeModal={activeModal}
                    setActiveModal={setActiveModal}
                    editingAdmin={editingAdmin}
                    adminForm={adminForm}
                    setAdminForm={setAdminForm}
                    handleSaveAdmin={handleSaveAdmin}
                    handleCancel={handleCancel}
                    organizations={organizations.filter(org => org.isActive)}
                    isEmailVerified={isEmailVerified}
                    handleVerifyClick={handleVerifyClick}
                    isSubmitting={isSubmitting}
                    isVerifying={isVerifying}
                />
            )}

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
                                onClick={saveAdmin}
                                disabled={isSubmitting}
                                className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
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

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Admins Data"
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
                message="Are you sure you want to change the status of this admin?"
            />


            {isBulkStatusConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Change Status</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to set the status of {selectedIds.length} admin(s) to <strong>{bulkStatusToUpdate ? 'Active' : 'Inactive'}</strong>?
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
                                disabled={isBulkStatusUpdating}
                                className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isBulkStatusUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'detail' && (
                <AdminDetailView
                    selectedAdminDetail={selectedAdminDetail}
                    setView={setView}
                    openChangeEmailModal={openChangeEmailModal}
                />
            )}

            {/* ==========================================
             EMAIL CHANGE MODALS
             ========================================== */}
            {isEmailChangeModalOpen && (
                <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-end md:items-center justify-center p-0 md:p-4">
                    <form onSubmit={confirmEmailChange} className="bg-white rounded-t-2xl md:rounded-2xl rounded-b-none shadow-2xl w-full max-w-md p-6 sm:p-8 relative animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <button
                            type="button"
                            onClick={() => setIsEmailChangeModalOpen(false)}
                            className="absolute top-6 right-6 p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-[#0A437A]">Change Email</h3>
                        <p className="text-sm text-gray-400 mt-1 mb-6">
                            Change the email of {admins.find(w => w.id === emailChangeAdminId)?.name || 'the administrator'}
                        </p>

                        <hr className="border-gray-200 mb-6" />

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-[#222222] mb-2">Current Email <span className="text-red-500">*</span></label>
                            <input
                                type="email"
                                value={emailChangeForm}
                                onChange={(e) => setEmailChangeForm(e.target.value)}
                                required
                                placeholder="Enter your current email"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0A437A]"
                            />
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-[#222222] mb-2">New Email <span className="text-red-500">*</span></label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="email"
                                    required
                                    value={newEmailForm}
                                    onChange={(e) => setNewEmailForm(e.target.value)}
                                    placeholder="Enter your new email"
                                    className="flex-1 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0A437A] disabled:opacity-60 disabled:bg-gray-50"
                                    disabled={isEmailVerified}
                                />
                                {isEmailVerified ? (
                                    <button type="button" className="w-full sm:w-auto px-6 py-2.5 bg-green-50 text-success border border-green-200 text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 cursor-default">
                                        <Check size={16} /> Verified
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleVerifyClick(newEmailForm, 'emailChange')}
                                        disabled={isVerifying}
                                        className="w-full sm:w-auto flex items-center justify-center min-w-[80px] px-6 py-2.5 bg-[#0A437A] text-white text-sm font-medium rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {isEmailVerified && (
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-[#222222] mb-2">Your Password <span className="text-red-500">*</span></label>
                                <input
                                    type="password"
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    required
                                    placeholder="Enter your password to confirm"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0A437A]"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!isEmailVerified || !passwordConfirm || isEmailUpdating}
                            className={`w-full py-3 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${isEmailVerified && passwordConfirm && !isEmailUpdating ? 'bg-[#0A437A] hover:bg-secondary' : 'bg-[#94A3B8] cursor-not-allowed'}`}
                        >
                            {isEmailUpdating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Change Email'}
                        </button>
                    </form>
                </div>
            )}

            {isOtpModalOpen && (
                <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-end md:items-center justify-center p-0 md:p-4">
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const code = otpCode.join('');
                        if (code.length < 6) return;

                        setIsVerifyingOtp(true);
                        try {
                            const emailToVerify = otpSource === 'emailChange' ? newEmailForm : adminForm.email;
                            await otpService.verifyOtp(emailToVerify, code);

                            setIsOtpModalOpen(false);
                            setIsEmailVerified(true);
                            if (otpSource === 'emailChange') {
                                setIsEmailChangeModalOpen(true);
                            } else {
                                showSuccessToast('Success', 'Email verified successfully!');
                            }
                        } catch (err) {
                            showErrorToast('Error', err?.message || 'Invalid OTP');
                        } finally {
                            setIsVerifyingOtp(false);
                        }
                    }} className="bg-white rounded-t-2xl md:rounded-2xl rounded-b-none shadow-2xl w-full max-w-md p-6 sm:p-8 relative animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200 text-center">
                        <div className="flex justify-between items-center mb-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOtpModalOpen(false);
                                    if (otpSource === 'emailChange') {
                                        setIsEmailChangeModalOpen(true);
                                    }
                                }}
                                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                <ArrowLeft size={24} strokeWidth={1.5} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOtpModalOpen(false)}
                                className="p-1.5 rounded-md border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <h3 className="text-[32px] font-bold text-[#0A437A] mb-4">Enter the code</h3>
                        <p className="text-gray-500 mb-3 text-[15px]">
                            A 6-digit code was send to <span className="text-[#0A437A]">{otpSource === 'emailChange' ? newEmailForm : adminForm.email || '@usergmail.com'}</span>
                        </p>

                        <div className="flex justify-center gap-2 sm:gap-3 mb-8">
                            {otpCode.map((digit, idx) => (
                                <input
                                    key={idx}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => {
                                        const newOtp = [...otpCode];
                                        newOtp[idx] = e.target.value;
                                        setOtpCode(newOtp);
                                        if (e.target.value && e.target.nextSibling) {
                                            e.target.nextSibling.focus();
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Backspace' && !digit && e.target.previousSibling) {
                                            e.target.previousSibling.focus();
                                        }
                                    }}
                                    className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border focus:outline-none transition-colors 
                                        ${digit ? 'border-[#0A437A] text-[#0A437A]' : 'border-gray-300 text-[#0A437A] focus:border-[#0A437A]'}`}
                                />
                            ))}
                        </div>

                        <p className="text-[14px] text-gray-400 mb-8 font-medium">
                            Didn't receive it ? {resendTimer > 0 ? (
                                <span className="text-gray-500 font-semibold ml-1">Resend in {formatTime(resendTimer)}</span>
                            ) : (
                                <button type="button" onClick={handleResendOtp} disabled={isVerifying} className="text-[#0A437A] cursor-pointer hover:underline font-semibold ml-1 disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed">
                                    {isVerifying ? 'Sending...' : 'Resend the code'}
                                </button>
                            )}
                        </p>

                        <button
                            type="submit"
                            disabled={isVerifyingOtp}
                            className="w-full py-3.5 bg-[#0A437A] text-white font-medium rounded-lg hover:bg-secondary transition-colors flex items-center justify-center gap-2 cursor-pointer text-lg disabled:opacity-70"
                        >
                            {isVerifyingOtp ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Verify'}
                        </button>
                    </form>
                </div>
            )}

            {isEmailChangeSuccessModalOpen && (
                <div className="fixed top-0 right-0 z-[60] animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className="bg-white m-4 p-4 rounded-xl shadow-2xl border border-gray-100 flex items-center gap-3 min-w-[300px]">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                            <CheckSquare className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900">Email Updated</h4>
                            <p className="text-xs text-gray-500">The email address has been successfully updated.</p>
                        </div>
                        <button
                            onClick={() => setIsEmailChangeSuccessModalOpen(false)}
                            className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}
            {/* Confirm Organization Change Modal */}
            {isOrgConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Change Organization?</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to change the organization for this administrator?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setIsOrgConfirmOpen(false);
                                    setOrgChangeToConfirm(null);
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmOrganizationChange}
                                disabled={isOrgUpdating}
                                className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isOrgUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Add Admin Modal */}
            {isAddConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Add Administrator</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to add this new administrator?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setIsAddConfirmOpen(false)}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-70"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveAdmin}
                                disabled={isSubmitting}
                                className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}

