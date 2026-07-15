import React, { useState, useMemo, useRef } from 'react';
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
    Building2,
    Loader2,
    Mail,
    Hash,
    Users,
    MapPin,
    ToggleRight,
    FileDown
} from 'lucide-react';
import hostelService from '../../../services/hostel.service';
import InfoRow from '@/components/ui/InfoRow';
import { exportToExcel } from '@/utils/exportUtils';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { initSocket } from '@/services/socket.service';
import * as XLSX from 'xlsx';

import HostelHeader from '../components/Hostel/HostelHeader';
import HostelToolbar from '../components/Hostel/HostelToolbar';
import HostelTable from '../components/Hostel/HostelTable';
import HostelMobileList from '../components/Hostel/HostelMobileList';
import HostelFormModal from '../components/Hostel/HostelFormModal';
import HostelDetailView from '../components/Hostel/HostelDetailView';
import HostelPagination from '../components/Hostel/HostelPagination';
import Dropdown from '@/components/ui/Dropdown';
import ExportFilterModal from '@/components/ui/ExportFilterModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useTranslation } from '@/hooks/useTranslation';

const AVAILABLE_HOSTELS = [
    'Kmct Hostel 1', 'Kmct Hostel 2', 'Kmct Hostel 3', 'Kmct Hostel 4', 'Kmct Hostel 5',
    'Kmct Hostel 6', 'Kmct Hostel 7', 'Kmct Hostel 8', 'Kmct Hostel 9', 'Kmct Hostel 10'
];

export default function HostelManagement() {
    const { t } = useTranslation();
    // State management
    const [hostels, setHostels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [activeModal, setActiveModal] = useState(null);
    const [editingHostel, setEditingHostel] = useState(null); // Holds object being edited
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isAddConfirmOpen, setIsAddConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState(null);
    const [isBulkStatusConfirmOpen, setIsBulkStatusConfirmOpen] = useState(false);
    const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    const [view, setView] = useState('list'); // 'list' or 'detail'
    const [selectedHostelDetail, setSelectedHostelDetail] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [totalPages, setTotalPages] = useState(1);
    const [totalHostels, setTotalHostels] = useState(0);

    const [hostelForm, setHostelForm] = useState({
        name: "",
        code: "",
        email: "",
        phone: "",
        location: "",
        capacity: "",
        hosteltype: "",
        status: "Active"
    });

    const tableContainerRef = useRef(null);

    const handlePageChange = (pageNum) => {
        setCurrentPage(pageNum);
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const fetchHostels = async () => {
        try {
            setLoading(true);
            const res = await hostelService.getHostels({
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearch,
                status: statusFilter
            });
            if (res && res.data) {
                setHostels(res.data);
                setTotalPages(res.totalPages || 1);
                setTotalHostels(res.totalCount || 0);
            }
        } catch (err) {
            console.error("Failed to fetch hostels:", err);
            setError("Failed to fetch hostels. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // Reset to first page on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    React.useEffect(() => {
        fetchHostels();
    }, [currentPage, statusFilter, debouncedSearch]);

    React.useEffect(() => {
        const socket = initSocket();
        
        const handleHostelEvent = () => {
            fetchHostels();
        };

        socket.on('hostelCreated', handleHostelEvent);
        socket.on('hostelUpdated', handleHostelEvent);
        socket.on('hostelDeleted', handleHostelEvent);

        return () => {
            socket.off('hostelCreated', handleHostelEvent);
            socket.off('hostelUpdated', handleHostelEvent);
            socket.off('hostelDeleted', handleHostelEvent);
        };
    }, []);

    // ==========================================
    // SELECTION & ACTION HANDLERS
    // ==========================================
    const handleSelectAll = (mobileIds) => {
        const currentVisibleIds = (Array.isArray(mobileIds) && typeof mobileIds[0] === 'string') ? mobileIds : hostels.map(h => h._id);
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

    const handleDeleteSelected = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} hostel(s)?`)) {
            setHostels(hostels.filter(h => !selectedIds.includes(h.id)));
            setSelectedIds([]);
            setCurrentPage(1);
        }
    };

    const handleSaveHostel = (e) => {
        e.preventDefault();
        if (editingHostel) {
            setIsEditConfirmOpen(true);
        } else {
            setIsAddConfirmOpen(true);
        }
    };

    const saveHostel = async () => {
        try {
            setIsSubmitting(true);
            const payload = {
                ...hostelForm,
                capacity: Number(hostelForm.capacity),
            };
            if (editingHostel) {
                // Update Existing Record
                const res = await hostelService.updateHostel(editingHostel._id, {
                    code: hostelForm.code,
                    name: hostelForm.name,
                    phone: hostelForm.phone,
                    email: hostelForm.email,
                    hosteltype: hostelForm.type,
                    capacity: hostelForm.capacity,
                    location: hostelForm.location
                });
                
                let updatedHostel = { ...res.data };
                const currentStatus = editingHostel.isActive ? 'Active' : 'Inactive';
                if (hostelForm.status !== currentStatus) {
                    await hostelService.bulkToggleStatus({ ids: [editingHostel._id], isActive: hostelForm.status === 'Active' });
                    updatedHostel.isActive = hostelForm.status === 'Active';
                }

                showSuccessToast('Hostel Updated', 'Hostel details saved successfully');
            } else {
                await hostelService.createHostel(payload);
                showSuccessToast('Hostel Added', 'New hostel registered successfully');
            }
            setActiveModal(null);
            setIsEditConfirmOpen(false);
            fetchHostels();
        } catch (error) {
            console.error("Failed to save hostel:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to save hostel. Please try again.');
        } finally {
            setIsSubmitting(false);
            setIsAddConfirmOpen(false);
        }
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

    const handleStatusChangeClick = (id, currentStatus) => {
        setStatusToUpdate({ id, currentStatus });
        setIsStatusConfirmOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!statusToUpdate) return;
        try {
            setIsConfirming(true);
            const res = await hostelService.toggleStatus(statusToUpdate.id);
            if (res && (res.success || res.data)) {
                const newStatus = !statusToUpdate.currentStatus;
                setHostels(hostels.map(h => 
                    h._id === statusToUpdate.id ? { ...h, isActive: newStatus } : h
                ));
                showSuccessToast('Status Updated', res?.message || 'Hostel status changed successfully');
            }
            fetchHostels(); // refresh after update
        } catch (error) {
            console.error("Failed to update status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to update status.');
        } finally {
            setIsStatusConfirmOpen(false);
            setStatusToUpdate(null);
            setIsConfirming(false);
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
            const res = await hostelService.bulkToggleStatus({ ids: selectedIds, isActive: bulkStatusToUpdate });
            if (res && (res.success || res.data)) {
                setHostels(hostels.map(h => {
                    if (selectedIds.includes(h._id)) {
                        return { ...h, isActive: bulkStatusToUpdate };
                    }
                    return h;
                }));
                const action = bulkStatusToUpdate ? 'Activated' : 'Deactivated';
                showSuccessToast('Bulk Status Updated', res?.message || `Successfully ${action.toLowerCase()} ${selectedIds.length} hostels`);
            }
        } catch (error) {
            console.error("Failed to bulk update status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to update bulk status.');
        } finally {
            setSelectedIds([]); // Clear selection after bulk update
            setIsBulkStatusConfirmOpen(false);
            setBulkStatusToUpdate(null);
            setIsConfirming(false);
            fetchHostels();
        }
    };

    const confirmExport = async (exportFilters) => {
        setIsExporting(true);
        try {
            const params = { limit: 100000 };
            if (debouncedSearch) params.search = debouncedSearch;

            // Allow export modal filter to override table filter completely
            if (exportFilters.isActive === 'true') {
                params.status = 'Active';
            } else if (exportFilters.isActive === 'false') {
                params.status = 'Inactive';
            } else {
                delete params.status;
            }

            const res = await hostelService.getHostels(params);
            const responseData = res?.data || res;
            const dataToExport = responseData?.data || responseData || [];

            if (dataToExport.length === 0) {
                showErrorToast('Export Failed', 'No data available to export matching the filters.');
                return;
            }

            const exportData = dataToExport.map((hostel, index) => ({
                "Sl No": index + 1,
                "Name": hostel.name,
                "Code": hostel.code || "N/A",
                "Email": hostel.email,
                "Phone": hostel.phone || "N/A",
                "Type": hostel.hosteltype || "N/A",
                "Capacity": hostel.capacity,
                "Location": hostel.location || "N/A",
                "Status": hostel.isActive ? "Active" : "Inactive",
                "Created At": new Date(hostel.createdAt).toLocaleDateString()
            }));

            const isSuccess = exportToExcel(exportData, "Hostels_Export", "Hostels");

            if (isSuccess) {
                showSuccessToast('Export Successful', 'The hostel list has been downloaded.');
            } else {
                showErrorToast('Export Failed', 'Could not generate the Excel file.');
            }
        } catch (error) {
            console.error("Export failed:", error);
            showErrorToast('Export Failed', error?.message || 'Failed to export data. Please try again.');
        } finally {
            setIsExportConfirmOpen(false);
            setIsExporting(false);
        }
    };

    const handleHostelChange = (id, newHostel) => {
        setHostels(hostels.map(h => h.id === id ? { ...h, hostel: newHostel } : h));
    };

    // ==========================================
    // MODAL OPEN / SUBMIT HANDLERS
    // ==========================================
    const openAddHostelModal = () => {
        setEditingHostel(null);
        setHostelForm({
            name: "",
            code: "",
            email: "",
            phone: "",
            location: "",
            capacity: "",
            hosteltype: "",
            status: "Active"
        });
        setActiveModal('hostel');
    };

    const openEditHostelModal = (hostel) => {
        setEditingHostel(hostel);
        setHostelForm({ ...hostel });
        setActiveModal('hostel');
    };

    // ==========================================
    const renderDetailView = () => {
        if (!selectedHostelDetail) return null;

        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-end md:items-center justify-center p-0 md:p-4 z-50">
                <div className="bg-white rounded-t-2xl md:rounded-2xl rounded-b-none md:rounded-b-2xl max-w-5xl w-full p-5 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                    {/* Close Button */}
                    <button
                        onClick={() => setView('list')}
                        className="absolute top-6 right-6 p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <X size={14} />
                    </button>

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#0A437A] rounded-xl flex items-center justify-center text-white">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{selectedHostelDetail.name}</h1>
                                <p className="text-gray-400 text-sm">Hostel - {selectedHostelDetail.capacity} Students</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                        {/* Main Content Area */}
                        <div className="md:col-span-7 flex flex-col">
                            {/* Basic Info Section */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex-1">
                                <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Basic Info</h3>
                                <p className="text-[11px] text-text-secondary mb-4">Basic contact information of the Hostel</p>
                                <div className="space-y-1">
                                    <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Name</>}>{selectedHostelDetail.name}</InfoRow>
                                    <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Type</>}><span className="capitalize">{selectedHostelDetail.hosteltype || 'N/A'}</span></InfoRow>
                                    <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedHostelDetail.phone ? `+91 ${selectedHostelDetail.phone}` : 'N/A'}</InfoRow>
                                    <InfoRow label={<><Users className="w-4 h-4 text-gray-400" /> Capacity</>}>{selectedHostelDetail.capacity || 'N/A'}</InfoRow>
                                    <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                        <span className="flex items-center">
                                            <span className={`w-2 h-2 rounded-full ${selectedHostelDetail.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                            {selectedHostelDetail.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </InfoRow>
                                </div>
                            </div>
                        </div>

                        {/* Right Summary Sidebar */}
                        <div className="md:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm md:h-full">
                            <h3 className="text-sm font-semibold text-[#0A437A] mb-4">Hostel Summary</h3>
                            <div className="space-y-1">
                                <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Name</>}>{selectedHostelDetail.name}</InfoRow>
                                <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400" /> Type</>}><span className="capitalize">{selectedHostelDetail.hosteltype}</span></InfoRow>
                                <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                    <span className="flex items-center">
                                        <span className={`w-2 h-2 rounded-full ${selectedHostelDetail.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                        {selectedHostelDetail.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </InfoRow>
                                <InfoRow label={<><Users className="w-4 h-4 text-gray-400" /> Capacity</>}>{selectedHostelDetail.capacity}</InfoRow>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">

            <HostelHeader 
                selectedIds={selectedIds}
                handleBulkStatusClick={handleBulkStatusClick}
            />

            {/* ==========================================
             FILTER & UTILITY TOOLBAR
             ========================================== */}
            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0">
                <HostelToolbar
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    setCurrentPage={setCurrentPage}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    initiateExport={initiateExport}
                    openAddHostelModal={openAddHostelModal}
                    selectedIds={selectedIds}
                    handleBulkStatusClick={handleBulkStatusClick}
                />

                <HostelTable
                    hostels={hostels}
                    loading={loading}
                    error={error}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    setSelectedHostelDetail={setSelectedHostelDetail}
                    setView={setView}
                    handleStatusChangeClick={handleStatusChangeClick}
                    openEditHostelModal={openEditHostelModal}
                    tableContainerRef={tableContainerRef}
                />

                <HostelMobileList
                    currentPage={currentPage}
                    totalPages={totalPages}
                    hasMore={currentPage < totalPages}
                    onLoadMore={() => setCurrentPage(prev => prev + 1)}
                    hostels={hostels}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    setSelectedHostelDetail={setSelectedHostelDetail}
                    setView={setView}
                    openEditHostelModal={openEditHostelModal}
                    handleStatusChangeClick={handleStatusChangeClick}
                    loading={loading}
                    error={error}
                />

                <HostelPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalHostels={totalHostels}
                    itemsPerPage={itemsPerPage}
                    handlePageChange={handlePageChange}
                />
            </div>

            {/* ==========================================
             MODAL 1: HOSTEL (ADD & EDIT WORKFLOWS)
             ========================================== */}
            
            <HostelFormModal
                activeModal={activeModal}
                handleCancel={handleCancel}
                editingHostel={editingHostel}
                handleSaveHostel={handleSaveHostel}
                hostelForm={hostelForm}
                setHostelForm={setHostelForm}
                isSubmitting={isSubmitting}
            />

            
            {/* Confirmation Modal for Edit */}
            <ConfirmationModal
                isOpen={isEditConfirmOpen}
                onClose={() => setIsEditConfirmOpen(false)}
                onConfirm={saveHostel}
                title="Save Changes"
                message="Are you sure you want to save the changes made to this hostel?"
                confirmText="Save Changes"
                loadingText={<Loader2 size={14} className="animate-spin mx-auto" />}
                isSubmitting={isSubmitting}
                cancelText="Cancel"
                confirmButtonClass="bg-[#0A437A] text-white hover:bg-[#083663] min-w-[110px]"
            />

            {/* Confirmation Modal for Add */}
            <ConfirmationModal
                isOpen={isAddConfirmOpen}
                onClose={() => setIsAddConfirmOpen(false)}
                onConfirm={saveHostel}
                title="Add Hostel"
                message="Are you sure you want to add this new hostel?"
                confirmText="Add Hostel"
                loadingText={<Loader2 size={14} className="animate-spin mx-auto" />}
                isSubmitting={isSubmitting}
                cancelText="Cancel"
                confirmButtonClass="bg-[#0A437A] text-white hover:bg-[#083663] min-w-[100px]"
            />

            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Hostels Data"
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

            {isDiscardConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-xl rounded-b-none shadow-xl w-full max-w-sm p-5 animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200">
                        <h3 className="text-sm font-bold text-gray-900 cursor-pointer">Discard Changes</h3>
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
                                className="px-3 cursor-pointer py-1.5 text-xs font-medium bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors"
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
                            Are you sure you want to change the status of this hostel?
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
                            Are you sure you want to set the status of {selectedIds.length} hostel(s) to <strong>{bulkStatusToUpdate ? 'Active' : 'Inactive'}</strong>?
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


            {view === 'detail' && renderDetailView()}
        </div>
    );
}

