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

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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

    const handleDeleteWarden = (id) => {
        if (window.confirm("Are you sure you want to delete this warden?")) {
            setWardens(wardens.filter(w => w.id !== id));
            setSelectedIds(selectedIds.filter(item => item !== id));
        }
    };

    const handleDeleteSelected = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} warden(s)?`)) {
            setWardens(wardens.filter(w => !selectedIds.includes(w.id)));
            setSelectedIds([]);
            setCurrentPage(1);
        }
    };

    const handleStatusChange = (id, newStatus) => {
        setWardens(wardens.map(w => w.id === id ? { ...w, status: newStatus } : w));
    };

    const handleHostelChange = (id, newHostel) => {
        setWardens(wardens.map(w => w.id === id ? { ...w, hostel: newHostel } : w));
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
    };

    return (
        <div className="w-full min-h-screen bg-[#F8FAFC] p-6 text-gray-700 font-sans relative">

            {/* ==========================================
             HEADER ACTION SECTION
             ========================================== */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Wardens</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Manage all hostel wardens</p>
                </div>

                <div className="flex items-center gap-3">
                    {selectedIds.length === 1 && (
                        <button
                            onClick={() => {
                                const target = wardens.find(w => w.id === selectedIds[0]);
                                if (target) openEditWardenModal(target);
                            }}
                            className="flex items-center gap-2 px-4 py-2 border border-[#0A437A] text-[#0A437A] bg-blue-50/40 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                        >
                            <Pencil className="w-4 h-4" />
                            Edit
                        </button>
                    )}

                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 bg-red-50/40 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete ({selectedIds.length})
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
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
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
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
                            onClick={openAddWardenModal}
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
                                        {paginatedWardens.length > 0 && paginatedWardens.every(w => selectedIds.includes(w.id)) ? (
                                            <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                </th>

                                <th className="p-4 text-center normal-case text-sm font-semibold text-gray-700">
                                    Name
                                </th>
                                <th className="p-4 text-center normal-case text-sm font-semibold text-gray-700">
                                    Email
                                </th>

                                <th className="p-4 text-center normal-case text-sm font-semibold text-gray-700">
                                    Phone
                                </th>

                                <th className="p-4 text-center normal-case text-sm font-semibold text-gray-700">
                                    Hostel
                                </th>

                                <th className="p-4 text-center normal-case text-sm font-semibold text-gray-700">
                                    Status
                                </th>
                                <th className="p-4 text-center normal-case text-sm font-semibold text-gray-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {paginatedWardens.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-400">No records found matching your matching layout search criteria.</td>
                                </tr>
                            ) : (
                                paginatedWardens.map((warden) => {
                                    const isSelected = selectedIds.includes(warden.id);
                                    return (
                                        <tr key={warden.id} className={`hover:bg-gray-50/40 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                                            <td className="p-4 text-center">
                                                <button onClick={() => handleSelectRow(warden.id)} className="focus:outline-none text-gray-300">
                                                    {isSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                                    ) : (
                                                        <Square className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="p-4 font-medium text-gray-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-[#0A437A] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                        {warden.name ? warden.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'W'}
                                                    </div>
                                                    {warden.name}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center text-gray-500">
                                                {warden.email}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-1.5 text-gray-500">
                                                    <Phone size={14} className="text-gray-400" />
                                                    <span>{warden.phone}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="relative inline-block w-44 mx-auto">
                                                    <select
                                                        value={warden.hostel}
                                                        onChange={(e) => handleHostelChange(warden.id, e.target.value)}
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
                                                        value={warden.status}
                                                        onChange={(e) => handleStatusChange(warden.id, e.target.value)}
                                                        className={`appearance-none rounded-full px-3 py-1 text-xs pr-7 focus:outline-none border cursor-pointer transition-colors ${warden.status === 'Active'
                                                            ? 'bg-green-50 text-success border-green-100 hover:bg-green-100/70'
                                                            : 'bg-red-50 text-danger border-red-100 hover:bg-red-100/70'
                                                            }`}
                                                    >
                                                        <option value="Active">Active</option>
                                                        <option value="Inactive">Inactive</option>
                                                    </select>
                                                    <ChevronDown className={`w-3 h-3 absolute right-2 top-2.5 pointer-events-none ${warden.status === 'Active' ? 'text-green-600' : 'text-red-500'}`} />
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-3 text-gray-400">
                                                    <button onClick={() => openEditWardenModal(warden)} className="text-secondary cursor-pointer transition-colors" title="Edit row item">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteWarden(warden.id)} className="text-secondary cursor-pointer transition-colors" title="Delete row item">
                                                        <Trash2 className="w-4 h-4" />
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
                        Showing {filteredWardens.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredWardens.length)} of {filteredWardens.length} entries
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
             MODAL 1: WARDEN (ADD & EDIT WORKFLOWS)
             ========================================== */}
            {activeModal === 'warden' && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
                    <form
                        onSubmit={handleSaveWarden}
                        // Reduced max-width from 2xl to lg and padding from 8 to 6
                        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200"
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {editingWarden ? 'Edit Warden' : 'Add New Warden'}
                                </h2>
                                <p className="text-xs text-[#777777] mt-0.5">
                                    Create a new Warden account
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
                                <h3 className="text-sm font-semibold text-primary mb-1">Basic Info</h3>
                                <h5 className='text-xs text-[#777777] mb-4'>Basic contact information of the Warden</h5>
                                <div className="border-b border-gray-100 mb-4" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-medium text-black mb-1">First Name *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="First name"
                                            className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-medium text-black mb-1">Last Name *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Last name"
                                            className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-medium text-black mb-1">Phone Number *</label>
                                        <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50">
                                            <div className="px-2 py-2 border-r border-gray-200 flex items-center gap-1 text-xs text-black">
                                                <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-4 h-3" />
                                                +91
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                placeholder="00000 00000"
                                                className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Conditionally hide Email if editing */}
                                    {!editingWarden && (
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-medium text-black mb-1">Email Address *</label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="warden@example.com"
                                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                            />
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Conditionally hide Organization section if editing */}
                            {!editingWarden && (
                                <section>
                                    <h3 className="text-sm font-semibold text-[#0A437A] mb-2">Hostel Assignment</h3>
                                    <h5 className='text-xs text-[#777777]'>Assign an Hostel to this administrator</h5>
                                    <div className="border-b border-gray-100 mb-4" />
                                    <label className="block text-[10px] font-medium text-black mb-1">Assign Hostel*</label>
                                    <div className="relative">
                                        <select className="w-full appearance-none bg-gray-50/50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-[#777777] focus:outline-none focus:border-[#0A437A]">
                                            <option>Select an organization</option>
                                            <option className="text-[#777777]">Hostel 1</option>
                                            <option>Hostel 2</option>
                                            <option>Hostel 3</option>
                                        </select>
                                        <ChevronDown className="w-3 h-3 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                                    </div>
                                </section>
                            )}
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

