import React, { useState, useEffect } from 'react';
import {
    Square, Pencil, Trash2, Plus, Search,
    Download, Mail, Phone, MapPin,
    ChevronDown, Loader2, X
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
            setLoading(true);
            const res = await organizationService.getOrganizations({ page, limit });
            if (res && res.data) {
                setOrgs(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch organizations:", err);
            setError("Failed to fetch organizations. Please try again.");
        } finally {
            setLoading(false);
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
        try {
            setIsSubmitting(true);
            if (isEditMode && editingId) {
                await organizationService.updateOrganization(editingId, formData);
            } else {
                await organizationService.createOrganization(formData);
            }
            setIsModalOpen(false);
            fetchOrganizations(); // Refresh list after saving
        } catch (err) {
            console.error("Failed to save organization:", err);
            alert("Failed to save organization. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

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

    return (
        <div className="w-full min-h-screen bg-[#F8FAFC] p-6 text-gray-700">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Organization</h1>
                    <p className="text-xs text-gray-400 mt-1">Manage all organizations</p>
                </div>
                <div className="flex gap-3">
                    {/* <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium hover:bg-gray-50">
                        <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100">
                        <Trash2 className="w-4 h-4" /> Delete
                    </button> */}
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex items-center justify-between">
                <div className="relative inline-block w-32">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-600 font-medium outline-none focus:border-[#0A437A]"
                    >
                        <option value="All">All</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>

                    {/* Custom Arrow */}
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64" placeholder="Search" />
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button
                        onClick={() => openModal('add')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0A437A] text-white rounded-lg text-sm"
                    >
                        <Plus className="w-4 h-4" /> Add New
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[#222222] text-xs uppercase font-semibold border-b border-gray-50 bg-gray-50/50">
                            <th className="text-gray-400 p-4 w-12 rounded-tl-lg"><Square className="w-5 h-5" /></th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Phone</th>
                            <th className="p-4">Address</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center rounded-tr-lg">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="p-8 text-center text-gray-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0A437A]" />
                                    Loading organizations...
                                </td>
                            </tr>
                        ) : error ? (
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
                                    <td className="p-4">
                                        <Square className="w-5 h-5 text-gray-300" />
                                    </td>
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase">
                                            {o.name ? o.name.substring(0, 2) : 'NA'}
                                        </div>
                                        <div className="font-medium text-gray-900">{o.name}</div>
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
                                                className={`appearance-none rounded-full pl-3 pr-8 py-1.5 text-xs font-semibold border transition-colors cursor-pointer outline-none
                                                    ${o.isActive
                                                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
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
                                                className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs mb-1.5 font-medium">Address *</label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full p-2.5 border border-gray-200 rounded-lg text-xs min-h-[80px] outline-none focus:border-[#0A437A]"
                                            placeholder="Full address of the organization"
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center justify-center min-w-[100px] px-6 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-[#083561] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditMode ? 'Save Changes' : 'Save')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default OrganizationManagement;