import React from 'react';
import { Square, CheckSquare, Pencil, Trash2, ChevronDown, Phone } from 'lucide-react';

const AdminTable = ({
    paginatedAdmins,
    organizations = [],
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedAdminDetail,
    setView,
    handleOrganizationChange,
    handleStatusChangeClick,
    handleDeleteAdmin,
    openEditAdminModal
}) => {
    return (
        <div className="hidden md:block overflow-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[#FAFBFD] shadow-sm">
                    <tr className="bg-[#FAFBFD] border-b border-gray-100 text-gray-400 text-xs tracking-wider uppercase font-semibold">
                        <th className="p-4 w-12 text-center">
                            <button onClick={handleSelectAll} className="focus:outline-none text-gray-300 hover:text-gray-500 cursor-pointer">
                                {paginatedAdmins.length > 0 && paginatedAdmins.every(w => selectedIds.includes(w._id)) ? (
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
                            Email
                        </th>
                        <th className="p-4 text-center normal-case text-sm font-semibold text-[#222222]">
                            Phone
                        </th>
                        <th className="p-4 text-center normal-case text-sm font-semibold text-[#222222]">
                            Organization
                        </th>
                        <th className="p-4 text-center normal-case text-sm font-semibold text-[#222222]">
                            Status
                        </th>
                        <th className="p-4 text-center normal-case text-sm font-semibold text-[#222222]">
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
                            const isSelected = selectedIds.includes(admin._id);
                            return (
                                <tr key={admin._id} className={`hover:bg-gray-50/40 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleSelectRow(admin._id)} className="focus:outline-none text-gray-300 cursor-pointer">
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
                                                setSelectedAdminDetail(admin);
                                                setView('detail');
                                            }}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                {admin.name ? admin.name.substring(0, 2) : 'NA'}
                                            </div>
                                            <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors">{admin.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-start text-gray-500">
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
                                                value={admin.organization?._id || admin.organization || ""}
                                                onChange={(e) =>
                                                    handleOrganizationChange(admin._id, e.target.value)
                                                }
                                                className="w-full appearance-none rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs text-gray-700 focus:outline-none cursor-pointer"
                                            >
                                                <option value="" disabled>Select Organization</option>
                                                {organizations.map((org) => (
                                                    <option key={org._id} value={org._id}>
                                                        {org.name}
                                                    </option>
                                                ))}
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
                                                value={admin.isActive ? "Active" : "Inactive"}
                                                onChange={(e) =>
                                                    handleStatusChangeClick(admin._id, admin.isActive ? "Active" : "Inactive")
                                                }
                                                className={`appearance-none rounded-full pl-4 pr-8 py-1 text-xs font-medium border cursor-pointer
${admin.isActive
                                                        ? "bg-green-50 text-success border-green-100"
                                                        : "bg-red-50 text-danger border-red-100"
                                                    }`}
                                            >
                                                <option>Active</option>
                                                <option>Inactive</option>
                                            </select>

                                            <ChevronDown
                                                size={12}
                                                className={`absolute right-3 top-2
${admin.isActive
                                                        ? "text-success"
                                                        : "text-danger"
                                                    }`}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-3 text-gray-400">
                                            <button onClick={() => handleDeleteAdmin(admin._id)} className="text-secondary cursor-pointer transition-colors" title="Delete row item">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => openEditAdminModal(admin)} className="text-secondary cursor-pointer transition-colors" title="Edit row item">
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
    );
};

export default AdminTable;
