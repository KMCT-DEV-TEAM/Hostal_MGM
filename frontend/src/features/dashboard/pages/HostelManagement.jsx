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
    Download
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
    const [viewingHostel, setViewingHostel] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [hostelForm, setHostelForm] = useState({
        name: "",
        type: "",
        capacity: "",
        status: "Active",
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

    return (
        <div className="w-full min-h-screen bg-[#F8FAFC] p-6 text-gray-700 font-sans relative">

            {/* ==========================================
             HEADER ACTION SECTION
             ========================================== */}

            {viewingHostel ? (
                // ==========================================
                // HOSTEL DETAILS VIEW
                // ==========================================

                <div className="space-y-6 animate-in fade-in duration-300">
                    <button
                        onClick={() => setViewingHostel(null)}
                        className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                    >
                        <ChevronLeft size={16} /> Back to List
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#0A437A] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            {viewingHostel.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{viewingHostel.name}</h1>
                            <p className="text-gray-500 text-sm">Hostel - {viewingHostel.status}</p>
                        </div>
                    </div>

                    {/* Additional Details Cards... */}
                </div>
            ) : (
                // ==========================================
                // DATA TABLE VIEW (Keep your existing JSX here)
                // ==========================================
                <>
                    <div className="flex justify-between items-center mb-6">
                        {/* Header Content */}
                    </div>
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
                </>
            )}

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

                                            {/* Current code has only placeholders */}
                                            <input
                                                type="text"
                                                required
                                                placeholder="Enter Hostel Name"
                                                value={hostelForm.name} // ADD THIS
                                                onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })} // ADD THIS
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
        </div>
    );
}



