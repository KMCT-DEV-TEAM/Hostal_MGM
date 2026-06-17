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
    Building2
} from 'lucide-react';

const INITIAL_HOSTEL = [
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

export default function HostelManagement() {
    // State management
    const [hostels, setHostels] = useState(INITIAL_HOSTEL);
    const [selectedIds, setSelectedIds] = useState([]);
    const [activeModal, setActiveModal] = useState(null);
    const [editingHostel, setEditingHostel] = useState(null); // Holds object being edited

    const [view, setView] = useState('list'); // 'list' or 'detail'
    const [selectedHostelDetail, setSelectedHostelDetail] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [hostelForm, setHostelForm] = useState({
        name: "",
        email: "",
        phone: "",
        hostel: AVAILABLE_HOSTELS[0],
        status: "Active"
    });



    const totalPages = Math.ceil(hostels.length / itemsPerPage);

    const paginatedHostels = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return hostels.slice(startIndex, startIndex + itemsPerPage);
    }, [hostels, currentPage]);

    // ==========================================
    // SELECTION & ACTION HANDLERS
    // ==========================================
    const handleSelectAll = () => {
        const currentVisibleIds = paginatedHostels.map(h => h.id);
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

    const handleDeleteHostel = (id) => {
        if (window.confirm("Are you sure you want to delete this hostel?")) {
            setHostels(hostels.filter(h => h.id !== id));
            setSelectedIds(selectedIds.filter(item => item !== id));
        }
    };

    const handleDeleteSelected = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} hostel(s)?`)) {
            setHostels(hostels.filter(h => !selectedIds.includes(h.id)));
            setSelectedIds([]);
            setCurrentPage(1);
        }
    };

    const handleStatusChange = (id, newStatus) => {
        setHostels(hostels.map(h => h.id === id ? { ...h, status: newStatus } : h));
    };

    const handleHostelChange = (id, newHostel) => {
        setHostels(hostels.map(h => h.id === id ? { ...h, hostel: newHostel } : h));
    };

    // ==========================================
    // MODAL OPEN / SUBMIT HANDLERS
    // ==========================================
    const openAddHostelModal = () => {
        setEditingHostel(null);
        setHostelForm({ name: '', email: '', phone: '', hostel: AVAILABLE_HOSTELS[0], status: 'Active' });
        setActiveModal('hostel');
    };

    const openEditHostelModal = (hostel) => {
        setEditingHostel(hostel);
        setHostelForm({ ...hostel });
        setActiveModal('hostel');
    };

    const handleSaveHostel = (e) => {
        e.preventDefault();
        if (!hostelForm.name || !hostelForm.email || !hostelForm.phone) {
            alert("Please fill in all required fields.");
            return;
        }

        if (editingHostel) {
            // Update Existing Record
            setHostels(hostels.map(h => h.id === editingHostel.id ? { ...h, ...hostelForm } : h));
        } else {
            // Create New Record
            const newHostel = {
                id: Date.now(),
                ...hostelForm
            };
            setHostels([newHostel, ...hostels]);
        }
        setActiveModal(null);
    };

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

                                    <div className="text-sm"><span className="text-gray-500">Hostel Type</span></div>
                                    <div className="text-sm font-medium text-gray-900">: {selectedHostelDetail.type}</div>
                                    {/* New Phone Number Row */}
                                    <div className="text-sm"><span className="text-gray-500">Phone Number</span></div>
                                    <div className="text-sm font-medium text-gray-900">: {selectedHostelDetail.phone}</div>

                                    <div className="text-sm"><span className="text-gray-500">Capacity</span></div>
                                    <div className="text-sm font-medium text-gray-900">: {selectedHostelDetail.capacity}</div>

                                    <div className="text-sm"><span className="text-gray-500">Status</span></div>
                                    <div className="flex items-center text-sm font-medium text-gray-900">
                                        : <span className="ml-2 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span>{selectedHostelDetail.status}</span>
                                    </div>
                                </div>
                            </div>


                        </div>

                        {/* Right Summary Sidebar */}
                        <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 h-fit">
                            <h3 className="text-lg font-semibold text-primary mb-6">Hostel Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm"><span className="text-gray-500">Hostel Name</span> <span className="font-medium text-gray-900">{selectedHostelDetail.name}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-500">Hostel Type</span> <span className="font-medium text-gray-900">{selectedHostelDetail.type}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span> <span className="font-medium text-gray-900 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span>{selectedHostelDetail.status}</span></div>
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
                            // Assuming you want to trigger a bulk status change here
                            onClick={() => { /* Implement bulk update logic */ }}
                            className="flex items-center gap-2 px-4 py-2 border border-[#0A437A] text-[#0A437A] bg-blue-50/40 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                        >
                            Active ({selectedIds.length})
                        </button>
                    )}

                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
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
                            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none text-gray-600 pr-8 font-medium"
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
                                placeholder="Search Name, Email or Phone..."

                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none placeholder-gray-400"
                            />
                        </div>
                        <button
                            onClick={() => setActiveModal('organization')}
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
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#FAFBFD] border-b border-gray-100 text-gray-400 text-xs tracking-wider uppercase font-semibold">
                                <th className="p-4 w-12 text-center">
                                    <button onClick={handleSelectAll} className="focus:outline-none text-gray-300 hover:text-gray-500">
                                        {paginatedHostels.length > 0 && paginatedHostels.every(h => selectedIds.includes(h.id)) ? (
                                            <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                </th>

                                <th className="p-4 text-center normal-case text-sm font-semibold text-[#222222]">
                                    Name
                                </th>
                                <th className="p-4 text-center normal-case text-sm font-semibold text-[#222222]">
                                    Type
                                </th>

                                <th className="p-4 text-center normal-case text-sm font-semibold text-[#222222]">
                                    Capacity
                                </th>

                                <th className="p-4 text-center normal-case text-sm font-semibold text-[#222222]">
                                    Students
                                </th>

                                <th className="p-4 text-center normal-case text-sm font-semibold text-[#222222]">
                                    Status
                                </th>
                                <th className="p-4 text-center normal-case text-sm font-semibold text-[#222222]">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {paginatedHostels.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-400">No records found matching your matching layout search criteria.</td>
                                </tr>
                            ) : (
                                paginatedHostels.map((hostel) => {
                                    const isSelected = selectedIds.includes(hostel.id);
                                    return (
                                        <tr key={hostel.id} className={`hover:bg-gray-50/40 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                                            <td className="p-4 text-center">
                                                <button onClick={() => handleSelectRow(hostel.id)} className="focus:outline-none text-gray-300">
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
                                                    <div className="w-6 h-6 rounded-full bg-[#0A437A] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                        {hostel.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </div>
                                                    {hostel.name}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center text-gray-500">
                                                {hostel.email}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-1.5 text-gray-500">
                                                    <Phone size={14} className="text-gray-400" />
                                                    <span>{hostel.phone}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="relative inline-block w-44 mx-auto">
                                                    <select
                                                        value={hostel.hostel}
                                                        onChange={(e) => handleHostelChange(hostel.id, e.target.value)}
                                                        className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium bg-white pr-8 focus:outline-none text-gray-700 cursor-pointer hover:border-gray-300 transition-colors"
                                                    >
                                                        {AVAILABLE_HOSTELS.map(h => (
                                                            <option key={h} value={h}>{h}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="relative inline-block mx-auto">
                                                    <select
                                                        value={hostel.status}
                                                        onChange={(e) => handleStatusChange(hostel.id, e.target.value)}
                                                        className={`appearance-none rounded-full px-3 py-1 text-xs pr-7 focus:outline-none border cursor-pointer transition-colors ${hostel.status === 'Active'
                                                            ? 'bg-green-50 text-success border-green-100 hover:bg-green-100/70'
                                                            : 'bg-red-50 text-danger border-red-100 hover:bg-red-100/70'
                                                            }`}
                                                    >
                                                        <option value="Active">Active</option>
                                                        <option value="Inactive">Inactive</option>
                                                    </select>
                                                    <ChevronDown className={`w-3 h-3 absolute right-2 top-2.5 pointer-events-none ${hostel.status === 'Active' ? 'text-green-600' : 'text-red-500'}`} />
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

                {/* ==========================================
                PAGINATION BAR FOOTER
                ========================================== */}
                <div className="p-4 bg-white border-t border-gray-50 flex items-center justify-between text-xs font-medium text-gray-500">
                    <div>
                        Showing {hostels.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(currentPage * itemsPerPage, hostels.length)} of {hostels.length} entries
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
                        className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200"
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {editingHostel ? 'Edit Hostel' : 'Add New Hostel'}
                                </h2>
                                <p className="text-xs text-[#777777] mt-0.5">
                                    Fill in the details to manually create a new Hostel
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveModal(false)}
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
                                        <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50">

                                            <input
                                                type="text"
                                                required
                                                placeholder="Enter Hostel Name"
                                                className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                                            />
                                        </div>
                                    </div>
                                    {/* Hostel Type Field */}
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-medium text-black mb-1">Hostel type *</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                placeholder="Select"
                                                value={hostelForm.type}
                                                onChange={(e) => setHostelForm({ ...hostelForm, type: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A] cursor-pointer"
                                            />
                                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Capacity Field */}
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-medium text-black mb-1">Capacity *</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                placeholder="Select"
                                                value={hostelForm.capacity}
                                                onChange={(e) => setHostelForm({ ...hostelForm, capacity: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A] cursor-pointer"
                                            />
                                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                                        </div>
                                    </div>
                                    {!editingHostel && (
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
                                    )}
                                </div>
                            </section>



                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-50">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-[rgb(10,67,122)] text-white rounded-lg text-xs font-medium hover:bg-[#083561]"
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-primary hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                        </div>
                    </form>
                </div>
            )}


            {view === 'detail' && renderDetailView()}
        </div>
    );
}

