import React, { useState, useMemo, useEffect } from 'react';
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
    User
} from 'lucide-react';

import AdminTable from '../components/admin/AdminTable';
import AdminMobileList from '../components/admin/AdminMobileList';
import AdminFormModal from '../components/admin/AdminFormModal';
import AdminDetailView from '../components/admin/AdminDetailView';

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



import adminService from '../../../services/admin.service';
import organizationService from '../../../services/organization.service';
import * as XLSX from 'xlsx';

export default function Administrator() {
    const [activeModal, setActiveModal] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [view, setView] = useState('list');
    const [selectedAdminDetail, setSelectedAdminDetail] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState(null);
    const [isBulkStatusConfirmOpen, setIsBulkStatusConfirmOpen] = useState(false);
    const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState(null);

    const [admins, setAdmins] = useState([]);
    const [totalAdmins, setTotalAdmins] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState(null);
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [organizations, setOrganizations] = useState([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form State for Adding / Editing Admin
    const [adminForm, setAdminForm] = useState({
        name: '',
        email: '',
        phone: '',
        hostel: 'Kmct Hostel 1',
        status: 'Active'
    });

    const fetchAdmins = async () => {
        try {
            const res = await adminService.getAdmins({
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearch,
                status: statusFilter
            });
            if (res && res.data) {
                setAdmins(res.data);
                setTotalAdmins(res.totalCount || 0);
                setTotalPages(res.totalPages || 1);
            }
        } catch (err) {
            console.error("Failed to fetch admins:", err);
            setError("Failed to fetch admins. Please try again.");
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const res = await organizationService.getOrganizations({ limit: 100, status: 'Active' });
                if (res && res.data) {
                    setOrganizations(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch organizations:", err);
            }
        };
        fetchOrganizations();
    }, []);

    useEffect(() => {
        fetchAdmins();
    }, [currentPage, debouncedSearch, statusFilter]);

    // ==========================================
    // SELECTION & ACTION HANDLERS
    // ==========================================
    const handleSelectAll = () => {
        const currentVisibleIds = admins.map(w => w._id);
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

    const handleStatusChangeClick = (id, currentStatus) => {
        setStatusToUpdate({ id, currentStatus });
        setIsStatusConfirmOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!statusToUpdate) return;
        try {
            const res = await adminService.toggleStatus(statusToUpdate.id);
            if (res && res.data) {
                const newIsActive = statusToUpdate.currentStatus !== 'Active';
                setAdmins(admins.map(w => w._id === statusToUpdate.id ? { ...w, isActive: newIsActive } : w));
            }
        } catch (error) {
            console.error("Failed to change status:", error);
            alert("Failed to change status");
        }
        setIsStatusConfirmOpen(false);
        setStatusToUpdate(null);
    };

    const handleBulkStatusClick = (isActive) => {
        setBulkStatusToUpdate(isActive);
        setIsBulkStatusConfirmOpen(true);
    };

    const confirmBulkStatusChange = async () => {
        if (selectedIds.length === 0 || bulkStatusToUpdate === null) return;
        try {
            const res = await adminService.bulkToggleStatus({
                ids: selectedIds,
                isActive: bulkStatusToUpdate
            });
            if (res && res.success) {
                // Optimistically update local state
                setAdmins(admins.map(admin => 
                    selectedIds.includes(admin._id) ? { ...admin, isActive: bulkStatusToUpdate } : admin
                ));
            }
        } catch (error) {
            console.error("Failed to bulk update status:", error);
            alert("Failed to update bulk status.");
        }
        setSelectedIds([]);
        setIsBulkStatusConfirmOpen(false);
        setBulkStatusToUpdate(null);
    };

    const handleOrganizationChange = async (id, organizationId) => {
        try {
            const res = await adminService.updateOrganization(id, { organizationId });
            if (res && res.data) {
                const newOrg = organizations.find(o => o._id === organizationId);
                setAdmins(admins.map(admin => 
                    admin._id === id ? { ...admin, organization: newOrg ? newOrg : { _id: organizationId } } : admin
                ));
            }
        } catch (err) {
            console.error("Failed to update organization:", err);
            alert("Failed to update organization");
        }
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
            setIsEditConfirmOpen(true);
        } else {
            saveAdmin();
        }
    };

    const saveAdmin = async () => {
        if (editingAdmin) {
            try {
                // Update Existing Record via API
                const res = await adminService.updateAdmin(editingAdmin._id, {
                    name: adminForm.name,
                    phone: adminForm.phone
                });
                if (res && res.data) {
                    setAdmins(admins.map(w => w._id === editingAdmin._id ? { ...w, ...res.data } : w));
                }
            } catch (error) {
                console.error("Failed to update admin:", error);
                alert("Failed to update admin.");
                return;
            }
        } else {
            // Create New Record via API
            try {
                const res = await adminService.createAdmin({
                    name: adminForm.name,
                    email: adminForm.email,
                    phone: adminForm.phone,
                    organizationId: adminForm.organization
                });
                if (res && res.data) {
                    setAdmins([res.data, ...admins]);
                    fetchAdmins(); // re-fetch to ensure pagination is consistent
                }
            } catch (error) {
                console.error("Failed to create admin:", error);
                alert("Failed to create admin.");
                return;
            }
        }
        setActiveModal(null);
        setIsEditConfirmOpen(false);
    };

    const handleCancel = () => {
        if (editingAdmin) {
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

    const handleExport = async () => {
        try {
            // Fetch all admins for export by setting a large limit
            const res = await adminService.getAdmins({ limit: 100000 });
            if (res && res.data) {
                const allAdmins = res.data;
                const exportData = allAdmins.map(admin => ({
                    Name: admin.name,
                    Email: admin.email,
                    Phone: admin.phone || 'N/A',
                    Organization: admin.organization?.name || admin.organization || 'N/A',
                    Status: admin.isActive ? 'Active' : 'Inactive'
                }));
                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Admins");
                XLSX.writeFile(wb, "Admins_List.xlsx");
            }
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export admins.");
        } finally {
            setIsExportConfirmOpen(false);
        }
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">

            {/* ==========================================
             HEADER ACTION SECTION
             ========================================== */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admins</h1>
                    <p className="text-xs text-[#777777] mt-1">Manage all registered hostel administrators</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 mr-2">
                            <button
                                onClick={() => handleBulkStatusClick(true)}
                                className="px-3 py-2 bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                            >
                                Active ({selectedIds.length})
                            </button>
                            <button
                                onClick={() => handleBulkStatusClick(false)}
                                className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                            >
                                Inactive ({selectedIds.length})
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ==========================================
             FILTER & UTILITY TOOLBAR
             ========================================== */}
            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm  flex-1 flex flex-col min-h-0">
                <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
                    <div className="relative w-full sm:w-auto flex-1 sm:max-w-xs">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search Name, Email or Phone..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none placeholder-gray-400 cursor-pointer"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end">
                        <div className="relative inline-block w-32 bg-white border border-gray-100 md:border-gray-200 rounded-lg shadow-sm md:shadow-none">
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                className="w-full appearance-none bg-transparent rounded-lg px-3 py-2 pr-8 text-sm text-[#777777] font-medium outline-none focus:border-[#0A437A] cursor-pointer"
                            >
                                <option value="All">All</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <button
                            onClick={initiateExport}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" /> Export
                        </button>
                        <button
                            onClick={openAddAdminModal}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm hover:bg-[#083663] transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Add New
                        </button>
                    </div>
                </div>

                {/* ==========================================
                DATA TABLE LAYOUT
                ========================================== */}

                <AdminTable
                    paginatedAdmins={admins}
                    organizations={organizations}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    setSelectedAdminDetail={setSelectedAdminDetail}
                    setView={setView}
                    handleOrganizationChange={handleOrganizationChange}
                    handleStatusChangeClick={handleStatusChangeClick}
                    handleDeleteAdmin={handleDeleteAdmin}
                    openEditAdminModal={openEditAdminModal}
                />
                
                <AdminMobileList
                    paginatedAdmins={admins}
                    organizations={organizations}
                    openEditAdminModal={openEditAdminModal}
                    setSelectedAdminDetail={setSelectedAdminDetail}
                    setView={setView}
                    selectedIds={selectedIds}
                    handleSelectAll={handleSelectAll}
                    handleSelectRow={handleSelectRow}
                    handleOrganizationChange={handleOrganizationChange}
                />

                {/* ==========================================
                PAGINATION BAR FOOTER
                ========================================== */}
                <div className="flex flex-col sm:flex-row p-4 bg-white border border-gray-50 items-center justify-between text-xs font-medium text-gray-500 rounded-b-xl shadow-sm shrink-0 gap-3 sm:gap-0 mt-auto">
                    <div>
                        Showing {totalAdmins === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalAdmins)} of {totalAdmins} entries
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
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
                                        } cursor-pointer`}
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
                <AdminFormModal
                    activeModal={activeModal}
                    setActiveModal={setActiveModal}
                    editingAdmin={editingAdmin}
                    adminForm={adminForm}
                    setAdminForm={setAdminForm}
                    handleSaveAdmin={handleSaveAdmin}
                    handleCancel={handleCancel}
                    organizations={organizations}
                />
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
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveAdmin}
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
                            Are you sure you want to download the admin list?
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
                            Are you sure you want to change the status of this admin?
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
                        <h3 className="text-sm font-bold text-gray-900"> Change Status</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-6">
                            Are you sure you want to change the status for the {selectedIds.length} selected admin(s)?
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
            
            {view === 'detail' && (
                <AdminDetailView
                    selectedAdminDetail={selectedAdminDetail}
                    setView={setView}
                />
            )}
        </div>
    );
}

