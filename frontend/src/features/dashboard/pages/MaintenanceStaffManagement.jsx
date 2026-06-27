import React, { useState, useEffect } from 'react';
import { Plus, Search, ChevronDown, ChevronLeft, ChevronRight, Download, X, User, Users, Wrench, Calendar, ToggleRight, Phone, ArrowLeft, Mail, Pencil, CheckCircle, Clock, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MaintenanceStaffTable from '../components/maintenanceStaff/MaintenanceStaffTable';
import MaintenanceStaffMobileList from '../components/maintenanceStaff/MaintenanceStaffMobileList';
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
    const [statusFilter, setStatusFilter] = useState("All");
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
    const [isBulkStatusConfirmOpen, setIsBulkStatusConfirmOpen] = useState(false);
    const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

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
    const itemsPerPage = 10;

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
            const res = await maintenanceStaffService.getMaintenanceStaff({
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearch,
                status: statusFilter
            });
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
    }, [currentPage]);

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
    const handleSelectAll = () => {
        const currentVisibleIds = staff.map(w => w._id);
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

    const handleStatusChangeClick = (id, currentStatus) => {
        setStatusToUpdate({ id, currentStatus });
        setIsStatusConfirmOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!statusToUpdate) return;
        setIsConfirming(true);
        try {
            const res = await maintenanceStaffService.toggleStatus(statusToUpdate.id);
            if (res && res.data) {
                const newIsActive = statusToUpdate.currentStatus !== 'Active';
                setStaff(staff.map(w => w._id === statusToUpdate.id ? { ...w, isActive: newIsActive } : w));
                showSuccessToast('Status Updated', res?.message || `Maintenance staff status changed to ${newIsActive ? 'Active' : 'Inactive'}`);
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
                    selectedIds.includes(s._id) ? { ...s, isActive: bulkStatusToUpdate } : s
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
        const emailToVerify = otpSource === 'emailChange' ? newEmailForm : staffForm.email;
        try {
            await otpService.sendOtp(emailToVerify);
            setResendTimer(300);
            setIsTimerActive(true);
            showSuccessToast('Success', 'OTP resent successfully!');
        } catch (error) {
            showErrorToast('Error', error?.message || 'Failed to resend OTP');
        }
    };

    const openChangeEmailModal = (staff) => {
        setEmailChangeStaffId(staff._id);
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
                setStaff(staff.map(s => s._id === emailChangeStaffId ? { ...s, email: newEmailForm } : s));
                setIsEmailChangeModalOpen(false);
                setIsEmailChangeSuccessModalOpen(true);

                if (selectedStaffDetail && selectedStaffDetail._id === emailChangeStaffId) {
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
                const res = await maintenanceStaffService.updateMaintenanceStaff(editingStaff._id, {
                    name: staffForm.name,
                    phone: staffForm.phone,
                    specialization: staffForm.specialization,
                    assignedTask: staffForm.assignedTask
                });
                if (res && res.data) {
                    setStaff(staff.map(w => w._id === editingStaff._id ? { ...w, ...res.data } : w));
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
            const params = { limit: 100000 };
            if (searchQuery) params.search = searchQuery;

            if (exportFilters.isActive !== '') {
                params.status = exportFilters.isActive === 'true' ? 'Active' : 'Inactive';
            } else if (statusFilter !== 'All') {
                params.status = statusFilter;
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
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">

            {/* HEADER ACTION SECTION */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-2 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('Maintenance Staff')}</h1>
                    <p className="text-[10px] sm:text-xs text-[#777777] mt-0.5 sm:mt-1">{t('Manage maintenance staff responsible for handling repair tasks.')}</p>
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
                                className="px-3 py-2 bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                            >
                                Inactive ({selectedIds.length})
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* KPI CARDS SECTION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
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

            {/* TOOLBAR SECTION */}
            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0">
                <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
                    <div className="w-full sm:w-auto flex flex-col gap-2 flex-1 sm:max-w-xs">
                        <div className="relative w-full">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder={t('Search Staff...')}
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
                                    { value: "All Status", label: "All Status" },
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
                                <Download className="w-4 h-4" /> {t('export')}
                            </button>
                        </div>
                        <button
                            onClick={openAddStaffModal}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm hover:bg-secondary transition-colors w-full sm:w-auto shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> {t('Add New')}
                        </button>
                    </div>
                </div>

                {/* DATA TABLE LAYOUT */}

                <MaintenanceStaffTable
                    paginatedStaff={staff}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    setSelectedStaffDetail={setSelectedStaffDetail}
                    setView={setView}
                    handleStatusChangeClick={handleStatusChangeClick}
                    openEditStaffModal={openEditStaffModal}
                    loading={loading}
                    error={error}
                />

                <MaintenanceStaffMobileList
                    paginatedStaff={staff}
                    openEditStaffModal={openEditStaffModal}
                    setSelectedStaffDetail={setSelectedStaffDetail}
                    setView={setView}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    loading={loading}
                    error={error}
                />

                {/* PAGINATION BAR FOOTER */}
                <div className="flex flex-row p-3 sm:p-4 bg-white border border-gray-50 items-center justify-between text-[10px] sm:text-xs font-medium text-gray-500 rounded-b-xl shadow-sm shrink-0 mt-auto">
                    <div>
                        <span className="hidden sm:inline">Showing </span>
                        {totalStaff === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                        <span className="hidden sm:inline"> to </span>
                        <span className="sm:hidden">-</span>
                        {Math.min(currentPage * itemsPerPage, totalStaff)} of {totalStaff}
                        <span className="hidden sm:inline"> entries</span>
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
                    organizations={organizations}
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
                                onClick={saveStaff}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                            >
                                {isSubmitting ? 'Saving...' : 'Confirm'}
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
                title="Export Staff Data"
            />

            {isStatusConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Change Status</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to change the status of this staff member?
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
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                            >
                                {isConfirming ? 'Confirming...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isBulkStatusConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Bulk Change Status</h3>
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
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                            >
                                {isConfirming ? 'Confirming...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL VIEW MODAL */}
            {view === 'detail' && selectedStaffDetail && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
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
                                <button type="button" onClick={handleResendOtp} className="text-[#0A437A] cursor-pointer hover:underline font-semibold ml-1">Resend the code</button>
                            )}
                        </p>

                        <button
                            type="submit"
                            className="w-full py-3.5 bg-[#0A437A] text-white font-medium rounded-lg hover:bg-secondary transition-colors cursor-pointer text-lg"
                        >
                            Verify
                        </button>
                    </form>
                </div>
            )}

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

                        <h3 className="text-xl font-bold text-[#0A437A]">Change Email</h3>
                        <p className="text-sm text-gray-400 mt-1 mb-6">
                            Change the email of {staff.find(w => w._id === emailChangeStaffId)?.name || 'the staff member'}
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
                                        Verified
                                    </button>
                                ) : (
                                    <button type="button" onClick={() => handleVerifyClick(newEmailForm, 'emailChange')} className="px-6 py-2.5 bg-[#0A437A] text-white text-sm font-medium rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                                        Verify
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
            {isAddConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Add Maintenance Staff</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to add this new maintenance staff member?
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
                                onClick={saveStaff}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-70"
                            >
                                {isSubmitting ? 'Adding...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'detail' && (
                <MaintenanceStaffDetailView
                    selectedStaffDetail={selectedStaffDetail}
                    setView={setView}
                />
            )}
        </div>
    );
}
