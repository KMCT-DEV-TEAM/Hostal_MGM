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

const INITIAL_ADMINS = [
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



export default function Administrator() {
    const [activeModal, setActiveModal] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [admins, setAdmins] = useState([
        { id: 1, name: "Anil Kumar", email: "anilkumar@gmail.com", phone: "9987898789", organization: "KMCT Engineering", status: "Active" },
        { id: 2, name: "Jacob Tarakan", email: "jacob@gmail.com", phone: "9987898789", organization: "MES College", status: "Inactive" },
        { id: 3, name: "Suresh Raina", email: "suresh.r@gmail.com", phone: "9987898789", organization: "Calicut University", status: "Active" },
        { id: 4, name: "Anil Kumar", email: "anilkumar@gmail.com", phone: "9987898789", organization: "KMCT Medical College", status: "Inactive" },
        { id: 5, name: "Jacob Tarakan", email: "jacob@gmail.com", phone: "9987898789", organization: "KMCT Engineering", status: "Active" },
        { id: 6, name: "Manoj Kumar", email: "manoj.k@gmail.com", phone: "9987898789", organization: "MES College", status: "Active" },
        { id: 7, name: "Suresh Raina", email: "suresh.r@gmail.com", phone: "9987898789", organization: "Calicut University", status: "Inactive" },
        { id: 8, name: "Anil Kumar", email: "anilkumar@gmail.com", phone: "9987898789", organization: "KMCT Engineering", status: "Active" },
        { id: 9, name: "Manoj Kumar", email: "manoj.k@gmail.com", phone: "9987898789", organization: "Calicut University", status: "Active" },
        { id: 10, name: "Jacob Tarakan", email: "jacob@gmail.com", phone: "9987898789", organization: "MES College", status: "Active" },]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Form State for Adding / Editing Admin
    const [adminForm, setAdminForm] = useState({
        name: '',
        email: '',
        phone: '',
        hostel: 'Kmct Hostel 1',
        status: 'Active'
    });

    // ==========================================
    // FILTERING & PAGINATION LOGIC
    // ==========================================
    const filteredAdmins = useMemo(() => {
        return admins.filter(admin => {
            const matchesSearch =
                admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                admin.phone.includes(searchQuery);

            const matchesStatus = statusFilter === 'All' || admin.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [admins, searchQuery, statusFilter]);

    const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage) || 1;

    const paginatedAdmins = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAdmins.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAdmins, currentPage]);

    // ==========================================
    // SELECTION & ACTION HANDLERS
    // ==========================================
    const handleSelectAll = () => {
        const currentVisibleIds = paginatedAdmins.map(w => w.id);
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

    const handleDeleteAdmin = (id) => {
        if (window.confirm("Are you sure you want to delete this admin?")) {
            setAdmins(admins.filter(w => w.id !== id));
            setSelectedIds(selectedIds.filter(item => item !== id));
        }
    };

    const handleDeleteSelected = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} admin(s)?`)) {
            setAdmins(admins.filter(w => !selectedIds.includes(w.id)));
            setSelectedIds([]);
            setCurrentPage(1);
        }
    };

    const handleStatusChange = (id, newStatus) => {
        setAdmins(admins.map(w => w.id === id ? { ...w, status: newStatus } : w));
    };

    const handleOrganizationChange = (id, organization) => {
        setAdmins(
            admins.map(admin =>
                admin.id === id
                    ? { ...admin, organization }
                    : admin
            )
        );
    };

    // ==========================================
    // MODAL OPEN / SUBMIT HANDLERS
    // ==========================================
    const openAddAdminModal = () => {
        setEditingAdmin(null);
        setAdminForm({ name: '', email: '', phone: '', hostel: ' ', status: 'Active' });
        setActiveModal('admin');
    };

    const openEditAdminModal = (admin) => {
        setEditingAdmin(admin);
        setAdminForm({ ...admin });
        setActiveModal('admin');
    };

    const handleSaveAdmin = (e) => {
        e.preventDefault();
        if (!adminForm.name || !adminForm.email || !adminForm.phone) {
            alert("Please fill in all required fields.");
            return;
        }

        if (editingAdmin) {
            // Update Existing Record
            setAdmins(admins.map(w => w.id === editingAdmin.id ? { ...w, ...adminForm } : w));
        } else {
            // Create New Record
            const newAdmin = {
                id: Date.now(),
                ...adminForm
            };
            setAdmins([newAdmin, ...admins]);
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
                    <h1 className="text-2xl font-bold text-gray-900">Admins</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Manage all registered hostel administrators</p>
                </div>

                <div className="flex items-center gap-3">
                    {selectedIds.length === 1 && (
                        <button
                            onClick={() => {
                                const target = admins.find(w => w.id === selectedIds[0]);
                                if (target) openEditAdminModal(target);
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

                            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={openAddAdminModal}
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
                                        {paginatedAdmins.length > 0 && paginatedAdmins.every(w => selectedIds.includes(w.id)) ? (
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
                                    Organization
                                </th>

                                <th className="p-4 text-center normal-case text-sm font-semibold text-gray-700">
                                    Status
                                </th>

                                <th className="p-4 text-center normal-case text-sm font-semibold text-gray-700">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {paginatedAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-400">No records found matching your matching layout search criteria.</td>
                                </tr>
                            ) : (
                                paginatedAdmins.map((admin) => {
                                    const isSelected = selectedIds.includes(admin.id);
                                    return (
                                        <tr key={admin.id} className={`hover:bg-gray-50/40 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                                            <td className="p-4 text-center">
                                                <button onClick={() => handleSelectRow(admin.id)} className="focus:outline-none text-gray-300">
                                                    {isSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                                    ) : (
                                                        <Square className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="p-4 font-medium text-gray-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-[#0A437A] flex items-center justify-center text-white text-[9px] font-semibold">
                                                        {admin.name
                                                            .split(" ")
                                                            .map(n => n[0])
                                                            .join("")
                                                            .slice(0, 2)}
                                                    </div>

                                                    <span className="text-sm text-gray-700 font-medium">
                                                        {admin.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center text-gray-500">
                                                {admin.email}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-1.5 text-gray-500">
                                                    <Phone size={14} className="text-gray-400" />
                                                    <span>{admin.phone}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="relative w-[145px] mx-auto">
                                                    <select
                                                        value={admin.organization}
                                                        onChange={(e) =>
                                                            handleOrganizationChange(admin.id, e.target.value)
                                                        }
                                                        className="w-full appearance-none rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs text-gray-700 focus:outline-none"
                                                    >
                                                        <option>Kmct Engineering</option>
                                                        <option>Kmct Medical</option>
                                                        <option>Kmct Nursing</option>
                                                        <option>Kmct Dental</option>
                                                    </select>

                                                    <ChevronDown
                                                        size={14}
                                                        className="absolute right-3 top-2 text-gray-400 pointer-events-none"
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="relative w-fit mx-auto">
                                                    <select
                                                        value={admin.status}
                                                        onChange={(e) =>
                                                            handleStatusChange(admin.id, e.target.value)
                                                        }
                                                        className={`appearance-none rounded-full pl-4 pr-8 py-1 text-xs font-medium border
        ${admin.status === "Active"
                                                                ? "bg-green-50 text-green-600 border-green-100"
                                                                : "bg-red-50 text-red-500 border-red-100"
                                                            }`}
                                                    >
                                                        <option>Active</option>
                                                        <option>Inactive</option>
                                                    </select>

                                                    <ChevronDown
                                                        size={12}
                                                        className={`absolute right-3 top-2
        ${admin.status === "Active"
                                                                ? "text-green-500"
                                                                : "text-red-500"
                                                            }`}
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-3 text-gray-400">
                                                    <button onClick={() => openEditAdminModal(admin)} className="hover:text-blue-600 transition-colors" title="Edit row item">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteAdmin(admin.id)} className="hover:text-red-500 transition-colors" title="Delete row item">
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
                        Showing {filteredAdmins.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAdmins.length)} of {filteredAdmins.length} entries
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
             MODAL 1: ADMINS (ADD & EDIT WORKFLOWS)
             ========================================== */}
            {activeModal === 'admin' && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form
                        onSubmit={handleSaveAdmin}
                        className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-150"
                    >
                        <button
                            type="button"
                            onClick={() => setActiveModal(null)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg p-1.5"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <h2 className="text-xl font-bold text-gray-900">{editingAdmin ? 'Edit Admin Profile' : 'Add New Admin'}</h2>
                        <p className="text-xs text-gray-400 mt-0.5 mb-6">Provide deployment information below to maintain clean administrative records</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Admin Full Name<span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter full name"
                                    value={adminForm.name}
                                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address<span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="name@gmail.com"
                                        value={adminForm.email}
                                        onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number<span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter 10-digit number"
                                        value={adminForm.phone}
                                        onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hostel<span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            value={adminForm.hostel}
                                            onChange={(e) => setAdminForm({ ...adminForm, hostel: e.target.value })}
                                            className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-700"
                                        >

                                        </select>
                                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Operational Status<span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            value={adminForm.status}
                                            onChange={(e) => setAdminForm({ ...adminForm, status: e.target.value })}
                                            className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-700"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                className="px-5 py-2 border border-[#0A437A] text-[#0A437A] bg-white rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-7 py-2 bg-[#0A437A] text-white rounded-lg text-sm font-medium hover:bg-[#083561] transition-colors shadow-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ==========================================
             MODAL 2: ADD NEW ORGANIZATION POPUP
             ========================================== */}
            {activeModal === 'organization' && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-150">
                        <button onClick={() => setActiveModal(null)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg p-1.5">
                            <X className="w-4 h-4" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900">Add New Organization</h2>
                        <p className="text-xs text-gray-400 mt-0.5 mb-6">Fill in the details to manually create a new Organization</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Organization Id<span className="text-red-500">*</span></label>
                                <input type="text" placeholder="Eg : A78748" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Organization Name<span className="text-red-500">*</span></label>
                                <input type="text" placeholder="Enter Organization name" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number<span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                    <div className="relative w-24 flex-shrink-0">
                                        <div className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white flex items-center gap-1.5 text-gray-600 select-none">
                                            <span>🇮🇳</span><span>+91</span>
                                        </div>
                                    </div>
                                    <input type="text" placeholder="Phone Number" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address<span className="text-red-500">*</span></label>
                                <input type="email" placeholder="enter email" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Address<span className="text-red-500">*</span></label>
                                <textarea rows="3" placeholder="Text the address" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none"></textarea>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setActiveModal(null)} className="px-5 py-2 border border-[#0A437A] text-[#0A437A] bg-white rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                            <button onClick={() => setActiveModal(null)} className="px-7 py-2 bg-[#0A437A] text-white rounded-lg text-sm font-medium hover:bg-[#083561]">save</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

