import React, { useState, useMemo } from 'react';
import WardenHeader from '../components/Warden/WardenHeader';
import WardenToolbar from '../components/Warden/WardenToolbar';
import WardenTable from '../components/Warden/WardenTable';
import WardenMobileList from '../components/Warden/WardenMobileList';
import WardenPagination from '../components/Warden/WardenPagination';
import WardenDetailView from '../components/Warden/WardenDetailView';
import WardenFormModal from '../components/Warden/WardenFormModal';
import { Pencil } from 'lucide-react';

const INITIAL_WARDENS = [
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

const AVAILABLE_HOSTELS = [
    'Kmct Hostel 1', 'Kmct Hostel 2', 'Kmct Hostel 3', 'Kmct Hostel 4', 'Kmct Hostel 5',
    'Kmct Hostel 6', 'Kmct Hostel 7', 'Kmct Hostel 8', 'Kmct Hostel 9', 'Kmct Hostel 10'
];

export default function WardenManagement() {
    // State management
    const [wardens, setWardens] = useState(INITIAL_WARDENS);
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
    const filteredWardens = useMemo(() => {
        return wardens.filter(warden => {
            const matchesSearch =
                warden.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                warden.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                warden.phone.includes(searchQuery);

            const matchesStatus = statusFilter === 'All' || warden.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [wardens, searchQuery, statusFilter]);

    const totalPages = Math.ceil(filteredWardens.length / itemsPerPage) || 1;

    const paginatedWardens = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredWardens.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredWardens, currentPage]);

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
        setIsEmailChangeModalOpen(true);
    };

    const confirmEmailChange = (e) => {
        e.preventDefault();
        setWardens(wardens.map(w => w.id === emailChangeWardenId ? { ...w, email: emailChangeForm } : w));

        if (selectedWardenDetail && selectedWardenDetail.id === emailChangeWardenId) {
            setSelectedWardenDetail({ ...selectedWardenDetail, email: emailChangeForm });
        }

        setIsEmailChangeModalOpen(false);
        setEmailChangeWardenId(null);
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
                    paginatedWardens={paginatedWardens}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    setSelectedWardenDetail={setSelectedWardenDetail}
                    setView={setView}
                    handleHostelChange={handleHostelChange}
                    AVAILABLE_HOSTELS={AVAILABLE_HOSTELS}
                    handleStatusChangeClick={handleStatusChangeClick}
                    openEditWardenModal={openEditWardenModal}
                />

                <WardenMobileList
                    paginatedWardens={paginatedWardens}
                    selectedIds={selectedIds}
                    handleSelectRow={handleSelectRow}
                    setSelectedWardenDetail={setSelectedWardenDetail}
                    setView={setView}
                    handleStatusChangeClick={handleStatusChangeClick}
                    openEditWardenModal={openEditWardenModal}
                />

                <WardenPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalWardens={filteredWardens.length}
                    itemsPerPage={itemsPerPage}
                    setCurrentPage={setCurrentPage}
                />
            </div>

            <WardenFormModal
                activeModal={activeModal}
                setActiveModal={setActiveModal}
                editingWarden={editingWarden}
                handleSaveWarden={handleSaveWarden}
                handleCancel={handleCancel}
                AVAILABLE_HOSTELS={AVAILABLE_HOSTELS}
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
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <form onSubmit={confirmEmailChange} className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-bold text-gray-900"><Pencil /></h3>
                        <p className="text-xs text-gray-500 mt-1 mb-4">
                            Please enter the new email address for this warden.
                        </p>
                        <input
                            type="email"
                            required
                            value={emailChangeForm}
                            onChange={(e) => setEmailChangeForm(e.target.value)}
                            placeholder="Enter new email"
                            className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A] mb-6"
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setIsEmailChangeModalOpen(false)}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-[#083663] transition-colors cursor-pointer"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
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

