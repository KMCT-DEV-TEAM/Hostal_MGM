import React, { useState, useMemo, useEffect } from 'react';
import WardenHeader from '../components/Warden/WardenHeader';
import WardenToolbar from '../components/Warden/WardenToolbar';
import WardenTable from '../components/Warden/WardenTable';
import WardenMobileList from '../components/Warden/WardenMobileList';
import WardenPagination from '../components/Warden/WardenPagination';
import WardenDetailView from '../components/Warden/WardenDetailView';
import WardenFormModal from '../components/Warden/WardenFormModal';
import { Pencil, X, ArrowLeft, Check } from 'lucide-react';
import wardenService from '../../../services/warden.service';

const AVAILABLE_HOSTELS = [
    'Kmct Hostel 1', 'Kmct Hostel 2', 'Kmct Hostel 3', 'Kmct Hostel 4', 'Kmct Hostel 5',
    'Kmct Hostel 6', 'Kmct Hostel 7', 'Kmct Hostel 8', 'Kmct Hostel 9', 'Kmct Hostel 10'
];

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
    const [activeModal, setActiveModal] = useState(null); // 'warden' | 'organization' | null
    const [editingWarden, setEditingWarden] = useState(null); // Holds object being edited
    const [view, setView] = useState('list');
    const [selectedWardenDetail, setSelectedWardenDetail] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState(null);
    const [isBulkStatusConfirmOpen, setIsBulkStatusConfirmOpen] = useState(false);
    const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState(null);
    const [isEmailChangeModalOpen, setIsEmailChangeModalOpen] = useState(false);
    const [emailChangeForm, setEmailChangeForm] = useState('');
    const [emailChangeWardenId, setEmailChangeWardenId] = useState(null);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isEmailChangeSuccessModalOpen, setIsEmailChangeSuccessModalOpen] = useState(false);
    const [otpSource, setOtpSource] = useState(null); // 'emailChange' | 'addWarden'

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

    // ==========================================
    // FILTERING & PAGINATION LOGIC
    // ==========================================
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

    const confirmStatusChange = () => {
        if (!statusToUpdate) return;
        const newStatus = statusToUpdate.currentStatus === 'Active' ? 'Inactive' : 'Active';
        setWardens(wardens.map(w => w.id === statusToUpdate.id ? { ...w, status: newStatus } : w));
        setIsStatusConfirmOpen(false);
        setStatusToUpdate(null);
    };

    const handleHostelChange = (id, newHostel) => {
        setWardens(wardens.map(w => w.id === id ? { ...w, hostel: newHostel } : w));
    };

    const handleBulkStatusClick = (isActive) => {
        setBulkStatusToUpdate(isActive);
        setIsBulkStatusConfirmOpen(true);
    };

    const confirmBulkStatusChange = () => {
        if (selectedIds.length === 0 || bulkStatusToUpdate === null) return;

        const newStatus = bulkStatusToUpdate ? 'Active' : 'Inactive';

        setWardens(wardens.map(w => {
            if (selectedIds.includes(w.id)) {
                return { ...w, status: newStatus };
            }
            return w;
        }));

        setSelectedIds([]); // Clear selection after bulk update
        setIsBulkStatusConfirmOpen(false);
        setBulkStatusToUpdate(null);
    };

    const openChangeEmailModal = (warden) => {
        setEmailChangeWardenId(warden.id);
        setEmailChangeForm(warden.email || '');
        setIsEmailVerified(false);
        setIsEmailChangeModalOpen(true);
    };

    const confirmEmailChange = (e) => {
        e.preventDefault();
        setWardens(wardens.map(w => w.id === emailChangeWardenId ? { ...w, email: emailChangeForm } : w));

        if (selectedWardenDetail && selectedWardenDetail.id === emailChangeWardenId) {
            setSelectedWardenDetail({ ...selectedWardenDetail, email: emailChangeForm });
        }

        setIsEmailChangeModalOpen(false);
        setIsEmailChangeSuccessModalOpen(true);
        setTimeout(() => {
            setIsEmailChangeSuccessModalOpen(false);
            setEmailChangeWardenId(null);
        }, 2500);
    };

    // ==========================================
    // MODAL OPEN / SUBMIT HANDLERS
    // ==========================================
    const openAddWardenModal = () => {
        setEditingWarden(null);
        setWardenForm({ name: '', email: '', phone: '', hostel: AVAILABLE_HOSTELS[0], status: 'Active' });
        setActiveModal('warden');
    };

    const openEditWardenModal = (warden) => {
        setEditingWarden(warden);
        setWardenForm({ ...warden });
        setActiveModal('warden');
    };

    const handleSaveWarden = (e) => {
        e.preventDefault();
        if (!wardenForm.name || !wardenForm.email || !wardenForm.phone) {
            alert("Please fill in all required fields.");
            return;
        }

        if (editingWarden) {
            setIsEditConfirmOpen(true);
        } else {
            saveWarden();
        }
    };

    const saveWarden = () => {
        if (editingWarden) {
            // Update Existing Record
            setWardens(wardens.map(w => w.id === editingWarden.id ? { ...w, ...wardenForm } : w));
        } else {
            // Create New Record
            const newWarden = {
                id: Date.now(),
                ...wardenForm
            };
            setWardens([newWarden, ...wardens]);
        }
        setActiveModal(null);
        setIsEditConfirmOpen(false);
    };

    const handleCancel = () => {
        if (editingWarden) {
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

    const handleExport = () => {
        // Implement export logic (currently missing)
        alert('Exporting data...');
        setIsExportConfirmOpen(false);
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
                    initiateExport={initiateExport}
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
                AVAILABLE_HOSTELS={AVAILABLE_HOSTELS}
                isEmailVerified={isEmailVerified}
                setIsOtpModalOpen={setIsOtpModalOpen}
                setOtpSource={setOtpSource}
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
                            Are you sure you want to download the warden list?
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
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-[#083663] transition-colors cursor-pointer"
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

                                    placeholder="Enter your new email"
                                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0A437A]"
                                />
                                {isEmailVerified ? (
                                    <button type="button" className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-default">
                                        <Check size={16} /> Verified
                                    </button>
                                ) : (
                                    <button type="button" onClick={() => { setIsEmailChangeModalOpen(false); setOtpSource('emailChange'); setIsOtpModalOpen(true); }} className="px-6 py-2.5 bg-[#0A437A] text-white text-sm font-medium rounded-lg hover:bg-[#083663] transition-colors cursor-pointer">
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
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        setIsOtpModalOpen(false);
                        setIsEmailVerified(true);
                        if (otpSource === 'emailChange') {
                            setIsEmailChangeModalOpen(true);
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
                            A 6-digit code was send to <span className="text-[#0A437A]">{emailChangeForm || '@usergmail.com'}</span>
                        </p>
                        <p className="text-red-500 text-[15px] mb-10">Expires in 10 minutes</p>

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
                            Didn't receive it ? <button type="button" className="text-[#0A437A] cursor-pointer hover:underline font-semibold">Resend the code</button>
                        </p>

                        {/* Verify Button */}
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
        </div>
    );
}

