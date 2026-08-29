import ConfirmationModal from '@/components/ui/ConfirmationModal';
import React, { useState, useMemo, useEffect } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import AssistantWardenTable from '../components/AssistantWarden/AssistantWardenTable';

import AssistantWardenDetailView from '../components/AssistantWarden/AssistantWardenDetailView';
import AssistantWardenFormModal from '../components/AssistantWarden/AssistantWardenFormModal';
import AssistantWardenHeader from '../components/AssistantWarden/AssistantWardenHeader';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import Dropdown from '@/components/ui/Dropdown';
import { Pencil, X, ArrowLeft, Check, Loader2, SlidersHorizontal, ChevronDown, MoreVertical, Plus, Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import otpService from '../../../services/otp.service';
import hostelService from '../../../services/hostel.service';
import assistantWardenService from '../../../services/assistantWarden.service';
import authService from '../../../services/auth.service';
import { exportToExcel } from '@/utils/exportUtils';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import { initSocket } from '@/services/socket.service';
import * as XLSX from 'xlsx';

export default function AssistantWardenManagement() {
    // State management
    const [assistantWardens, setAssistantWardens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalAssistantWardens, setTotalAssistantWardens] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [availableHostels, setAvailableHostels] = useState([]);
    const [activeModal, setActiveModal] = useState(null); // 'assistantWarden' | 'organization' | null
    const [editingAssistantWarden, setEditingAssistantWarden] = useState(null); // Holds object being edited
    const [view, setView] = useState('list');
    const [selectedAssistantWardenDetail, setSelectedAssistantWardenDetail] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isAddConfirmOpen, setIsAddConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState(null);
    const [isBulkStatusConfirmOpen, setIsBulkStatusConfirmOpen] = useState(false);
    const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
    const bulkMenuRef = useClickOutside(() => setIsBulkMenuOpen(false));
    const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState(null);
    const [isHostelConfirmOpen, setIsHostelConfirmOpen] = useState(false);
    const [hostelChangeToConfirm, setHostelChangeToConfirm] = useState(null);
    const [isUpdatingHostel, setIsUpdatingHostel] = useState(false);
    const [emailChangeAssistantWardenId, setEmailChangeAssistantWardenId] = useState(null);
    const [emailChangeForm, setEmailChangeForm] = useState('');
    const [newEmailForm, setNewEmailForm] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isEmailChangeModalOpen, setIsEmailChangeModalOpen] = useState(false);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isEmailChangeSuccessModalOpen, setIsEmailChangeSuccessModalOpen] = useState(false);
    const [otpSource, setOtpSource] = useState(null);
    const [resendTimer, setResendTimer] = useState(300);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isChangingEmail, setIsChangingEmail] = useState(false);
    const [otpError, setOtpError] = useState('');

    // Form State for Adding / Editing AssistantWarden
    const [assistantWardenForm, setAssistantWardenForm] = useState({
        name: '',
        email: '',
        phone: '',
        hostel: 'Kmct Hostel 1',
        status: 'Active'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ==========================================
    // FILTERING & PAGINATION LOGIC
    // ==========================================
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

    const fetchAssistantWardens = async () => {
        try {
            setLoading(true);
            const res = await assistantWardenService.getAssistantWardens({
                page: currentPage,
                limit: limit,
                search: searchQuery,
                status: statusFilter
            });
            if (res && res.data) {
                const formatted = res.data.map(w => ({
                    ...w,
                    id: w.id,
                    status: w.isActive ? 'Active' : 'Inactive',
                    hostel: w.hostel || 'Not Assigned'
                }));
                setAssistantWardens(formatted);
                setTotalPages(res.totalPages || 1);
                setTotalAssistantWardens(res.totalCount || 0);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch assistantWardens');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssistantWardens();
    }, [currentPage, limit, searchQuery, statusFilter]);

    useEffect(() => {
        const socket = initSocket();

        const handleAssistantWardenEvent = (data) => {
            if (data?.role === 'assistantWarden' || data?.bulk) {
                fetchAssistantWardens();
            }
        };

        socket.on('userCreated', handleAssistantWardenEvent);
        socket.on('userUpdated', handleAssistantWardenEvent);
        socket.on('userDeleted', handleAssistantWardenEvent);

        return () => {
            socket.off('userCreated', handleAssistantWardenEvent);
            socket.off('userUpdated', handleAssistantWardenEvent);
            socket.off('userDeleted', handleAssistantWardenEvent);
        };
    }, [currentPage]);

    useEffect(() => {
        const fetchHostels = async () => {
            try {
                const res = await hostelService.getHostels({ limit: 100 });
                if (res && res.data) setAvailableHostels(res.data);
            } catch (err) {
                console.error('Failed to fetch hostels:', err);
            }
        };
        fetchHostels();
    }, []);

    // Since we are using backend pagination, the "paginatedAssistantWardens" is just the "assistantWardens" array
    const paginatedAssistantWardens = assistantWardens;

    // ==========================================
    // SELECTION & ACTION HANDLERS
    // ==========================================
    const handleSelectAll = (mobileIds) => {
        const currentVisibleIds = (Array.isArray(mobileIds) && typeof mobileIds[0] === 'string') ? mobileIds : paginatedAssistantWardens.map(w => w.id);
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
        try {
            setIsConfirming(true);
            const isTargetActive = typeof statusToUpdate.targetStatus === 'boolean'
                ? statusToUpdate.targetStatus
                : statusToUpdate.targetStatus === 'Active' || statusToUpdate.targetStatus === 'active';

            const res = await assistantWardenService.toggleStatus(statusToUpdate.id, {
                status: isTargetActive ? 'Active' : 'Inactive',
                isActive: isTargetActive
            });
            if (res && (res.success || res.data)) {
                const newStatus = isTargetActive ? 'Active' : 'Inactive';
                setAssistantWardens(assistantWardens.map(w => w.id === statusToUpdate.id ? { ...w, status: newStatus, isActive: isTargetActive } : w));
                fetchAssistantWardens();
                showSuccessToast('Status Updated', res?.message || `Assistant Warden status changed to ${newStatus}`);
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to change assistant warden status');
        } finally {
            setIsConfirming(false);
        }
        setIsStatusConfirmOpen(false);
        setStatusToUpdate(null);
    };

    const handleHostelChange = (id, newHostel) => {
        setHostelChangeToConfirm({ id, newHostel });
        setIsHostelConfirmOpen(true);
    };

    const confirmHostelChange = async () => {
        if (!hostelChangeToConfirm) return;
        const { id, newHostel } = hostelChangeToConfirm;
        setIsUpdatingHostel(true);
        try {
            const res = await assistantWardenService.updateAssistantWardenHostel(id, { hostelId: newHostel });
            fetchAssistantWardens();
            showSuccessToast('Hostel Assigned', res?.message || 'Hostel assigned successfully');
        } catch (err) {
            console.error("Failed to update hostel:", err);
            showErrorToast('Action Failed', err?.message || 'Failed to update hostel assignment');
        } finally {
            setIsHostelConfirmOpen(false);
            setHostelChangeToConfirm(null);
            setIsUpdatingHostel(false);
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
            const res = await assistantWardenService.bulkToggleStatus({
                ids: selectedIds,
                isActive: bulkStatusToUpdate
            });
            if (res && (res.success || res.data)) {
                const newStatus = bulkStatusToUpdate ? 'Active' : 'Inactive';
                setAssistantWardens(assistantWardens.map(w => {
                    if (selectedIds.includes(w.id)) {
                        return { ...w, status: newStatus, isActive: newStatus === 'Active' };
                    }
                    return w;
                }));
                const action = bulkStatusToUpdate ? 'Activated' : 'Deactivated';
                showSuccessToast('Bulk Status Updated', res?.message || `Successfully ${action.toLowerCase()} ${selectedIds.length} assistantWardens`);
            }
        } catch (error) {
            console.error("Failed to bulk update status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to update bulk status');
        } finally {
            setSelectedIds([]); // Clear selection after bulk update
            setIsBulkStatusConfirmOpen(false);
            setBulkStatusToUpdate(null);
            setIsConfirming(false);
            fetchAssistantWardens();
        }
    };

    const openChangeEmailModal = (assistantWarden) => {
        setEmailChangeAssistantWardenId(assistantWarden.id);
        setEmailChangeForm(assistantWarden.email);
        setNewEmailForm('');
        setPasswordConfirm('');
        setIsEmailVerified(false);
        setIsEmailChangeModalOpen(true);
    };

    const confirmEmailChange = async (e) => {
        e.preventDefault();
        if (!isEmailVerified) return;
        if (!passwordConfirm) {
            showErrorToast('Validation Error', 'Please enter your password to confirm');
            return;
        }

        try {
            setIsChangingEmail(true);
            const res = await assistantWardenService.updateEmail(emailChangeAssistantWardenId, {
                oldEmail: emailChangeForm,
                newEmail: newEmailForm,
                password: passwordConfirm
            });

            setAssistantWardens(assistantWardens.map(w => w.id === emailChangeAssistantWardenId ? { ...w, email: newEmailForm } : w));

            if (selectedAssistantWardenDetail && selectedAssistantWardenDetail.id === emailChangeAssistantWardenId) {
                setSelectedAssistantWardenDetail({ ...selectedAssistantWardenDetail, email: newEmailForm });
            }

            setIsEmailChangeModalOpen(false);
            setIsEmailChangeSuccessModalOpen(true);
            showSuccessToast('Email Updated', res?.message || 'AssistantWarden email updated successfully');
            setTimeout(() => {
                setIsEmailChangeSuccessModalOpen(false);
                setEmailChangeAssistantWardenId(null);
                setNewEmailForm('');
            }, 2500);
        } catch (error) {
            showErrorToast('Action Failed', error?.message || 'Failed to update email');
        } finally {
            setIsChangingEmail(false);
        }
    };

    // ==========================================
    // MODAL OPEN / SUBMIT HANDLERS
    // ==========================================
    const openAddAssistantWardenModal = () => {
        setEditingAssistantWarden(null);
        setAssistantWardenForm({ name: '', email: '', phone: '', hostel: availableHostels[0]?.id || '', status: 'Active' });
        setIsEmailVerified(false);
        setActiveModal('assistantWarden');
    };

    const openEditAssistantWardenModal = (assistantWarden) => {
        setEditingAssistantWarden(assistantWarden);
        setAssistantWardenForm({ ...assistantWarden, hostel: assistantWarden.hostel?.id || assistantWarden.hostel });
        setIsEmailVerified(true); // Assuming editing an existing assistantWarden means email is verified
        setActiveModal('assistantWarden');
    };

    const handleVerifyClick = async (email, source = 'addAssistantWarden') => {
        if (!email) {
            showErrorToast('Validation Error', 'Please enter an email first');
            return;
        }
        setIsVerifying(true);
        setOtpError('');
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
            const errorMsg = error?.message || 'Failed to send OTP';
            if (errorMsg.toLowerCase().includes('otp already sent')) {
                setOtpError(errorMsg);
                setOtpSource(source);
                setOtpCode(['', '', '', '', '', '']);
                setIsOtpModalOpen(true);
                if (source === 'emailChange') {
                    setIsEmailChangeModalOpen(false);
                }
            } else {
                showErrorToast('Action Failed', errorMsg);
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        setIsVerifying(true);
        setOtpError('');
        const emailToVerify = otpSource === 'emailChange' ? newEmailForm : assistantWardenForm.email;
        try {
            await otpService.sendOtp(emailToVerify);
            setResendTimer(300);
            setIsTimerActive(true);
            showSuccessToast('Success', 'OTP resent successfully!');
        } catch (error) {
            setOtpError(error?.message || 'Failed to resend OTP');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSaveAssistantWarden = async (e) => {
        e.preventDefault();
        if (!assistantWardenForm.name || !assistantWardenForm.email || !assistantWardenForm.phone) {
            showErrorToast('Validation Error', 'Please fill in all required fields');
            return;
        }
        if (assistantWardenForm.phone.length !== 10) {
            showErrorToast('Validation Error', 'Phone number must be exactly 10 digits');
            return;
        }
        if (!isEmailVerified && !editingAssistantWarden) {
            showErrorToast('Validation Error', 'Please verify your email before saving');
            return;
        }

        if (editingAssistantWarden) {
            setIsEditConfirmOpen(true);
        } else {
            setIsAddConfirmOpen(true);
        }
    };

    const saveAssistantWarden = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                name: assistantWardenForm.name,
                email: assistantWardenForm.email,
                phone: assistantWardenForm.phone,
                hostelId: assistantWardenForm.hostel,
                isActive: assistantWardenForm.status === 'Active'
            };

            if (editingAssistantWarden) {
                // Update Existing Record
                const res = await assistantWardenService.updateAssistantWarden(editingAssistantWarden.id, {
                    name: assistantWardenForm.name,
                    phone: assistantWardenForm.phone
                });

                let updatedAssistantWarden = { ...res.data };

                const oldHostelId = typeof editingAssistantWarden.hostel === 'object' ? editingAssistantWarden.hostel?.id : editingAssistantWarden.hostel;
                if (assistantWardenForm.hostel !== oldHostelId) {
                    await assistantWardenService.updateAssistantWardenHostel(editingAssistantWarden.id, { hostelId: assistantWardenForm.hostel });
                    const newHostel = availableHostels.find(h => h.id === assistantWardenForm.hostel);
                    updatedAssistantWarden.hostel = newHostel ? newHostel : { id: assistantWardenForm.hostel };
                }

                if (assistantWardenForm.status !== editingAssistantWarden.status) {
                    await assistantWardenService.bulkToggleStatus({ ids: [editingAssistantWarden.id], isActive: assistantWardenForm.status === 'Active' });
                    updatedAssistantWarden.status = assistantWardenForm.status;
                }

                if (res && (res.success || res.data)) {
                    setAssistantWardens(assistantWardens.map(w => w.id === editingAssistantWarden.id ? { ...w, ...updatedAssistantWarden } : w));
                    await fetchAssistantWardens(); // Re-fetch to ensure sync
                    showSuccessToast('AssistantWarden Updated', res?.message || 'AssistantWarden details saved successfully');
                }
            } else {
                // Create New Record
                const res = await assistantWardenService.createAssistantWarden(payload);
                if (res && (res.success || res.data)) {
                    fetchAssistantWardens();
                    showSuccessToast('AssistantWarden Added', res?.message || 'New assistantWarden registered successfully');
                }
            }
        } catch (error) {
            console.error("Failed to save assistantWarden:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to save assistantWarden');
        } finally {
            setActiveModal(null);
            setIsEditConfirmOpen(false);
            setIsAddConfirmOpen(false);
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsDiscardConfirmOpen(true);
    };

    const confirmDiscard = () => {
        setIsDiscardConfirmOpen(false);
        setActiveModal(null);
    };

    const confirmExport = async (exportFilters) => {
        setIsExporting(true);
        try {
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

            const res = await assistantWardenService.getAssistantWardens(params);

            // Handle different possible response structures
            const responseData = res?.data || res;
            const allAssistantWardens = responseData?.data || responseData || [];

            if (allAssistantWardens && allAssistantWardens.length > 0) {
                const exportData = allAssistantWardens.map((assistantWarden, index) => ({
                    "SL No": index + 1,
                    "Name": assistantWarden.name,
                    "Email": assistantWarden.email,
                    "Phone": assistantWarden.phone || 'N/A',
                    "Hostel": assistantWarden.hostel?.name || assistantWarden.hostel || 'Not Assigned',
                    "Status": assistantWarden.isActive ? 'Active' : 'Inactive',
                    'Joined Date': new Date(assistantWarden.createdAt).toLocaleDateString()
                }));

                const isSuccess = exportToExcel(exportData, "AssistantWardens_Export", "AssistantWardens");

                if (isSuccess) {
                    showSuccessToast('Export Successful', 'The assistantWarden list has been downloaded.');
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

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <AssistantWardenHeader />

                <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col">
                    <AssistantWardenTable
                        assistantWardens={assistantWardens}
                        loading={loading}
                        error={error}
                        availableHostels={availableHostels}
                        searchValue={searchQuery}
                        onSearch={(val) => { setSearchQuery(val); setCurrentPage(1); }}
                        statusFilter={statusFilter}
                        onStatusFilterChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                        onExport={() => setIsExportConfirmOpen(true)}
                        onAddClick={openAddAssistantWardenModal}
                        onActivateSelected={() => handleBulkStatusClick(true)}
                        onDeactivateSelected={() => handleBulkStatusClick(false)}
                        selectedIds={selectedIds}
                        onSelectAll={handleSelectAll}
                        onSelectRow={handleSelectRow}
                        setSelectedAssistantWardenDetail={setSelectedAssistantWardenDetail}
                        setView={setView}
                        openEditAssistantWardenModal={openEditAssistantWardenModal}
                        handleStatusChangeClick={handleStatusChangeClick}
                        handleHostelChange={handleHostelChange}
                        page={currentPage}
                        setPage={setCurrentPage}
                        limit={limit}
                        setLimit={setLimit}
                        totalItems={totalAssistantWardens}
                        totalPages={totalPages}
                    />
                </div>

            <AssistantWardenFormModal
                activeModal={activeModal}
                setActiveModal={setActiveModal}
                editingAssistantWarden={editingAssistantWarden}
                handleSaveAssistantWarden={handleSaveAssistantWarden}
                handleCancel={handleCancel}
                AVAILABLE_HOSTELS={availableHostels.filter(h => h.isActive)}
                isEmailVerified={isEmailVerified}
                setIsOtpModalOpen={setIsOtpModalOpen}
                setOtpSource={setOtpSource}
                assistantWardenForm={assistantWardenForm}
                setAssistantWardenForm={setAssistantWardenForm}
                handleVerifyClick={handleVerifyClick}
                isSubmitting={isSubmitting}
                isVerifying={isVerifying}
            />

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export AssistantWardens Data"
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
                                onClick={saveAssistantWarden}
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

            {isStatusConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Change Status</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to set the status of this assistant warden to <strong>{statusToUpdate?.targetStatus || 'the new status'}</strong>?
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
                            Are you sure you want to set the status of {selectedIds.length} assistantWarden(s) to <strong>{bulkStatusToUpdate ? 'Active' : 'Inactive'}</strong>?
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

            {isEmailChangeModalOpen && (
                <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <form onSubmit={confirmEmailChange} className="bg-white rounded-t-2xl md:rounded-2xl rounded-b-none shadow-2xl w-full max-w-md p-6 sm:p-8 relative animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={() => setIsEmailChangeModalOpen(false)}
                            className="absolute top-6 right-6 p-1.5 rounded-md border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-[#0A437A]">Change Email</h3>
                        <p className="text-sm text-gray-400 mt-1 mb-6">
                            Change the email of {assistantWardens.find(w => w.id === emailChangeAssistantWardenId)?.name || 'the assistantWarden'}
                        </p>

                        <hr className="border-gray-200 mb-6" />

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-[#222222] mb-2">Current Email <span className="text-danger">*</span></label>
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
                            <label className="block text-sm font-medium text-[#222222] mb-2">New Email <span className="text-danger">*</span></label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="email"
                                    required
                                    disabled={isEmailVerified}
                                    value={newEmailForm}
                                    onChange={(e) => setNewEmailForm(e.target.value)}
                                    placeholder="Enter your new email"
                                    className="flex-1 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0A437A] disabled:opacity-60 disabled:bg-gray-50"
                                />
                                {isEmailVerified ? (
                                    <button type="button" className="w-full sm:w-auto px-6 py-2.5 bg-green-50 text-success border border-green-200 text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 cursor-default">
                                        <Check size={16} /> Verified
                                    </button>
                                ) : (
                                    <button type="button" disabled={isVerifying} onClick={() => handleVerifyClick(newEmailForm, 'emailChange')} className="w-full sm:w-auto flex items-center justify-center min-w-[90px] px-6 py-2.5 bg-[#0A437A] text-white text-sm font-medium rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
                                        {isVerifying ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {isEmailVerified && (
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-[#222222] mb-2">Your Password <span className="text-danger">*</span></label>
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
                            disabled={!isEmailVerified || !passwordConfirm || isChangingEmail}
                            className={`w-full py-3 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${isEmailVerified && passwordConfirm && !isChangingEmail ? 'bg-[#0A437A] hover:bg-secondary' : 'bg-[#94A3B8] cursor-not-allowed'}`}
                        >
                            {isChangingEmail ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Change Email'}
                        </button>
                    </form>
                </div>
            )}

            {isOtpModalOpen && (
                <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const code = otpCode.join('');
                        if (code.length !== 6) {
                            setOtpError('Please enter a 6-digit code');
                            return;
                        }
                        setIsVerifyingOtp(true);
                        setOtpError('');
                        try {
                            const emailToVerify = otpSource === 'emailChange' ? newEmailForm : assistantWardenForm.email;
                            await otpService.verifyOtp(emailToVerify, code);

                            setIsOtpModalOpen(false);
                            setIsEmailVerified(true);
                            if (otpSource === 'emailChange') {
                                setIsEmailChangeModalOpen(true);
                            } else {
                                showSuccessToast('Success', 'Email verified successfully!');
                            }
                        } catch (err) {
                            setOtpError(err?.message || 'Invalid OTP');
                        } finally {
                            setIsVerifyingOtp(false);
                        }
                    }} className="bg-white rounded-t-2xl md:rounded-2xl rounded-b-none shadow-2xl w-full max-w-md p-6 sm:p-8 relative animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200 text-center">
                        {/* Top action buttons */}
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

                        {/* Title & Subtitle */}
                        <h3 className="text-[32px] font-bold text-[#0A437A] mb-4">Enter the code</h3>
                        <p className="text-gray-500 mb-3 text-[15px]">
                            A 6-digit code was send to <span className="text-[#0A437A]">{otpSource === 'emailChange' ? newEmailForm : assistantWardenForm.email || '@usergmail.com'}</span>
                        </p>


                        {/* OTP Inputs */}
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
                                        ${otpError ? 'text-primary border-primary' : (digit ? 'border-[#0A437A] text-[#0A437A]' : 'border-gray-300 text-[#0A437A] focus:border-[#0A437A]')}`}
                                />
                            ))}
                        </div>

                        {otpError && (
                            <p className="text-danger text-xs mb-6 font-medium text-center">{otpError}</p>
                        )}

                        <p className="text-[14px] text-gray-400 mb-8 font-medium">
                            Didn't receive it ? {resendTimer > 0 ? (
                                <span className="text-gray-500 font-semibold ml-1">Resend in {formatTime(resendTimer)}</span>
                            ) : (
                                <button type="button" onClick={handleResendOtp} disabled={isVerifying} className="text-[#0A437A] cursor-pointer hover:underline font-semibold ml-1 disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed">
                                    {isVerifying ? 'Sending...' : 'Resend the code'}
                                </button>
                            )}
                        </p>

                        {/* Verify Button */}
                        <button
                            type="submit"
                            disabled={isVerifyingOtp}
                            className="w-full py-3.5 bg-[#0A437A] text-white font-medium rounded-lg hover:bg-secondary transition-colors flex items-center justify-center gap-2 cursor-pointer text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isVerifyingOtp ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Verify'}
                        </button>
                    </form>
                </div>
            )}

            {isEmailChangeSuccessModalOpen && (
                <div className="fixed top-0 right-0 z-[60] animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className="bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-6 py-4 flex items-center gap-4 border border-gray-100">
                        <div className="w-10 h-10 rounded-full border border-[#85A947] flex items-center justify-center shrink-0">
                            <Check className="w-5 h-5 text-[#85A947]" strokeWidth={2} />
                        </div>
                        <h3 className="text-[16px] font-medium text-gray-900">Email Was Changed Successfully !</h3>
                    </div>
                </div>
            )}

            {view === 'detail' && (
                <AssistantWardenDetailView
                    selectedAssistantWardenDetail={selectedAssistantWardenDetail}
                    setView={setView}
                    openChangeEmailModal={openChangeEmailModal}
                />
            )}
            {/* Confirm Hostel Change Modal */}
            {isHostelConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Change Hostel</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to change the hostel assignment for this assistantWarden?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setIsHostelConfirmOpen(false);
                                    setHostelChangeToConfirm(null);
                                }}
                                disabled={isUpdatingHostel}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-70"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmHostelChange}
                                disabled={isUpdatingHostel}
                                className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isUpdatingHostel ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Add AssistantWarden Modal */}
            {isAddConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Add AssistantWarden</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to add this new assistantWarden?
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
                                onClick={saveAssistantWarden}
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

