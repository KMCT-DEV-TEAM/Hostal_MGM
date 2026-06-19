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
    Activity,
    FileDown
} from 'lucide-react';
import hostelService from '../../../services/hostel.service';
import { exportToExcel } from '@/utils/exportUtils';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import * as XLSX from 'xlsx';

import HostelHeader from '../components/Hostel/HostelHeader';
import HostelToolbar from '../components/Hostel/HostelToolbar';
import HostelTable from '../components/Hostel/HostelTable';
import HostelPagination from '../components/Hostel/HostelPagination';
import Dropdown from '@/components/ui/Dropdown';
import ExportFilterModal from '@/components/ui/ExportFilterModal';



const AVAILABLE_HOSTELS = [
    'Kmct Hostel 1', 'Kmct Hostel 2', 'Kmct Hostel 3', 'Kmct Hostel 4', 'Kmct Hostel 5',
    'Kmct Hostel 6', 'Kmct Hostel 7', 'Kmct Hostel 8', 'Kmct Hostel 9', 'Kmct Hostel 10'
];

export default function HostelManagement() {
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
    const [isExporting, setIsExporting] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState(null);
    const [isBulkStatusConfirmOpen, setIsBulkStatusConfirmOpen] = useState(false);
    const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    // ==========================================
    // SELECTION & ACTION HANDLERS
    // ==========================================
    const handleSelectAll = () => {
        const currentVisibleIds = hostels.map(h => h._id);
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
            saveHostel();
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
                await hostelService.updateHostel(editingHostel._id, payload);
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
        }
    };

    const handleCancel = () => {
        if (editingHostel) {
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

    const handleStatusChangeClick = (id, currentStatus) => {
        setStatusToUpdate({ id, currentStatus });
        setIsStatusConfirmOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!statusToUpdate) return;
        try {
            await hostelService.toggleStatus(statusToUpdate.id);
            setIsStatusConfirmOpen(false);
            setStatusToUpdate(null);
            showSuccessToast('Status Updated', 'Hostel status changed successfully');
            fetchHostels(); // refresh after update
        } catch (error) {
            console.error("Failed to update status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to update status.');
        }
    };

    const handleBulkStatusClick = (isActive) => {
        setBulkStatusToUpdate(isActive);
        setIsBulkStatusConfirmOpen(true);
    };

    const confirmBulkStatusChange = async () => {
        if (selectedIds.length === 0 || bulkStatusToUpdate === null) return;
        try {
            setLoading(true);
            await hostelService.bulkToggleStatus({ ids: selectedIds, isActive: bulkStatusToUpdate });
            const action = bulkStatusToUpdate ? 'Activated' : 'Deactivated';
            showSuccessToast('Bulk Status Updated', `Successfully ${action.toLowerCase()} ${selectedIds.length} hostels`);
            setSelectedIds([]); // clear selection
            setIsBulkStatusConfirmOpen(false);
            setBulkStatusToUpdate(null);
            fetchHostels(); // refresh table
        } catch (error) {
            console.error("Failed to bulk update status:", error);
            showErrorToast('Action Failed', error?.message || 'Failed to bulk update status. Please try again.');
            setLoading(false);
        }
    };

    const confirmExport = async (exportFilters) => {
        setIsExporting(true);
        try {
            const params = { limit: 100000 };
            if (debouncedSearch) params.search = debouncedSearch;

            // Allow export modal filter to override table filter
            if (exportFilters.isActive !== '') {
                params.status = exportFilters.isActive === 'true' ? 'Active' : 'Inactive';
            } else if (statusFilter !== 'All') {
                params.status = statusFilter;
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
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-5xl w-full p-5 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Main Content Area */}
                        <div className="md:col-span-2 space-y-2">
                            {/* Basic Info Section */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-primary mb-1">Basic Info</h3>
                                <p className="text-xs text-gray-400 mb-6">Basic contact information of the Hostel</p>
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-400" /> Hostel Name</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedHostelDetail.name}</span></div>
                                    <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-400" /> Hostel Type</span> <span className="sm:col-span-2 font-medium text-capitalize"><span className="hidden sm:inline">: </span>{selectedHostelDetail.hosteltype || 'N/A'}</span></div>
                                    <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> Phone Number</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedHostelDetail.phone ? `+91 ${selectedHostelDetail.phone}` : 'N/A'}</span></div>
                                    <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-400" /> Capacity</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedHostelDetail.capacity || 'N/A'}</span></div>
                                    <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-start sm:items-center">
                                        <span className="text-gray-500 flex items-center gap-1.5"><Activity className="w-4 h-4 text-gray-400" /> Status</span>
                                        <span className="sm:col-span-2 font-medium flex items-center"><span className="hidden sm:inline mr-2">: </span>
                                            <span className={`w-2 h-2 rounded-full ${selectedHostelDetail.isActive ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                                            {selectedHostelDetail.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>


                        </div>

                        {/* Right Summary Sidebar */}
                        <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                            <h3 className="text-lg font-semibold text-primary mb-4">Hostel Summary</h3>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-400" /> Hostel Name</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedHostelDetail.name}</span></div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-400" /> Hostel Type</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedHostelDetail.hosteltype}</span></div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 items-start sm:items-center">
                                    <span className="text-gray-500 flex items-center gap-1.5"><Activity className="w-4 h-4 text-gray-400" /> Status</span>
                                    <span className="sm:col-span-2 font-medium flex items-center"><span className="hidden sm:inline mr-2">: </span>
                                        <span className={`w-2 h-2 rounded-full ${selectedHostelDetail.isActive ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                                        {selectedHostelDetail.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-400" /> Capacity</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedHostelDetail.capacity}</span></div>
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
            {activeModal === 'hostel' && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
                    <form
                        onSubmit={handleSaveHostel}
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{editingHostel ? 'Edit Hostel' : 'Add New Hostel'}</h2>
                                <p className="text-xs text-gray-400 mt-1">Fill in the details to manually {editingHostel ? 'update' : 'create a new'} hostel</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Form Sections */}
                        <div className="space-y-6">
                            <section>
                                <div className="border-b border-gray-100 mb-4" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="block text-[10px] font-medium text-black mb-1">Hostel Name *</label>
                                        <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 focus-within:border-[#0A437A]">
                                            <input
                                                type="text"
                                                required
                                                value={hostelForm.name}
                                                onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })}
                                                placeholder="Enter Hostel Name"
                                                className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-medium text-black mb-1">Hostel Code *</label>
                                        <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 focus-within:border-[#0A437A]">
                                            <input
                                                type="text"
                                                required
                                                value={hostelForm.code}
                                                onChange={(e) => setHostelForm({ ...hostelForm, code: e.target.value })}
                                                placeholder="e.g. KMCT001"
                                                className="w-full px-3 py-2 outline-none bg-transparent text-xs uppercase"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-medium text-black mb-1">Email *</label>
                                        <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 focus-within:border-[#0A437A]">
                                            <input
                                                name="email"
                                                value={hostelForm.email}
                                                onChange={(e) => setHostelForm({ ...hostelForm, email: e.target.value })}
                                                type="email"
                                                required
                                                placeholder="e.g. kmctboys@gmail.com"
                                                className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-medium text-black mb-1">Phone Number *</label>
                                        <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 focus-within:border-[#0A437A]">
                                            <div className="px-2 py-2 border-r border-gray-200 flex items-center gap-1 text-xs text-black bg-gray-50">
                                                <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-4 h-3" />
                                                +91
                                            </div>
                                            <input
                                                name="phone"
                                                value={hostelForm.phone}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '');
                                                    if (value.length <= 10) {
                                                        setHostelForm({ ...hostelForm, phone: value });
                                                    }
                                                }}
                                                type="text"
                                                required
                                                maxLength="10"
                                                pattern="[0-9]{10}"
                                                title="Please enter exactly 10 digits"
                                                placeholder="9876543210"
                                                className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="block text-[10px] font-medium text-black mb-1">Location *</label>
                                        <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 focus-within:border-[#0A437A]">
                                            <input
                                                type="text"
                                                required
                                                value={hostelForm.location}
                                                onChange={(e) => setHostelForm({ ...hostelForm, location: e.target.value })}
                                                placeholder="e.g. Kozhikode, Kerala"
                                                className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Hostel Type Field */}
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-medium text-black mb-1">Hostel type *</label>
                                        <Dropdown
                                            options={[
                                                { label: 'Boys', value: 'boys' },
                                                { label: 'Girls', value: 'girls' }
                                            ]}
                                            value={hostelForm.hosteltype}
                                            onChange={(val) => setHostelForm({ ...hostelForm, hosteltype: val })}
                                            placeholder="Select Type"
                                            minWidth="w-full"
                                            triggerClassName="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A] cursor-pointer"
                                        />
                                    </div>

                                    {/* Capacity Field */}
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-medium text-black mb-1">Capacity *</label>
                                        <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 focus-within:border-[#0A437A]">
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                value={hostelForm.capacity}
                                                onChange={(e) => setHostelForm({ ...hostelForm, capacity: e.target.value })}
                                                placeholder="e.g. 200"
                                                className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-50">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center justify-center min-w-[80px] px-4 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-[#083561] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin cursor-pointer" /> : (editingHostel ? 'Save changes' : 'Save')}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-primary hover:bg-gray-50 cursor-pointer"
                            >
                                Cancel
                            </button>

                        </div>
                    </form>
                </div>
            )}
            <ExportFilterModal
                isOpen={isExportConfirmOpen}
                onClose={() => setIsExportConfirmOpen(false)}
                onExport={confirmExport}
                isExporting={isExporting}
                title="Export Hostels Data"
            />
            {isEditConfirmOpen && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-bold text-gray-900 cursor-pointer">Save Changes</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6 cursor-pointer">
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
                                onClick={saveHostel}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-[#083663] transition-colors cursor-pointer"
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
                                className="px-3 cursor-pointer py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-[#083663] transition-colors cursor-pointer"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {view === 'detail' && renderDetailView()}
        </div>
    );
}

