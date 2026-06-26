import React, { useState, useMemo, useEffect } from 'react';
import WardenHeader from '../components/Warden/WardenHeader';
import WardenToolbar from '../components/Warden/WardenToolbar';
import WardenTable from '../components/Warden/WardenTable';
import WardenMobileList from '../components/Warden/WardenMobileList';
import WardenPagination from '../components/Warden/WardenPagination';
import WardenDetailView from '../components/Warden/WardenDetailView';
import WardenFormModal from '../components/Warden/WardenFormModal';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import { Pencil, X, ArrowLeft, Check, Loader2 } from 'lucide-react';
import otpService from '../../../services/otp.service';
import hostelService from '../../../services/hostel.service';
import wardenService from '../../../services/warden.service';
import { exportToExcel } from '@/utils/exportUtils';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import * as XLSX from 'xlsx';

export default function WardenManagement() {
    // State management
    const [wardens, setWardens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalWardens, setTotalWardens] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [availableHostels, setAvailableHostels] = useState([]);
    const [activeModal, setActiveModal] = useState(null); // 'warden' | 'organization' | null
    const [editingWarden, setEditingWarden] = useState(null); // Holds object being edited
    const [view, setView] = useState('list');
    const [selectedWardenDetail, setSelectedWardenDetail] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isAddConfirmOpen, setIsAddConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState(null);
    const [isBulkStatusConfirmOpen, setIsBulkStatusConfirmOpen] = useState(false);
    const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState(null);
    const [isHostelConfirmOpen, setIsHostelConfirmOpen] = useState(false);
    const [hostelChangeToConfirm, setHostelChangeToConfirm] = useState(null);
    const [isUpdatingHostel, setIsUpdatingHostel] = useState(false);
    const [emailChangeWardenId, setEmailChangeWardenId] = useState(null);
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

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form State for Adding / Editing Warden
    const [wardenForm, setWardenForm] = useState({
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

    const fetchWardens = async () => {
        try {
            setLoading(true);
            const res = await wardenService.getWardens({
                page: currentPage,
                limit: itemsPerPage,
                search: searchQuery,
                status: statusFilter
            });
            if (res && res.data) {
                const formatted = res.data.map(w => ({
                    ...w,
                    id: w._id,
                    status: w.isActive ? 'Active' : 'Inactive',
                    hostel: w.hostel || 'Not Assigned'
                }));
                setWardens(formatted);
                setTotalPages(res.totalPages || 1);
                setTotalWardens(res.totalCount || 0);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch wardens');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWardens();
    }, [currentPage, searchQuery, statusFilter]);

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

    // Since we are using backend pagination, the "paginatedWardens" is just the "wardens" array
    const paginatedWardens = wardens;

    // ==========================================
    // SELECTION & ACTION HANDLERS
    // ==========================================
    const handleSelectAll = () => {
        const currentVisibleIds = paginatedWardens.map(w => w.id);
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
        try {
            const res = await wardenService.toggleStatus(statusToUpdate.id);
            if (res && (res.success || res.data)) {
                const newStatus = statusToUpdate.currentStatus === 'Active' ? 'Inactive' : 'Active';
                setWardens(wardens.map(w => w.id === statusToUpdate.id ? { ...w, status: newStatus } : w));
                showSuccessToast('Status Updated', res?.message || `Warden status changed to ${newStatus}`);
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to change warden status');
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
            const res = await wardenService.updateWardenHostel(id, { hostelId: newHostel });
            fetchWardens();
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
            const res = await wardenService.bulkToggleStatus({
                ids: selectedIds,
                isActive: bulkStatusToUpdate
            });
            if (res && (res.success || res.data)) {
                const newStatus = bulkStatusToUpdate ? 'Active' : 'Inactive';
                setWardens(wardens.map(w => {
                    if (selectedIds.includes(w.id)) {
                        return { ...w, status: newStatus };
                    }
                    return w;
                }));
                const action = bulkStatusToUpdate ? 'Activated' : 'Deactivated';
                showSuccessToast('Bulk Status Updated', res?.message || `Successfully ${action.toLowerCase()} ${selectedIds.length} wardens`);
            }
        } catch (error) {
            console.error("Failed to bulk update status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to update bulk status');
        } finally {
            setSelectedIds([]); // Clear selection after bulk update
            setIsBulkStatusConfirmOpen(false);
            setBulkStatusToUpdate(null);
            fetchWardens();
        }
    };

    const openChangeEmailModal = (warden) => {
        setEmailChangeWardenId(warden.id);
        setEmailChangeForm(warden.email);
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
            const res = await wardenService.updateEmail(emailChangeWardenId, {
                oldEmail: emailChangeForm,
                newEmail: newEmailForm,
                password: passwordConfirm
            });

            setWardens(wardens.map(w => w.id === emailChangeWardenId ? { ...w, email: newEmailForm } : w));

            if (selectedWardenDetail && selectedWardenDetail.id === emailChangeWardenId) {
                setSelectedWardenDetail({ ...selectedWardenDetail, email: newEmailForm });
            }

            setIsEmailChangeModalOpen(false);
            setIsEmailChangeSuccessModalOpen(true);
            showSuccessToast('Email Updated', res?.message || 'Warden email updated successfully');
            setTimeout(() => {
                setIsEmailChangeSuccessModalOpen(false);
                setEmailChangeWardenId(null);
                setNewEmailForm('');
            }, 2500);
        } catch (error) {
            showErrorToast('Action Failed', error?.message || 'Failed to update email');
        }
    };

    // ==========================================
    // MODAL OPEN / SUBMIT HANDLERS
    // ==========================================
    const openAddWardenModal = () => {
        setEditingWarden(null);
        setWardenForm({ name: '', email: '', phone: '', hostel: availableHostels[0]?._id || '', status: 'Active' });
        setIsEmailVerified(false);
        setActiveModal('warden');
    };

    const openEditWardenModal = (warden) => {
        setEditingWarden(warden);
        setWardenForm({ ...warden, hostel: warden.hostel?._id || warden.hostel });
        setIsEmailVerified(true); // Assuming editing an existing warden means email is verified
        setActiveModal('warden');
    };

    const handleVerifyClick = async (email, source = 'addWarden') => {
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
            showErrorToast('Action Failed', error?.message || 'Failed to send OTP');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        const emailToVerify = otpSource === 'emailChange' ? newEmailForm : wardenForm.email;
        try {
            await otpService.sendOtp(emailToVerify);
            setResendTimer(300);
            setIsTimerActive(true);
            showSuccessToast('Success', 'OTP resent successfully!');
        } catch (error) {
            showErrorToast('Error', error?.message || 'Failed to resend OTP');

        }
    };

    const handleSaveWarden = async (e) => {
        e.preventDefault();
        if (!wardenForm.name || !wardenForm.email || !wardenForm.phone) {
            showErrorToast('Validation Error', 'Please fill in all required fields');
            return;
        }
        if (!isEmailVerified && !editingWarden) {
            showErrorToast('Validation Error', 'Please verify your email before saving');
            return;
        }

        if (editingWarden) {
            setIsEditConfirmOpen(true);
        } else {
            setIsAddConfirmOpen(true);
        }
    };

    const saveWarden = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                name: wardenForm.name,
                email: wardenForm.email,
                phone: wardenForm.phone,
                hostelId: wardenForm.hostel,
                isActive: wardenForm.status === 'Active'
            };

            if (editingWarden) {
                // Update Existing Record
                const res = await wardenService.updateWarden(editingWarden.id, payload);
                if (res && (res.success || res.data)) {
                    setWardens(wardens.map(w => w.id === editingWarden.id ? { ...w, ...wardenForm } : w));
                    fetchWardens(); // Re-fetch to ensure sync
                    showSuccessToast('Warden Updated', res?.message || 'Warden details saved successfully');
                }
            } else {
                // Create New Record
                const res = await wardenService.createWarden(payload);
                if (res && (res.success || res.data)) {
                    fetchWardens();
                    showSuccessToast('Warden Added', res?.message || 'New warden registered successfully');
                }
            }
        } catch (error) {
            console.error("Failed to save warden:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to save warden');
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
            
            // Allow export modal filter to override table filter
            if (exportFilters.isActive !== '') {
                params.status = exportFilters.isActive === 'true' ? 'Active' : 'Inactive';
            } else if (statusFilter !== 'All') {
                params.status = statusFilter;
            }

            const res = await wardenService.getWardens(params);
            
            // Handle different possible response structures
            const responseData = res?.data || res;
            const allWardens = responseData?.data || responseData || [];

            if (allWardens && allWardens.length > 0) {
                const exportData = allWardens.map((warden, index) => ({
                    "SL No": index + 1,
                    "Name": warden.name,
                    "Email": warden.email,
                    "Phone": warden.phone || 'N/A',
                    "Hostel": warden.hostel?.name || warden.hostel || 'Not Assigned',
                    "Status": warden.isActive ? 'Active' : 'Inactive',
                    'Joined Date': new Date(warden.createdAt).toLocaleDateString()
                }));

                const isSuccess = exportToExcel(exportData, "Wardens_Export", "Wardens");
                
                if (isSuccess) {
                    showSuccessToast('Export Successful', 'The warden list has been downloaded.');
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
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <WardenHeader
                selectedIds={selectedIds}
                wardens={wardens}
                openEditWardenModal={openEditWardenModal}
                handleBulkStatusClick={handleBulkStatusClick}
            />

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0">
                <WardenToolbar
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    setCurrentPage={setCurrentPage}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    initiateExport={() => setIsExportConfirmOpen(true)}
                    openAddWardenModal={openAddWardenModal}
                />

                <WardenTable
                    wardens={wardens}
                    paginatedWardens={paginatedWardens}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    handleStatusChangeClick={handleStatusChangeClick}
                    handleHostelChange={handleHostelChange}
                    openEditWardenModal={openEditWardenModal}
                    setSelectedWardenDetail={setSelectedWardenDetail}
                    setView={setView}
                    loading={loading}
                    error={error}
                    availableHostels={availableHostels}
                />

                <WardenMobileList
                    wardens={wardens}
                    paginatedWardens={paginatedWardens}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    handleStatusChangeClick={handleStatusChangeClick}
                    handleHostelChange={handleHostelChange}
                    openEditWardenModal={openEditWardenModal}
                    setSelectedWardenDetail={setSelectedWardenDetail}
                    setView={setView}
                    loading={loading}
                    error={error}
                    availableHostels={availableHostels}
                />

                <WardenPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalWardens={totalWardens}
                    itemsPerPage={itemsPerPage}
                    handlePageChange={setCurrentPage}
                />
            </div>

            <WardenFormModal
                activeModal={activeModal}
                setActiveModal={setActiveModal}
                editingWarden={editingWarden}
                handleSaveWarden={handleSaveWarden}
                handleCancel={handleCancel}
                AVAILABLE_HOSTELS={availableHostels}
                isEmailVerified={isEmailVerified}
                setIsOtpModalOpen={setIsOtpModalOpen}
                setOtpSource={setOtpSource}
                wardenForm={wardenForm}
                setWardenForm={setWardenForm}
                handleVerifyClick={handleVerifyClick}
                isSubmitting={isSubmitting}
                isVerifying={isVerifying}
            />

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Wardens Data"
            />

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
                                onClick={saveWarden}
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

            {isStatusConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Change Status</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to change the status of this warden?
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
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer"
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
                        <h3 className="text-sm font-bold text-gray-900">Change Status</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to set the status of {selectedIds.length} warden(s) to <strong>{bulkStatusToUpdate ? 'Active' : 'Inactive'}</strong>?
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
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEmailChangeModalOpen && (
                <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <form onSubmit={confirmEmailChange} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200">
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
                            Change the email of {wardens.find(w => w.id === emailChangeWardenId)?.name || 'the warden'}
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
                                    disabled={isEmailVerified}
                                    value={newEmailForm}
                                    onChange={(e) => setNewEmailForm(e.target.value)}
                                    placeholder="Enter your new email"
                                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0A437A] disabled:opacity-60 disabled:bg-gray-50"

                                />
                                {isEmailVerified ? (
                                    <button type="button" className="px-6 py-2.5 bg-green-50 text-success border border-green-200 text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-default">
                                        <Check size={16} /> Verified
                                    </button>
                                ) : (
                                    <button type="button" onClick={() => handleVerifyClick(newEmailForm, 'emailChange')} className="px-6 py-2.5 bg-[#0A437A] text-white text-sm font-medium rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                                        Verify
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
                            disabled={!isEmailVerified || !passwordConfirm}
                            className={`w-full py-3 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer ${isEmailVerified && passwordConfirm ? 'bg-[#0A437A] hover:bg-secondary' : 'bg-[#94A3B8] cursor-not-allowed'}`}
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
                            const emailToVerify = otpSource === 'emailChange' ? newEmailForm : wardenForm.email;
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
                            A 6-digit code was send to <span className="text-[#0A437A]">{otpSource === 'emailChange' ? newEmailForm : wardenForm.email || '@usergmail.com'}</span>
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

                        {/* Verify Button */}
                        <button
                            type="submit"
                            className="w-full py-3.5 bg-[#0A437A] text-white font-medium rounded-lg hover:bg-secondary transition-colors cursor-pointer text-lg"
                        >
                            Verify
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
                <WardenDetailView
                    selectedWardenDetail={selectedWardenDetail}
                    setView={setView}
                    openChangeEmailModal={openChangeEmailModal}
                />
            )}
            {/* Confirm Hostel Change Modal */}
            {isHostelConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Change Hostel</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to change the hostel assignment for this warden?
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
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-70"
                            >
                                {isUpdatingHostel && <Loader2 className="w-4 h-4 animate-spin" />}
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Confirm Add Warden Modal */}
            {isAddConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-bold text-gray-900">Add Warden</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to add this new warden?
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
                                onClick={saveWarden}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-secondary transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-70"
                            >
                                {isSubmitting ? 'Adding...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

