import React, { useState, useEffect, useMemo } from 'react';
import {
    Square, Pencil, Trash2, Plus, Search,
    Download, Mail, Phone, MapPin,
    ChevronDown, Loader2, X,
    CheckSquare,
    Building2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import organizationService from '../../../services/organization.service';

const INITIAL_ORGS = [
    { id: 1, name: 'Jacob Tarakan', email: 'anilkumar@gmail.com', phone: '9987898789', address: 'Abc street, Sarojini nagar', status: 'Active' },
    // ... add more as needed
];

const OrganizationManagement = () => {
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [view, setView] = useState('list'); // 'list' or 'detail'
    const [selectedOrganizationDetail, setSelectedOrganizationDetail] = useState(null);
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        organisationNumber: '',
        email: '',
        phone: '',
        address: ''
    });
    const limit = 10;

    const fetchOrganizations = async () => {
        try {
            const res = await organizationService.getOrganizations({ page, limit });
            if (res && res.data) {
                setOrgs(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch organizations:", err);
            setError("Failed to fetch organizations. Please try again.");
        }
    };

    useEffect(() => {
        fetchOrganizations();
    }, [page]);

    const handleStatusChange = async (id, currentStatus) => {
        try {
            await organizationService.toggleStatus(id);
            // Re-fetch or locally update the status
            setOrgs((prevOrgs) =>
                prevOrgs.map((org) =>
                    org._id === id ? { ...org, isActive: !org.isActive } : org
                )
            );
        } catch (err) {
            console.error("Failed to toggle status:", err);
            alert("Failed to update status. Please try again.");
        }
    };

    const openModal = (mode, org = null) => {
        setIsEditMode(mode === 'edit');
        if (mode === 'edit' && org) {
            setEditingId(org._id);
            setFormData({
                name: org.name || '',
                code: org.code || '',
                organisationNumber: org.organisationNumber || '',
                email: org.email || '',
                phone: org.phone || '',
                address: org.address || ''
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                code: '',
                organisationNumber: '',
                email: '',
                phone: '',
                address: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isEditMode) {
            setIsEditConfirmOpen(true);
        } else {
            await saveOrganization();
        }
    };

    const saveOrganization = async () => {
        try {
            setIsSubmitting(true);
            if (isEditMode && editingId) {
                await organizationService.updateOrganization(editingId, formData);
            } else {
                await organizationService.createOrganization(formData);
            }
            setIsModalOpen(false);
            setIsEditConfirmOpen(false);
            fetchOrganizations(); // Refresh list after saving
        } catch (err) {
            console.error("Failed to save organization:", err);
            alert("Failed to save organization. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isEditMode) {
            setIsDiscardConfirmOpen(true);
        } else {
            setIsModalOpen(false);
        }
    };

    const confirmDiscard = () => {
        setIsDiscardConfirmOpen(false);
        setIsModalOpen(false);
    };

    const handleSelectAll = () => {
        // Use _id instead of id
        const currentVisibleIds = paginatedorgs.map(h => h._id);
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

    // Step 1: Trigger the dialog
    const initiateExport = () => {
        setIsExportConfirmOpen(true);
    };

    // Step 2: The actual export logic (your existing function)
    const confirmExport = async () => {
        setIsExportConfirmOpen(false);
        // ... rest of your existing handleExport logic
    };


    const paginatedorgs = useMemo(() => {
        const startIndex = (page - 1) * limit;
        return orgs.slice(startIndex, startIndex + limit);
    }, [orgs, page]);

    const handleExport = async () => {
        try {
            // Fetch all organizations by setting limit to 0
            const res = await organizationService.getOrganizations({ page: 1, limit: 0 });
            if (res && res.data) {
                const allOrgs = res.data;
                const exportData = allOrgs.map((org, index) => ({
                    "S.No": index + 1,
                    "Organization Name": org.name,
                    "Code": org.code,
                    "Registration Number": org.organisationNumber,
                    "Email": org.email,
                    "Phone": org.phone || 'N/A',
                    "Address": org.address || 'N/A',
                    "Status": org.isActive ? "Active" : "Inactive",
                    "Created At": new Date(org.createdAt).toLocaleDateString()
                }));

                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Organizations");

                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
                saveAs(data, `Organizations_Export_${new Date().getTime()}.xlsx`);
            }
        } catch (err) {
            console.error("Failed to export organizations:", err);
            alert("Failed to export organizations. Please try again.");
        }
    };

    const filteredOrgs = orgs.filter(org => {
        if (statusFilter === 'All') return true;
        if (statusFilter === 'Active') return org.isActive === true;
        if (statusFilter === 'Inactive') return org.isActive === false;
        return true;
    });

    const renderDetailView = () => {
        if (!selectedOrganizationDetail) return null;

        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-5xl w-full p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto max-h-[calc(100vh-160px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {/* Close Button */}
                    <button
                        onClick={() => setView('list')}
                        className="absolute top-6 right-6 p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
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
                                <h1 className="text-2xl font-bold text-gray-900">{selectedOrganizationDetail.name}</h1>
                                <p className="text-gray-400 text-sm">Organization - {selectedOrganizationDetail.hostelCount || 0} Hostels</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content Area */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Info */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-primary mb-1">Basic Info</h3>
                                <p className="text-xs text-gray-400 mb-6">Basic contact information of the Organization</p>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 text-sm"><span className="text-gray-500">Organization Id</span> <span className="col-span-2 font-medium">: {selectedOrganizationDetail.code}</span></div>
                                    <div className="grid grid-cols-3 text-sm"><span className="text-gray-500">Organization Name</span> <span className="col-span-2 font-medium">: {selectedOrganizationDetail.name}</span></div>
                                    <div className="grid grid-cols-3 text-sm"><span className="text-gray-500">Status</span> <span className="col-span-2 font-medium flex items-center">: <span className="w-2 h-2 rounded-full bg-green-500 mx-2"></span>Active</span></div>
                                </div>
                            </div>

                            {/* Address Information */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-primary mb-1">Address Information</h3>
                                <p className="text-xs text-gray-400 mb-6">Address information of the Organization</p>
                                <div className="grid grid-cols-3 text-sm"><span className="text-gray-500">Full Address</span> <span className="col-span-2 font-medium">: {selectedOrganizationDetail.address}</span></div>
                            </div>

                            {/* Contact Information */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-primary mb-1">Contact Information</h3>
                                <p className="text-xs text-gray-400 mb-6">Contact information of the Organization</p>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 text-sm"><span className="text-[#777777]">Phone No</span> <span className="col-span-2 font-medium">: {selectedOrganizationDetail.phone}</span></div>
                                    <div className="grid grid-cols-3 text-sm"><span className="text-[#777777]">Email</span> <span className="col-span-2 font-medium">: {selectedOrganizationDetail.email}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Right Summary Sidebar */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                            <h3 className="text-lg font-semibold text-primary mb-4">Organization Summary</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 text-sm"><span className="text-[#777777]">Organization Id</span> <span className="col-span-2 font-medium">: {selectedOrganizationDetail.code}</span></div>
                                <div className="grid grid-cols-3 text-sm"><span className="text-[#777777]">Organization Name</span> <span className="col-span-2 font-medium">: {selectedOrganizationDetail.name}</span></div>
                                <div className="grid grid-cols-3 text-sm"><span className="text-[#777777]">Status</span> <span className="col-span-2 font-medium flex items-center">: <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Active</span></div>
                                <div className="grid grid-cols-3 text-sm"><span className="text-[#777777]">Phone No</span> <span className="col-span-2 font-medium">: {selectedOrganizationDetail.phone}</span></div>
                                <div className="grid grid-cols-3 text-sm"><span className="text-[#777777]">Email</span> <span className="col-span-2 font-medium">: {selectedOrganizationDetail.email}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="w-full min-h-screen bg-[#F8FAFC] p-4 md:p-6 text-black">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-black">Organization</h1>
                    <p className="text-xs text-[#777777] mt-1">Manage all organizations</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={() => { /* Implement bulk update logic */ }}
                            className="hidden md:flex items-center gap-2 px-4 py-2 border border-success text-success bg-green-50/40 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                        >
                            Active ({selectedIds.length})
                        </button>
                    )}

                    {selectedIds.length > 0 && (
                        <button
                            className="hidden md:flex items-center gap-2 px-4 py-2 border border-red-200 text-danger bg-red-50/40 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                        >
                            Inactive({selectedIds.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Filter and Action Bar */}
            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm mb-6">
                <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50">
                    <div className="relative inline-block w-full sm:w-32 bg-white border border-gray-100 md:border-gray-200 rounded-lg shadow-sm md:shadow-none">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full appearance-none bg-transparent rounded-lg px-3 py-2 pr-8 text-sm text-[#777777] font-medium outline-none focus:border-[#0A437A]"
                        >
                            <option value="All">All</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end">
                        <div className="relative w-full sm:w-auto flex-1 sm:max-w-xs">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
                            <input className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none" placeholder="Search Organization..." />
                        </div>
                        <button
                            onClick={initiateExport}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#777777] hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none"
                        >
                            <Download className="w-4 h-4" /> Export
                        </button>
                        <button
                            onClick={() => openModal('add')}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm hover:bg-[#083663] transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none"
                        >
                            <Plus className="w-4 h-4" /> Add New
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-start">
                        <thead>
                            <tr className="text-[#222222] text-center text-sm  font-semibold border-b border-gray-50 bg-gray-50/50">
                                <th className="p-4 w-12 text-center">
                                    <button onClick={handleSelectAll} className="focus:outline-none text-gray-300 hover:text-gray-500">
                                        {paginatedorgs.length > 0 && paginatedorgs.every(h => selectedIds.includes(h._id)) ? (
                                            <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                </th>
                                <th className="p-4 text-start">Name</th>
                                <th className="p-4 text-start">Email</th>
                                <th className="p-4 text-start">Phone</th>
                                <th className="p-4 text-start">Address</th>
                                <th className="p-4 text-start">Status</th>
                                <th className="p-4 text-start rounded-tr-lg">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {error ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-red-500">
                                        {error}
                                    </td>
                                </tr>
                            ) : filteredOrgs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">
                                        No organizations match the selected filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrgs.map((o) => (
                                    <tr key={o._id} className="hover:bg-gray-50/40 transition-colors">
                                        <td className="p-4 text-center">
                                            <button onClick={() => handleSelectRow(o._id)} className="focus:outline-none text-gray-300">
                                                {selectedIds.includes(o._id) ? (
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
                                                    setSelectedOrganizationDetail(o);
                                                    setView('detail');
                                                }}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                    {o.name ? o.name.substring(0, 2) : 'NA'}
                                                </div>
                                                <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors">{o.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                {o.email}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                {o.phone || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="truncate max-w-[150px]">{o.address || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="relative w-fit mx-auto">
                                                <select
                                                    value={o.isActive ? "Active" : "Inactive"}
                                                    onChange={() => handleStatusChange(o._id, o.isActive)}
                                                    className={`appearance-none rounded-full pl-3 pr-8 py-1.5 text-xs font-regular border transition-colors cursor-pointer outline-none
                                                    ${o.isActive
                                                            ? "bg-green-50 text-success border-green-200 hover:bg-green-100"
                                                            : "bg-red-50 text-danger border-red-200 hover:bg-red-100"
                                                        }`}
                                                >
                                                    <option value="Active">Active</option>
                                                    <option value="Inactive">Inactive</option>
                                                </select>
                                                <ChevronDown
                                                    size={14}
                                                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none
                                                    ${o.isActive ? "text-green-700" : "text-red-700"}`}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-3 items-center justify-center">
                                                <button
                                                    onClick={() => openModal('edit', o)}
                                                    className="p-1.5 text-gray-400 hover:text-[#0A437A] hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4 text-secondary" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Cards for Mobile */}
                <div className="md:hidden flex flex-col gap-4 mt-4 md:mt-0">
                    {error ? (
                        <div className="text-center text-red-500 p-8 bg-white rounded-xl">{error}</div>
                    ) : filteredOrgs.length === 0 ? (
                        <div className="text-center text-gray-500 p-8 bg-white rounded-xl">No organizations match the selected filter.</div>
                    ) : (
                        filteredOrgs.map((o) => (
                            <div key={o._id} className="bg-white p-4 rounded-xl shadow-sm flex flex-col relative">
                                <button
                                    onClick={() => openModal('edit', o)}
                                    className="absolute top-4 right-4 text-blue-400 hover:text-[#0A437A]"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 mt-1">
                                        {o.name ? o.name.substring(0, 2) : 'NA'}
                                    </div>

                                    <div className="flex-1 min-w-0 pr-6">
                                        <div
                                            className="font-bold text-gray-900 text-base mb-1 cursor-pointer truncate"
                                            onClick={() => {
                                                setSelectedOrganizationDetail(o);
                                                setView('detail');
                                            }}
                                        >
                                            {o.name}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[10px] sm:text-xs text-gray-500 mb-2">
                                            <div className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                <span className="truncate max-w-[120px]">{o.email}</span>
                                            </div>
                                            <span className="hidden sm:inline">-</span>
                                            <div className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                <span>{o.phone || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="text-[10px] sm:text-xs text-gray-400 mb-3 truncate">
                                            {o.address}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-auto">
                                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium
                                        ${o.isActive ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${o.isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                        {o.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add New Organization Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <form
                        onSubmit={handleSubmit}
                        className="
                            bg-white
                            rounded-2xl
                            w-full
                            max-w-3xl
                            max-h-[90vh]
                            overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                            p-8
                            shadow-2xl
                            animate-in
                            fade-in
                            zoom-in-95
                            duration-200
                        "
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {isEditMode ? 'Edit Organization' : 'Add New Organization'}
                                </h2>
                                <p className="text-xs text-gray-400 mt-1">
                                    {isEditMode ? 'Update the details for this organization' : 'Fill in the details to manually create a new organization'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="space-y-8">
                            <section>
                                <h3 className="text-[14px] font-medium text-primary">Basic Info</h3>
                                <h5 className='text-xs font-medium text-[#777777] mb-4 pb-2 border-b border-gray-200 '>Basic details of the organization</h5>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-xs mb-1.5 font-medium">Organization Name *</label>
                                        <input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0A437A]"
                                            placeholder="Enter organization name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1.5 font-medium">Code *</label>
                                        <input
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0A437A]"
                                            placeholder="e.g. KMCTENG"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1.5 font-medium">Organization Number *</label>
                                        <input
                                            name="organisationNumber"
                                            value={formData.organisationNumber}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#0A437A]"
                                            placeholder="e.g. ORG001"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[14px] font-medium text-primary">Contact & Address</h3>
                                <h5 className="text-xs font-medium text-[#777777] mb-4 pb-2 border-b border-gray-200">Contact information of the organization</h5>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-medium text-black mb-1">Email Address *</label>
                                        <input
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            type="email"
                                            required
                                            placeholder="info@example.com"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-black mb-1">Phone Number *</label>
                                        <div className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#0A437A]">
                                            <div className="px-2 py-2 border-r border-gray-200 flex items-center gap-1 text-xs text-black bg-gray-50">
                                                <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-4 h-3" />
                                                +91
                                            </div>
                                            <input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                type="text"
                                                required
                                                placeholder="9876543210"
                                                className="w-full px-3 py-2 text-xs outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-black mb-1">Full Address *</label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            required
                                            rows="3"
                                            placeholder="Enter complete address"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-6 py-2.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 text-xs font-medium text-white bg-[#0A437A] rounded-lg hover:bg-[#083660] transition-colors flex items-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                    {isEditMode ? 'Save changes' : 'Create'}
                                </button>
                            </div>
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
                                onClick={saveOrganization}
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
            {view === 'detail' && renderDetailView()}
        </div>
    );
};

export default OrganizationManagement;