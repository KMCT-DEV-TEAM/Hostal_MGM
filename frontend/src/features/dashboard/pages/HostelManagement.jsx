import React, { useState, useMemo } from 'react';
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
    Loader2
} from 'lucide-react';
import hostelService from '../../../services/hostel.service';
import * as XLSX from 'xlsx';



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
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState(null);
    const [isBulkStatusConfirmOpen, setIsBulkStatusConfirmOpen] = useState(false);
    const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState(null);

    const [view, setView] = useState('list'); // 'list' or 'detail'
    const [selectedHostelDetail, setSelectedHostelDetail] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
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
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    // const handleDeleteHostel = (id) => {
    //     if (window.confirm("Are you sure you want to delete this hostel?")) {
    //         setHostels(hostels.filter(h => h.id !== id));
    //         setSelectedIds(selectedIds.filter(item => item !== id));
    //     }
    // };

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
            } else {
                await hostelService.createHostel(payload);
            }
            setActiveModal(null);
            setIsEditConfirmOpen(false);
            fetchHostels();
        } catch (error) {
            console.error("Failed to save hostel:", error);
            alert("Failed to save hostel. Please try again.");
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
            fetchHostels(); // refresh after update
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update status.");
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
            setSelectedIds([]); // clear selection
            setIsBulkStatusConfirmOpen(false);
            setBulkStatusToUpdate(null);
            fetchHostels(); // refresh table
        } catch (error) {
            console.error("Failed to bulk update status:", error);
            alert("Failed to bulk update status. Please try again.");
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            const res = await hostelService.getHostels({
                limit: 0,
                status: statusFilter,
                search: debouncedSearch
            });
            const dataToExport = res.data || [];

            if (dataToExport.length === 0) {
                alert("No data available to export.");
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

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Hostels");
            XLSX.writeFile(workbook, "Hostels_List.xlsx");
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export data. Please try again.");
        } finally {
            setLoading(false);
            fetchHostels();
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
                <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200">
                    {/* Close Button */}
                    <button
                        onClick={() => setView('list')}
                        className="absolute top-6 right-6 p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <X size={14} />
                    </button>

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 bg-[#0A437A] rounded-lg flex items-center justify-center text-white">
                                <Building2 size={18} />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">{selectedHostelDetail.name}</h1>
                        </div>
                        <p className="text-gray-400 text-sm ml-11">Hostel - {selectedHostelDetail.capacity} Students</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Main Content Area */}
                        <div className="md:col-span-2 space-y-4">
                            {/* Basic Info Section */}
                            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                <h3 className="text-lg font-semibold text-primary mb-4">Basic Info</h3>
                                <p className="text-xs text-gray-400 mb-6">Basic contact information of the Hostel</p>
                                <div className="grid grid-cols-2 gap-y-4">
                                    <div className="text-sm"><span className="text-gray-500">Hostel Name</span></div>
                                    <div className="text-sm font-medium text-gray-900">: {selectedHostelDetail.name}</div>

                                    <div className="text-sm"><span className="text-gray-500">Hostel Code</span></div>
                                    <div className="text-sm font-medium text-gray-900">: {selectedHostelDetail.code || 'N/A'}</div>

                                    <div className="text-sm"><span className="text-gray-500">Hostel Type</span></div>
                                    <div className="text-sm font-medium text-gray-900 text-capitalize">: {selectedHostelDetail.hosteltype || 'N/A'}</div>

                                    <div className="text-sm"><span className="text-gray-500">Email</span></div>
                                    <div className="text-sm font-medium text-gray-900">: {selectedHostelDetail.email || 'N/A'}</div>

                                    <div className="text-sm"><span className="text-gray-500">Phone Number</span></div>
                                    <div className="text-sm font-medium text-gray-900">: {selectedHostelDetail.phone ? `+91 ${selectedHostelDetail.phone}` : 'N/A'}</div>

                                    <div className="text-sm"><span className="text-gray-500">Location</span></div>
                                    <div className="text-sm font-medium text-gray-900">: {selectedHostelDetail.location || 'N/A'}</div>

                                    <div className="text-sm"><span className="text-gray-500">Capacity</span></div>
                                    <div className="text-sm font-medium text-gray-900">: {selectedHostelDetail.capacity || 'N/A'}</div>

                                    <div className="text-sm"><span className="text-gray-500">Status</span></div>
                                    <div className="flex items-center text-sm font-medium text-gray-900">
                                        : <span className="ml-2 flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${selectedHostelDetail.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>{selectedHostelDetail.isActive ? 'Active' : 'Inactive'}</span>
                                    </div>
                                </div>
                            </div>


                        </div>

                        {/* Right Summary Sidebar */}
                        <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 h-fit">
                            <h3 className="text-lg font-semibold text-primary mb-6">Hostel Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm"><span className="text-gray-500">Hostel Name</span> <span className="font-medium text-gray-900">{selectedHostelDetail.name}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-500">Hostel Type</span> <span className="font-medium text-gray-900">{selectedHostelDetail.hosteltype}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span> <span className="font-medium text-gray-900 flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${selectedHostelDetail.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>{selectedHostelDetail.isActive ? 'Active' : 'Inactive'}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-500">Capacity</span> <span className="font-medium text-gray-900">{selectedHostelDetail.capacity}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full min-h-screen bg-[#F8FAFC] p-6 text-gray-700 font-sans relative">

            {/* ==========================================
             HEADER ACTION SECTION
             ========================================== */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hostel</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Manage all hostel</p>
                </div>

                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={() => handleBulkStatusClick(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-[#0A437A] text-[#0A437A] bg-blue-50/40 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                        >
                            Active ({selectedIds.length})
                        </button>
                    )}

                    {selectedIds.length > 0 && (
                        <button
                            onClick={() => handleBulkStatusClick(false)}
                            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-danger bg-red-50/40 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                        >
                            Inactive({selectedIds.length})
                        </button>
                    )}
                </div>
            </div>

            {/* ==========================================
             FILTER & UTILITY TOOLBAR
             ========================================== */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm mb-6">
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50">
                    <div className="relative inline-block w-28">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1); // Reset to first page when filter changes
                            }}
                            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A437A] text-gray-600 pr-8 font-medium cursor-pointer"
                        >
                            <option value="All">All</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                    </div>

                    <div className="flex items-center gap-3 flex-1 justify-end">
                        <div className="relative w-full max-w-xs">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search Name, Email or Phone..."

                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none placeholder-gray-400"
                            />
                        </div>
                        <button
                            onClick={initiateExport}
                            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={openAddHostelModal}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg hover:bg-[#083561] transition-colors text-sm font-medium shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add New
                        </button>
                    </div>
                </div>

                {/* ==========================================
                DATA TABLE LAYOUT
                ========================================== */}
                <div className="overflow-auto max-h-[calc(100vh-160px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#FAFBFD] border-b border-gray-100 text-gray-400 text-xs tracking-wider uppercase font-semibold">
                                <th className="p-4 w-12 text-center">
                                    <button onClick={handleSelectAll} className="focus:outline-none text-gray-300 hover:text-gray-500">
                                        {hostels.length > 0 && hostels.every(h => selectedIds.includes(h._id)) ? (
                                            <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                </th>

                                <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">
                                    Name
                                </th>
                                <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">
                                    Email
                                </th>
                                <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">
                                    Phone
                                </th>
                                <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">
                                    Type
                                </th>

                                <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">
                                    Capacity
                                </th>

                                <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">
                                    Students
                                </th>

                                <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">
                                    Status
                                </th>
                                <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm text-center">
                            {loading ? (
                                <td colSpan="7" className="p-8 text-start text-gray-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0A437A]" />
                                    Loading hostels...
                                </td>
                            ) : error ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-start text-red-500">{error}</td>
                                </tr>
                            ) : hostels.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-start text-gray-400">No records found matching your search criteria.</td>
                                </tr>
                            ) : (
                                hostels.map((hostel) => {
                                    const isSelected = selectedIds.includes(hostel._id);
                                    return (
                                        <tr key={hostel._id} className={`hover:bg-gray-50/40 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                                            <td className="p-4 text-center">
                                                <button onClick={() => handleSelectRow(hostel._id)} className="focus:outline-none text-gray-300">
                                                    {isSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                                    ) : (
                                                        <Square className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="p-4 font-medium text-[#777777]">
                                                <div
                                                    className="flex items-center gap-3 cursor-pointer hover:text-[#0A437A]"
                                                    onClick={() => {
                                                        setSelectedHostelDetail(hostel);
                                                        setView('detail');
                                                    }}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                        {hostel.name ? hostel.name.substring(0, 2) : 'NA'}
                                                    </div>
                                                    <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors">{hostel.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-start text-gray-500">
                                                {hostel.email}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-start justify-start gap-1.5 text-gray-500">
                                                    <Phone size={14} className="text-gray-400" />
                                                    <span>{hostel.phone || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-start text-gray-500">
                                                {hostel.hosteltype}
                                            </td>
                                            <td className="p-4 text-center text-gray-500">
                                                {hostel.capacity}
                                            </td>
                                            <td className="p-4 text-center text-gray-500">
                                                0
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="relative inline-block mx-auto">
                                                    <select
                                                        value={hostel.isActive ? 'Active' : 'Inactive'}
                                                        onChange={() => handleStatusChangeClick(hostel._id, hostel.isActive)}
                                                        className={`appearance-none rounded-full px-3 py-1 text-xs pr-7 focus:outline-none border cursor-pointer transition-colors ${hostel.isActive
                                                            ? 'bg-green-50 text-success border-green-100 hover:bg-green-100/70'
                                                            : 'bg-red-50 text-danger border-red-100 hover:bg-red-100/70'
                                                            }`}
                                                    >
                                                        <option value="Active">Active</option>
                                                        <option value="Inactive">Inactive</option>
                                                    </select>
                                                    <ChevronDown className={`w-3 h-3 absolute right-2 top-2.5 pointer-events-none ${hostel.isActive ? 'text-green-600' : 'text-red-500'}`} />
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-3 text-gray-400">

                                                    <button onClick={() => openEditHostelModal(hostel)} className="text-secondary cursor-pointer transition-colors" title="Edit row item">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION BAR FOOTER */}
                <div className="p-4 bg-white border-t border-gray-50 flex items-center justify-between text-xs font-medium text-gray-500">
                    <div>
                        Showing {totalHostels === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(currentPage * itemsPerPage, totalHostels)} of {totalHostels} entries
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
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
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
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
                                className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Form Sections */}
                        <div className="space-y-6">
                            <section>
                                <div className="border-b border-gray-100 mb-4" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
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
                                                onChange={(e) => setHostelForm({ ...hostelForm, phone: e.target.value })}
                                                type="text"
                                                required
                                                placeholder="9876543210"
                                                className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-2">
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
                                        <div className="relative">
                                            <select
                                                required
                                                value={hostelForm.hosteltype}
                                                onChange={(e) => setHostelForm({ ...hostelForm, hosteltype: e.target.value })}
                                                className="w-full appearance-none px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A] cursor-pointer"
                                            >
                                                <option value="" disabled>Select Type</option>
                                                <option value="boys">Boys</option>
                                                <option value="girls">Girls</option>
                                            </select>
                                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                                        </div>
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
                                    {/* {!editingHostel && (
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-black mb-2">
                                                Account Status <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex items-center gap-6">
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="status"
                                                        value="Active"
                                                        checked={hostelForm.status === "Active"}
                                                        onChange={(e) => setHostelForm({ ...hostelForm, status: e.target.value })}
                                                        className="w-5 h-5 accent-black cursor-pointer"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Active</span>
                                                </label>
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="status"
                                                        value="Inactive"
                                                        checked={hostelForm.status === "Inactive"}
                                                        onChange={(e) => setHostelForm({ ...hostelForm, status: e.target.value })}
                                                        className="w-5 h-5 accent-black cursor-pointer"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Inactive</span>
                                                </label>
                                            </div>
                                        </div>
                                    )} */}
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
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingHostel ? 'Save changes' : 'Save')}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-primary hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                        </div>
                    </form>
                </div>
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
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveHostel}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-[#083663] transition-colors"
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
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Continue Editing
                            </button>
                            <button
                                onClick={confirmDiscard}
                                className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
                            Are you sure you want to download the organization list?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setIsExportConfirmOpen(false)}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleExport();
                                    setIsExportConfirmOpen(false);
                                }}
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-[#083663] transition-colors"
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
                            Are you sure you want to change the status of this hostel?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setIsStatusConfirmOpen(false);
                                    setStatusToUpdate(null);
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmStatusChange}
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-[#083663] transition-colors"
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
                        <h3 className="text-sm font-bold text-gray-900">Bulk Change Status</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to change the status for the {selectedIds.length} selected hostel(s)?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setIsBulkStatusConfirmOpen(false);
                                    setBulkStatusToUpdate(null);
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmBulkStatusChange}
                                className="px-3 py-1.5 text-xs font-medium bg-[#0A437A] text-white rounded-lg hover:bg-[#083663] transition-colors"
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

