import React, { useState, useMemo, useEffect } from 'react';
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
    Check
} from 'lucide-react';

import AdminTable from '../components/admin/AdminTable';
import AdminMobileList from '../components/admin/AdminMobileList';
import AdminFormModal from '../components/admin/AdminFormModal';
import AdminDetailView from '../components/admin/AdminDetailView';
import Dropdown from '@/components/ui/Dropdown';

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
import * as XLSX from 'xlsx';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

export default function Administrator() {
    const [activeModal, setActiveModal] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [view, setView] = useState('list');
    const [selectedAdminDetail, setSelectedAdminDetail] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState(null);
    const [isBulkStatusConfirmOpen, setIsBulkStatusConfirmOpen] = useState(false);
    const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState(null);
    const [isOrgConfirmOpen, setIsOrgConfirmOpen] = useState(false);
    const [orgChangeToConfirm, setOrgChangeToConfirm] = useState(null);

    // Email Change Flow State
    const [isEmailChangeModalOpen, setIsEmailChangeModalOpen] = useState(false);
    const [emailChangeForm, setEmailChangeForm] = useState('');
    const [newEmailForm, setNewEmailForm] = useState('');
    const [emailChangeAdminId, setEmailChangeAdminId] = useState(null);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [otpSource, setOtpSource] = useState(null);
    const [isEmailChangeSuccessModalOpen, setIsEmailChangeSuccessModalOpen] = useState(false);
    const [resendTimer, setResendTimer] = useState(300);
    const [isTimerActive, setIsTimerActive] = useState(false);

    const [admins, setAdmins] = useState([]);
    const [totalAdmins, setTotalAdmins] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [organizations, setOrganizations] = useState([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                limit: itemsPerPage,
                search: debouncedSearch,
                status: statusFilter
            });
            if (res && res.data) {
                // Backend might wrap data in { data: [...], totalCount: ... } inside res.data
                const dataPayload = res.data;
                const adminList = dataPayload.data || dataPayload;
                setAdmins(Array.isArray(adminList) ? adminList : []);
                setTotalAdmins(dataPayload.totalCount || res.totalCount || 0);
                setTotalPages(dataPayload.totalPages || res.totalPages || 1);
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
                const res = await organizationService.getOrganizations({ limit: 100, status: 'Active' });
                if (res && res.data) {
                    setOrganizations(res.data);
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
    }, [currentPage, debouncedSearch, statusFilter]);

    // ==========================================
    // SELECTION & ACTION HANDLERS
    // ==========================================
    const handleSelectAll = () => {
        const currentVisibleIds = admins.map(w => w._id);
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
        try {
            const res = await adminService.toggleStatus(statusToUpdate.id);
            if (res && res.data) {
                const newIsActive = statusToUpdate.currentStatus !== 'Active';
                setAdmins(admins.map(w => w._id === statusToUpdate.id ? { ...w, isActive: newIsActive } : w));
                showSuccessToast('Status Updated', res?.message || `Administrator status changed to ${newIsActive ? 'Active' : 'Inactive'}`);
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to change administrator status');
        }
        setIsStatusConfirmOpen(false);
        setStatusToUpdate(null);
    };

    const openChangeEmailModal = (admin) => {
        setEmailChangeAdminId(admin._id);
        setEmailChangeForm(admin.email || '');
        setNewEmailForm('');
        setIsEmailVerified(false);
        setIsEmailChangeModalOpen(true);
    };

    const confirmEmailChange = async (e) => {
        e.preventDefault();
        try {
            await adminService.updateEmail(emailChangeAdminId, {
                oldEmail: emailChangeForm,
                newEmail: newEmailForm
            });

            setAdmins(admins.map(a => a._id === emailChangeAdminId ? { ...a, email: newEmailForm } : a));

            if (selectedAdminDetail && selectedAdminDetail._id === emailChangeAdminId) {
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
        }
    };

    const handleBulkStatusClick = (isActive) => {
        setBulkStatusToUpdate(isActive);
        setIsBulkStatusConfirmOpen(true);
    };

    const confirmBulkStatusChange = async () => {
        if (selectedIds.length === 0 || bulkStatusToUpdate === null) return;
        try {
            const res = await adminService.bulkToggleStatus({
                ids: selectedIds,
                isActive: bulkStatusToUpdate
            });
            if (res && res.success) {
                // Optimistically update local state
                setAdmins(admins.map(admin =>
                    selectedIds.includes(admin._id) ? { ...admin, isActive: bulkStatusToUpdate } : admin
                ));
                const action = bulkStatusToUpdate ? 'Activated' : 'Deactivated';
                showSuccessToast('Bulk Status Updated', res?.message || `Successfully ${action.toLowerCase()} ${selectedIds.length} administrators`);
            }
        } catch (error) {
            console.error("Failed to update bulk status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to update bulk status');
        }
        setSelectedIds([]);
        setIsBulkStatusConfirmOpen(false);
        setBulkStatusToUpdate(null);
    };

    const handleOrganizationChange = (id, organizationId) => {
        setOrgChangeToConfirm({ id, organizationId });
        setIsOrgConfirmOpen(true);
    };

    const confirmOrganizationChange = async () => {
        if (!orgChangeToConfirm) return;
        const { id, organizationId } = orgChangeToConfirm;
        try {
            const res = await adminService.updateOrganization(id, { organizationId });
            if (res && res.data) {
                const newOrg = organizations.find(o => o._id === organizationId);
                setAdmins(admins.map(admin =>
                    admin._id === id ? { ...admin, organization: newOrg ? newOrg : { _id: organizationId } } : admin
                ));
                showSuccessToast('Organization Assigned', res?.message || 'Administrator organization updated successfully');
            }
        } catch (err) {
            console.error("Failed to update organization:", err);
            showErrorToast('Action Failed', err?.message || 'Failed to update organization');
        } finally {
            setIsOrgConfirmOpen(false);
            setOrgChangeToConfirm(null);
        }
    };

    // ==========================================
    // MODAL OPEN / SUBMIT HANDLERS
    // ==========================================
    const openAddAdminModal = () => {
        setEditingAdmin(null);
        setAdminForm({ name: '', email: '', phone: '', organization: organizations[0]?._id || '', status: 'Active' });
        setIsEmailVerified(false);
        setActiveModal('admin');
    };

    const openEditAdminModal = (admin) => {
        setEditingAdmin(admin);
        setAdminForm({ ...admin, organization: admin.organization?._id || admin.organization });
        setIsEmailVerified(true);
        setActiveModal('admin');
    };

    const handleSaveAdmin = (e) => {
        e.preventDefault();
        if (!adminForm.name || !adminForm.email || !adminForm.phone || (!editingAdmin && !adminForm.organization)) {
            showErrorToast('Validation Error', 'Please fill in all required fields');
            return;
        }

        if (!isEmailVerified && !editingAdmin) {
            showErrorToast('Validation Error', 'Please verify your email before saving');
            return;
        }

        if (editingAdmin) {
            setIsEditConfirmOpen(true);
        } else {
            saveAdmin();
        }
    };

    const handleVerifyClick = async (email, source = 'addAdmin') => {
        if (!email) {
            showErrorToast('Validation Error', 'Please enter an email first');
            return;
        }
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
        }
    };

    const handleResendOtp = async () => {
        const emailToVerify = otpSource === 'emailChange' ? newEmailForm : adminForm.email;
        try {
            await otpService.sendOtp(emailToVerify);
            setResendTimer(300);
            setIsTimerActive(true);
            showSuccessToast('Success', 'OTP resent successfully!');
        } catch (error) {
            showErrorToast('Error', error?.message || 'Failed to resend OTP');
        }
    };

    const saveAdmin = async () => {
        if (editingAdmin) {
            try {
                // Update Existing Record via API
                const res = await adminService.updateAdmin(editingAdmin._id, {
                    name: adminForm.name,
                    phone: adminForm.phone
                });
                if (res && res.data) {
                    setAdmins(admins.map(w => w._id === editingAdmin._id ? { ...w, ...res.data } : w));
                    showSuccessToast('Administrator Updated', res?.message || 'Administrator details saved successfully');
                }
            } catch (error) {
                console.error("Failed to update admin:", error);
                showErrorToast('Action Failed', error?.message || 'Failed to update administrator details');
                setIsEditConfirmOpen(false);
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
                        const org = organizations.find(o => o._id === adminForm.organization);
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
                return;
            }
        }
        setActiveModal(null);
        setIsEditConfirmOpen(false);
    };

    const handleCancel = () => {
        if (editingAdmin) {
            setIsDiscardConfirmOpen(true);
        } else {
            setActiveModal(null);
        }
    };

    const confirmDiscard = () => {
        setIsDiscardConfirmOpen(false);
        setActiveModal(null);
    };

    const initiateExport = () => {
        setIsExportConfirmOpen(true);
    };

    const handleExport = async () => {
        try {
            // Fetch all admins for export by setting a large limit
            const res = await adminService.getAdmins({ limit: 100000 });
            if (res && res.data) {
                const allAdmins = res.data;
                const exportData = allAdmins.map(admin => ({
                    Name: admin.name,
                    Email: admin.email,
                    Phone: admin.phone || 'N/A',
                    Organization: admin.organization?.name || admin.organization || 'N/A',
                    Status: admin.isActive ? 'Active' : 'Inactive'
                }));
                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Admins");
                XLSX.writeFile(wb, "Admins_List.xlsx");
                showSuccessToast('Export Successful', res?.message || 'Administrator list downloaded');
            }
        } catch (error) {
            console.error("Export Failed", error);
            showErrorToast('Export Failed', error?.message || 'Failed to export administrators');
        } finally {
            setIsExportConfirmOpen(false);
        }
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">

            {/* ==========================================
             HEADER ACTION SECTION
             ========================================== */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admins</h1>
                    <p className="text-xs text-[#777777] mt-1">Manage all registered hostel administrators</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 mr-2">
                            <button
                                onClick={() => handleBulkStatusClick(true)}
                                className="px-3 py-2 bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                            >
                                Active ({selectedIds.length})
                            </button>
                            <button
                                onClick={() => handleBulkStatusClick(false)}
                                className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                            >
                                Inactive ({selectedIds.length})
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ==========================================
                TOOLBAR SECTION
             ========================================== */}
            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm  flex-1 flex flex-col min-h-0">
                <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
                    <div className="w-full sm:w-auto flex flex-col gap-2 flex-1 sm:max-w-xs">
                        <div className="relative w-full">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search Admins..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none placeholder-gray-400 cursor-pointer"
                            />
                        </div>
                        <div className="flex justify-center sm:hidden -mt-1 -mb-2">
                            <button 
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer focus:outline-none"
                            >
                                <ChevronDown className={`w-5 h-5 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <div className={`flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end ${isMobileMenuOpen ? 'flex' : 'hidden sm:flex'}`}>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <Dropdown
                                className="flex-1 sm:flex-none"
                                options={[
                                    { value: "All", label: "All Status" },
                                    { value: "Active", label: "Active" },
                                    { value: "Inactive", label: "Inactive" }
                                ]}
                                value={statusFilter}
                                onChange={(val) => {
                                    setStatusFilter(val);
                                    setCurrentPage(1);
                                }}
                                placeholder="All Status"
                                minWidth="w-32"
                                triggerClassName="w-full px-3 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm text-[#777777] font-medium shadow-sm md:shadow-none focus:border-[#0A437A] cursor-pointer"
                            />

                            <button
                                onClick={initiateExport}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                            >
                                <Download className="w-4 h-4" /> Export
                            </button>
                        </div>
                        <button
                            onClick={openAddAdminModal}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm hover:bg-[#083663] transition-colors w-full sm:w-auto shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Add New
                        </button>
                    </div>
                </div>

                {/* ==========================================
                DATA TABLE LAYOUT
                ========================================== */}

                <AdminTable
                    paginatedAdmins={admins}
                    organizations={organizations}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    setSelectedAdminDetail={setSelectedAdminDetail}
                    setView={setView}
                    handleOrganizationChange={handleOrganizationChange}
                    handleStatusChangeClick={handleStatusChangeClick}
                    handleDeleteAdmin={handleDeleteAdmin}
                    openEditAdminModal={openEditAdminModal}
                    loading={loading}
                    error={error}
                />

                <AdminMobileList
                    paginatedAdmins={admins}
                    organizations={organizations}
                    openEditAdminModal={openEditAdminModal}
                    setSelectedAdminDetail={setSelectedAdminDetail}
                    setView={setView}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    handleOrganizationChange={handleOrganizationChange}
                    loading={loading}
                    error={error}
                />

                {/* ==========================================
                PAGINATION BAR FOOTER
                ========================================== */}
                <div className="flex flex-col sm:flex-row p-4 bg-white border border-gray-50 items-center justify-between text-xs font-medium text-gray-500 rounded-b-xl shadow-sm shrink-0 gap-3 sm:gap-0 mt-auto">
                    <div>
                        Showing {totalAdmins === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalAdmins)} of {totalAdmins} entries
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {Array.from({ length: totalPages }, (_, index) => {
                            const pageNum = index + 1;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-7 h-7 rounded flex items-center justify-center transition-all ${currentPage === pageNum
                                        ? 'bg-[#0A437A] text-white shadow-sm font-bold'
                                        : 'border border-transparent text-gray-600 hover:bg-gray-50'
                                        } cursor-pointer`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
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
                    organizations={organizations}
                    isEmailVerified={isEmailVerified}
                    handleVerifyClick={handleVerifyClick}
                />
            )}

            {isEditConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
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
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-[#083663] transition-colors cursor-pointer"
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
                                className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isExportConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Confirm Export</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to download the admin list?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setIsExportConfirmOpen(false)}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExport}
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-[#083663] transition-colors cursor-pointer"
                            >
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isStatusConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Change Status</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to change the status of this admin?
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
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-[#083663] transition-colors cursor-pointer"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isBulkStatusConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-bold text-gray-900"> Change Status</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to change the status for the {selectedIds.length} selected admin(s)?
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
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-[#083663] transition-colors cursor-pointer"
                            >
                                Confirm
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
                <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <form onSubmit={confirmEmailChange} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200">
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
                            Change the email of {admins.find(w => w._id === emailChangeAdminId)?.name || 'the administrator'}
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
                            <div className="flex gap-3">
                                <input
                                    type="email"
                                    required

                                    value={newEmailForm}
                                    onChange={(e) => setNewEmailForm(e.target.value)}
                                    placeholder="Enter your new email"
                                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0A437A] disabled:opacity-60 disabled:bg-gray-50"
                                    disabled={isEmailVerified}

                                />
                                {isEmailVerified ? (
                                    <button type="button" className="px-6 py-2.5 bg-green-50 text-success border border-green-200 text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-default">
                                        <Check size={16} /> Verified
                                    </button>
                                ) : (
                                    <button type="button" onClick={() => handleVerifyClick(newEmailForm, 'emailChange')} className="px-6 py-2.5 bg-[#0A437A] text-white text-sm font-medium rounded-lg hover:bg-[#083663] transition-colors cursor-pointer">
                                        Verify
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!isEmailVerified}
                            className={`w-full py-3 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer ${isEmailVerified ? 'bg-[#0A437A] hover:bg-[#083663]' : 'bg-[#94A3B8] cursor-not-allowed'}`}
                        >
                            Change Email
                        </button>
                    </form>
                </div>
            )}

            {isOtpModalOpen && (
                <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const code = otpCode.join('');
                        if (code.length < 6) return;
                        
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
                        } catch(err) {
                            showErrorToast('Error', err?.message || 'Invalid OTP');
                        }
                    }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-center">
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
                                <button type="button" onClick={handleResendOtp} className="text-[#0A437A] cursor-pointer hover:underline font-semibold ml-1">Resend the code</button>
                            )}
                        </p>

                        <button
                            type="submit"
                            className="w-full py-3.5 bg-[#0A437A] text-white font-medium rounded-lg hover:bg-[#083663] transition-colors cursor-pointer text-lg"
                        >
                            Verify
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
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-[320px] max-w-[90vw] p-6 relative animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Change Organization?</h3>
                        <p className="text-gray-500 mb-6">Are you sure you want to change the organization for this administrator?</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setIsOrgConfirmOpen(false);
                                    setOrgChangeToConfirm(null);
                                }}
                                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmOrganizationChange}
                                className="px-4 py-2 bg-[#0A437A] text-white rounded-lg hover:bg-[#0A437A]/90 font-medium transition-colors cursor-pointer"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

