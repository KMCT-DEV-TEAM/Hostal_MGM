import React, { useState, useEffect } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import PageHeader from '@/components/ui/PageHeader';
import ListToolbar from '@/components/ui/ListToolbar';
import BulkActionMenu from '@/components/ui/BulkActionMenu';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Plus, Search, ChevronDown, ChevronLeft, ChevronRight, Download, X, User, Users, Wrench, Calendar, ToggleRight, Phone, ArrowLeft, Mail, Pencil, CheckCircle, Clock, ClipboardList, LayoutGrid, List, Loader2, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MaintenanceStaffHeader from '../components/maintenanceStaff/MaintenanceStaffHeader';
import MaintenanceStaffTable from '../components/maintenanceStaff/MaintenanceStaffTable';

import MaintenanceStaffFormModal from '../components/maintenanceStaff/MaintenanceStaffFormModal';
import MaintenanceStaffDetailView from '../components/maintenanceStaff/MaintenanceStaffDetailView';
import Dropdown from '@/components/ui/Dropdown';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import maintenanceStaffService from '../../../services/maintenanceStaff.service';
import organizationService from '../../../services/organization.service';
import otpService from '../../../services/otp.service';
import { initSocket } from '@/services/socket.service';
import InfoRow from '@/components/ui/InfoRow';
import { exportToExcel } from '@/utils/exportUtils';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/useAuthStore';

export default function MaintenanceStaffManagement() {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [activeModal, setActiveModal] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [editingStaff, setEditingStaff] = useState(null);
    const [view, setView] = useState('list');
    const [selectedStaffDetail, setSelectedStaffDetail] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isAddConfirmOpen, setIsAddConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [isBulkStatusConfirmOpen, setIsBulkStatusConfirmOpen] = useState(false);
    const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
    const bulkMenuRef = useClickOutside(() => setIsBulkMenuOpen(false));

    // Email verification state
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [otpSource, setOtpSource] = useState(null);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [resendTimer, setResendTimer] = useState(0);
    const [isTimerActive, setIsTimerActive] = useState(false);

    // Email change state
    const [isEmailChangeModalOpen, setIsEmailChangeModalOpen] = useState(false);
    const [isEmailChangeSuccessModalOpen, setIsEmailChangeSuccessModalOpen] = useState(false);
    const [emailChangeStaffId, setEmailChangeStaffId] = useState(null);
    const [emailChangeForm, setEmailChangeForm] = useState('');
    const [newEmailForm, setNewEmailForm] = useState('');

    const [staff, setStaff] = useState([]);
    const [totalStaff, setTotalStaff] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [organizations, setOrganizations] = useState([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Form State
    const [staffForm, setStaffForm] = useState({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        status: 'Active'
    });

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: limit,
                search: debouncedSearch,
            };
            if (statusFilter !== 'All Status' && statusFilter !== 'All') {
                params.status = statusFilter;
            }
            const res = await maintenanceStaffService.getMaintenanceStaff(params);
            if (res && res.data) {
                const dataPayload = res.data;
                const staffList = dataPayload.data || dataPayload;
                setStaff(Array.isArray(staffList) ? staffList : []);
                setTotalStaff(dataPayload.totalCount || res.totalCount || 0);
                setTotalPages(dataPayload.totalPages || res.totalPages || 1);
            }
        } catch (err) {
            console.error("Failed to fetch maintenance staff:", err);
            setError("Failed to fetch maintenance staff. Please try again.");
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
        fetchStaff();
        if (user?.role === 'super_admin') {
            fetchOrganizations();
        }
    }, [currentPage, debouncedSearch, statusFilter]);

    useEffect(() => {
        const socket = initSocket();

        const handleStaffEvent = (data) => {
            if (data?.role === 'maintenance_staff' || data?.bulk) {
                fetchStaff();
            }
        };

        socket.on('userCreated', handleStaffEvent);
        socket.on('userUpdated', handleStaffEvent);
        socket.on('userDeleted', handleStaffEvent);

        return () => {
            socket.off('userCreated', handleStaffEvent);
            socket.off('userUpdated', handleStaffEvent);
            socket.off('userDeleted', handleStaffEvent);
        };
    }, [currentPage, limit, debouncedSearch, statusFilter]);

    const fetchOrganizations = async () => {
        try {
            const res = await organizationService.getOrganizations();
            if (res && res.data) {
                const orgs = res.data.data || res.data;
                setOrganizations(Array.isArray(orgs) ? orgs : []);
            }
        } catch (error) {
            console.error("Failed to fetch organizations:", error);
        }
    };

    useEffect(() => {
        let interval = null;
        if (isOtpModalOpen && isTimerActive && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        } else if (resendTimer === 0) {
            setIsTimerActive(false);
            if (interval) clearInterval(interval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isOtpModalOpen, isTimerActive, resendTimer]);

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // ==========================================
    // SELECTION & ACTION HANDLERS
    // ==========================================
    const handleSelectAll = (mobileIds) => {
        const currentVisibleIds = (Array.isArray(mobileIds) && typeof mobileIds[0] === 'string') ? mobileIds : staff.map(w => w.id);
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

    const handleStatusChangeClick = (id, targetStatus) => {
        setStatusToUpdate({ id, targetStatus });
        setIsStatusConfirmOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!statusToUpdate) return;
        setIsConfirming(true);
        try {
            const isTargetActive = typeof statusToUpdate.targetStatus === 'boolean'
                ? statusToUpdate.targetStatus
                : statusToUpdate.targetStatus === 'Active' || statusToUpdate.targetStatus === 'active';

            const res = await maintenanceStaffService.toggleStatus(statusToUpdate.id, {
                status: isTargetActive ? 'Active' : 'Inactive',
                isActive: isTargetActive
            });
            if (res && res.data) {
                const newStatus = isTargetActive ? 'Active' : 'Inactive';
                setStaff(staff.map(w => w.id === statusToUpdate.id ? { ...w, isActive: isTargetActive } : w));
                fetchStaff();
                showSuccessToast('Status Updated', res?.message || `Maintenance staff status changed to ${newStatus}`);
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to change status');
        } finally {
            setIsConfirming(false);
            setIsStatusConfirmOpen(false);
            setStatusToUpdate(null);
        }
    };

    const handleBulkStatusClick = (isActive) => {
        setBulkStatusToUpdate(isActive);
        setIsBulkStatusConfirmOpen(true);
    };

    const confirmBulkStatusChange = async () => {
        if (selectedIds.length === 0 || bulkStatusToUpdate === null) return;
        setIsConfirming(true);
        try {
            const res = await maintenanceStaffService.bulkToggleStatus({
                ids: selectedIds,
                isActive: bulkStatusToUpdate
            });
            if (res && res.success) {
                setStaff(staff.map(s =>
                    selectedIds.includes(s.id) ? { ...s, isActive: bulkStatusToUpdate } : s
                ));
                const action = bulkStatusToUpdate ? 'Activated' : 'Deactivated';
                showSuccessToast('Bulk Status Updated', res?.message || `Successfully ${action.toLowerCase()} ${selectedIds.length} maintenance staff`);
            }
        } catch (error) {
            console.error("Failed to update bulk status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to update bulk status');
        } finally {
            setIsConfirming(false);
            setSelectedIds([]);
            setIsBulkStatusConfirmOpen(false);
            setBulkStatusToUpdate(null);
        }
    };

    // ==========================================
    // MODAL OPEN / SUBMIT HANDLERS
    // ==========================================
    const openAddStaffModal = () => {
        setEditingStaff(null);
        setStaffForm({ name: '', email: '', phone: '', specialization: '', status: 'Active' });
        setIsEmailVerified(false);
        setActiveModal('staff');
    };

    const openEditStaffModal = (staff) => {
        setEditingStaff(staff);
        setStaffForm({ ...staff });
        setIsEmailVerified(true);
        setActiveModal('staff');
    };

    const handleSaveStaff = (e) => {
        e.preventDefault();
        if (!staffForm.name || !staffForm.email || !staffForm.phone) {
            showErrorToast('Validation Error', 'Please fill in all required fields');
            return;
        }

        if (!isEmailVerified && !editingStaff) {
            showErrorToast('Validation Error', 'Please verify your email before saving');
            return;
        }

        if (editingStaff) {
            setIsEditConfirmOpen(true);
        } else {
            setIsAddConfirmOpen(true);
        }
    };

    const handleVerifyClick = async (email, source = 'addStaff') => {
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
            showSuccessToast('Success', 'OTP sent to email!');
        } catch (error) {
            showErrorToast('Error', error?.message || 'Failed to send OTP');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        setIsVerifying(true);
        const emailToVerify = otpSource === 'emailChange' ? newEmailForm : staffForm.email;
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

    const openChangeEmailModal = (staff) => {
        setEmailChangeStaffId(staff.id);
        setEmailChangeForm(staff.email);
        setNewEmailForm('');
        setIsEmailVerified(false);
        setIsEmailChangeModalOpen(true);
    };

    const confirmEmailChange = async (e) => {
        e.preventDefault();
        if (!isEmailVerified) return;

        try {
            const res = await maintenanceStaffService.updateEmail(emailChangeStaffId, {
                oldEmail: emailChangeForm,
                newEmail: newEmailForm
            });
            if (res && res.success) {
                setStaff(staff.map(s => s.id === emailChangeStaffId ? { ...s, email: newEmailForm } : s));
                setIsEmailChangeModalOpen(false);
                setIsEmailChangeSuccessModalOpen(true);

                if (selectedStaffDetail && selectedStaffDetail.id === emailChangeStaffId) {
                    setSelectedStaffDetail({ ...selectedStaffDetail, email: newEmailForm });
                }

                setTimeout(() => {
                    setIsEmailChangeSuccessModalOpen(false);
                }, 3000);
            }
        } catch (error) {
            showErrorToast('Update Failed', error?.message || 'Failed to update email');
        }
    };

    const saveStaff = async () => {
        setIsSubmitting(true);
        if (editingStaff) {
            try {
                const res = await maintenanceStaffService.updateMaintenanceStaff(editingStaff.id, {
                    name: staffForm.name,
                    phone: staffForm.phone,
                    specialization: staffForm.specialization,
                    assignedTask: staffForm.assignedTask
                });
                if (res && res.data) {
                    setStaff(staff.map(w => w.id === editingStaff.id ? { ...w, ...res.data } : w));
                    showSuccessToast('Maintenance Staff Updated', res?.message || 'Details saved successfully');
                }
            } catch (error) {
                console.error("Failed to update staff:", error);
                showErrorToast('Action Failed', error?.message || 'Failed to update details');
                setIsEditConfirmOpen(false);
                setIsSubmitting(false);
                return;
            }
        } else {
            try {
                const res = await maintenanceStaffService.createMaintenanceStaff({
                    name: staffForm.name,
                    email: staffForm.email,
                    phone: staffForm.phone,
                    specialization: staffForm.specialization,
                    assignedTask: staffForm.assignedTask,
                    organizationId: staffForm.organizationId
                });
                if (res && res.success) {
                    const newStaff = res.data;
                    if (newStaff) {
                        setStaff(prev => [newStaff, ...prev]);
                    }
                    setCurrentPage(1);
                    fetchStaff();
                    showSuccessToast('Maintenance Staff Added', res?.message || 'New staff registered successfully');
                }
            } catch (error) {
                console.error("Failed to create staff:", error);
                showErrorToast('Action Failed', error?.message || 'Failed to register new staff');
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
            const params = { page: currentPage, limit: limit };
            if (searchQuery) params.search = searchQuery;

            // Allow export modal filter to override table filter completely
            if (exportFilters.isActive === 'true') {
                params.status = 'Active';
            } else if (exportFilters.isActive === 'false') {
                params.status = 'Inactive';
            } else {
                delete params.status;
            }

            const res = await maintenanceStaffService.getMaintenanceStaff(params);

            const responseData = res?.data || res;
            const allStaff = responseData?.data || responseData || [];

            if (!allStaff || allStaff.length === 0) {
                showErrorToast('Export failed', 'No staff match the selected filters');
                setIsExportConfirmOpen(false);
                return;
            }

            const exportData = allStaff.map((s, index) => ({
                "SL No": index + 1,
                "Name": s.name || 'N/A',
                "Email": s.email || 'N/A',
                "Phone": s.phone || 'N/A',
                "Specialization": s.specialization || 'N/A',
                "Status": s.isActive ? 'Active' : 'Inactive'
            }));

            const isSuccess = exportToExcel(exportData, "MaintenanceStaff_Export", "MaintenanceStaff");

            if (isSuccess) {
                showSuccessToast('Export Successful', 'Staff list downloaded');
            } else {
                showErrorToast('Export Failed', 'Could not generate the Excel file');
            }
        } catch (error) {
            console.error("Export Failed", error);
            showErrorToast('Export Failed', error?.message || 'Failed to export staff');
        } finally {
            setIsExportConfirmOpen(false);
            setIsExporting(false);
        }
    };

    const totalAssignedTasks = staff.reduce((acc, curr) => acc + (curr.taskAssignedCount || 0), 0);
    const totalResolvedTasks = staff.reduce((acc, curr) => acc + (curr.taskResolvedCount || 0), 0);
    const totalPendingTasks = staff.reduce((acc, curr) => acc + (curr.taskPendingCount || 0), 0);

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <MaintenanceStaffHeader />

            {/* KPI CARDS SECTION */}
            <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-purple-300 shadow-sm border-x border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Staff</p>
                        <h3 className="text-xl font-bold text-gray-900">{totalStaff}</h3>
                    </div>
                    <div className="p-1.5 bg-purple-50 rounded text-purple-400">
                        <Users className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-blue-300 shadow-sm border-x border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Assigned Tasks</p>
                        <h3 className="text-xl font-bold text-gray-900">{totalAssignedTasks}</h3>
                    </div>
                    <div className="p-1.5 bg-blue-50 rounded text-blue-400">
                        <ClipboardList className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-green-300 shadow-sm border-x border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resolved Tasks</p>
                        <h3 className="text-xl font-bold text-gray-900">{totalResolvedTasks}</h3>
                    </div>
                    <div className="p-1.5 bg-green-50 rounded text-green-400">
                        <CheckCircle className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-orange-300 shadow-sm border-x border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pending Tasks</p>
                        <h3 className="text-xl font-bold text-gray-900">{totalPendingTasks}</h3>
                    </div>
                    <div className="p-1.5 bg-orange-50 rounded text-orange-400">
                        <Clock className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* MOBILE KPI CARDS */}
            <div className="md:hidden flex items-center justify-between px-3 py-4 mb-3 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col items-center flex-1">
                    <span className="text-xl font-bold text-[#0A437A]">{totalStaff < 10 ? `0${totalStaff}` : totalStaff}</span>
                    <span className="text-[11px] font-medium text-gray-500 mt-1 capitalize text-center">Total Staff</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                    <span className="text-xl font-bold text-blue-500">{totalAssignedTasks < 10 ? `0${totalAssignedTasks}` : totalAssignedTasks}</span>
                    <span className="text-[11px] font-medium text-gray-500 mt-1 capitalize text-center">Assigned</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                    <span className="text-xl font-bold text-green-600">{totalResolvedTasks < 10 ? `0${totalResolvedTasks}` : totalResolvedTasks}</span>
                    <span className="text-[11px] font-medium text-gray-500 mt-1 capitalize text-center">Resolved</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                    <span className="text-xl font-bold text-orange-500">{totalPendingTasks < 10 ? `0${totalPendingTasks}` : totalPendingTasks}</span>
                    <span className="text-[11px] font-medium text-gray-500 mt-1 capitalize text-center">Pending</span>
                </div>
            </div>

            {/* DATA TABLE LAYOUT */}

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col mt-4">
                <MaintenanceStaffTable
                    paginatedStaff={staff}
                    loading={loading}
                    error={error}
                    searchValue={searchQuery}
                    onSearch={(val) => { setSearchQuery(val); setCurrentPage(1); }}
                    statusFilter={statusFilter}
                    onStatusFilterChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                    onExport={initiateExport}
                    onAddClick={openAddStaffModal}
                    onActivateSelected={() => handleBulkStatusClick(true)}
                    onDeactivateSelected={() => handleBulkStatusClick(false)}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    setSelectedStaffDetail={setSelectedStaffDetail}
                    setView={setView}
                    handleStatusChangeClick={handleStatusChangeClick}
                    openEditStaffModal={openEditStaffModal}
                    page={currentPage}
                    setPage={setCurrentPage}
                    limit={limit}
                    setLimit={setLimit}
                    totalItems={totalStaff}
                    totalPages={totalPages}
                />
            </div>

            {/* MODALS */}

            {activeModal === 'staff' && (
                <MaintenanceStaffFormModal
                    activeModal={activeModal}
                    setActiveModal={setActiveModal}
                    editingStaff={editingStaff}
                    staffForm={staffForm}
                    setStaffForm={setStaffForm}
                    handleSaveStaff={handleSaveStaff}
                    handleCancel={handleCancel}
                    isEmailVerified={isEmailVerified}
                    handleVerifyClick={handleVerifyClick}
                    isSubmitting={isSubmitting}
                    isVerifying={isVerifying}
                    userRole={user?.role}
                    organizations={organizations.filter(o => o.isActive)}
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
                                onClick={saveStaff}
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
                title="Export Staff Data"
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

            {isStatusConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Change Status</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to set the status of this staff member to <strong>{statusToUpdate?.targetStatus || 'the new status'}</strong>?
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
                                {isConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isBulkStatusConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Change Status</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to change the status of {selectedIds.length} staff members to {bulkStatusToUpdate ? 'Active' : 'Inactive'}?
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
                                {isConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL VIEW MODAL */}
            {view === 'detail' && selectedStaffDetail && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-end md:items-center justify-center p-0 md:p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-5xl w-full p-5 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {/* Close Button */}
                        <button
                            onClick={() => setView('list')}
                            className="absolute top-6 right-6 p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <X size={14} />
                        </button>

                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#0A437A] rounded-xl flex items-center justify-center text-white">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{selectedStaffDetail.name}</h1>
                                    <p className="text-gray-400 text-sm">Maintenance Staff Details</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Main Content Area */}
                            <div className="lg:col-span-7 space-y-6">
                                {/* Basic Info Section */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Basic Info</h3>
                                    <p className="text-[11px] text-text-secondary mb-4">Basic information of the Maintenance Staff</p>
                                    <div className="space-y-1">
                                        <InfoRow label={<><User className="w-4 h-4 text-gray-400" /> Name</>}>{selectedStaffDetail.name}</InfoRow>
                                        <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>
                                            <div className="flex items-center justify-between w-full">
                                                <span>{selectedStaffDetail?.email || 'N/A'}</span>
                                                <button
                                                    onClick={() => openChangeEmailModal(selectedStaffDetail)}
                                                    className="text-[#0A437A] text-xs font-semibold hover:underline cursor-pointer ml-4"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </InfoRow>
                                        <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedStaffDetail.phone || 'N/A'}</InfoRow>
                                        <InfoRow label={<><Wrench className="w-4 h-4 text-gray-400" /> Specialization</>}>{selectedStaffDetail.specialization || 'N/A'}</InfoRow>
                                    </div>
                                </div>

                                {/* Status Details */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Status</h3>
                                    <p className="text-[11px] text-text-secondary mb-4">Current activity status</p>
                                    <div className="space-y-1">
                                        <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                            <span className="flex items-center">
                                                <span className={`w-2 h-2 rounded-full ${selectedStaffDetail.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                                {selectedStaffDetail.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </InfoRow>
                                    </div>
                                </div>
                                {/* Task Statistics */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6">
                                    <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Task Statistics</h3>
                                    <p className="text-[11px] text-text-secondary mb-4">Complaint tasks assigned to this staff</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-bold text-blue-600">{selectedStaffDetail.taskAssignedCount || 0}</span>
                                            <span className="text-[11px] font-medium text-blue-600 uppercase mt-1">Assigned</span>
                                        </div>
                                        <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-bold text-green-600">{selectedStaffDetail.taskResolvedCount || 0}</span>
                                            <span className="text-[11px] font-medium text-green-600 uppercase mt-1">Resolved</span>
                                        </div>
                                        <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-bold text-orange-600">{selectedStaffDetail.taskPendingCount || 0}</span>
                                            <span className="text-[11px] font-medium text-orange-600 uppercase mt-1">Pending</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Summary Sidebar */}
                            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                                <h3 className="text-sm font-semibold text-[#0A437A] mb-4">Staff Summary</h3>
                                <div className="space-y-1">
                                    <InfoRow label={<><User className="w-4 h-4 text-gray-400" /> Name</>}>{selectedStaffDetail.name}</InfoRow>
                                    <InfoRow label={<><Wrench className="w-4 h-4 text-gray-400" /> Specialization</>}>{selectedStaffDetail.specialization || 'N/A'}</InfoRow>
                                    <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                        <span className="flex items-center">
                                            <span className={`w-2 h-2 rounded-full ${selectedStaffDetail.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                            {selectedStaffDetail.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </InfoRow>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isOtpModalOpen && (
                <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const code = otpCode.join('');
                        if (code.length < 6) return;

                        try {
                            setIsVerifyingOtp(true);
                            const emailToVerify = otpSource === 'emailChange' ? newEmailForm : staffForm.email;
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
                            A 6-digit code was send to <span className="text-[#0A437A]">{otpSource === 'emailChange' ? newEmailForm : (staffForm.email || '@usergmail.com')}</span>
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
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0A437A] text-white font-medium rounded-lg hover:bg-secondary transition-colors cursor-pointer text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isVerifyingOtp && <Loader2 className="w-5 h-5 animate-spin" />}
                            {isVerifyingOtp ? 'Verifying...' : 'Verify'}
                        </button>
                    </form>
                </div>
            )}

            {isEmailChangeModalOpen && (
                <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <form onSubmit={confirmEmailChange} className="bg-white rounded-t-2xl md:rounded-2xl rounded-b-none shadow-2xl w-full max-w-md p-6 sm:p-8 relative animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <button
                            type="button"
                            onClick={() => setIsEmailChangeModalOpen(false)}
                            className="absolute top-6 right-6 p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>

                        <h3 className="text-xl font-bold text-[#0A437A]">Change Email</h3>
                        <p className="text-sm text-gray-400 mt-1 mb-6">
                            Change the email of {staff.find(w => w.id === emailChangeStaffId)?.name || 'the staff member'}
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
                                    <button type="button" disabled={isVerifying} onClick={() => handleVerifyClick(newEmailForm, 'emailChange')} className="w-full sm:w-auto px-6 py-2.5 bg-[#0A437A] text-white text-sm font-medium rounded-lg hover:bg-secondary transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                        {isVerifying ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!isEmailVerified}
                            className={`w-full py-3 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer ${isEmailVerified ? 'bg-[#0A437A] hover:bg-secondary' : 'bg-[#94A3B8] cursor-not-allowed'}`}
                        >
                            Change Email
                        </button>
                    </form>
                </div>
            )}

            {isEmailChangeSuccessModalOpen && (
                <div className="fixed top-0 right-0 z-[60] animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className="bg-white m-4 p-4 rounded-xl shadow-2xl border border-gray-100 flex items-center gap-3 min-w-[300px]">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                            <ToggleRight className="w-4 h-4 text-green-600" />
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

            {/* Confirm Add Staff Modal */}

            <ConfirmationModal
                isOpen={isAddConfirmOpen}
                onClose={() => setIsAddConfirmOpen(false)}
                onConfirm={saveStaff}
                isSubmitting={isSubmitting}
                title="Add Maintenance Staff"
                message="Are you sure you want to add this new maintenance staff member?"
            />
            </div>
        </div>
    );
}


