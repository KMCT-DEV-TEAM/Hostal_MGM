import React from 'react';
import { Square, CheckSquare, ChevronDown, Pencil, Mail, Phone, MapPin } from 'lucide-react';

const OrganizationTable = ({
    orgs,
    error,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedOrganizationDetail,
    setView,
    handleStatusChangeClick,
    openModal
}) => {
    return (
        <div className="hidden md:block h-full overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-start relative">
                <thead className="sticky top-0 z-10 bg-[#F8FAFC] shadow-sm">
                    <tr className="text-[#222222] text-center text-sm font-semibold border-b border-gray-50">
                        <th className="p-4 w-12 text-center">
                            <button onClick={handleSelectAll} className="focus:outline-none text-gray-300 hover:text-gray-500 cursor-pointer">
                                {orgs.length > 0 && orgs.every(h => selectedIds.includes(h._id)) ? (
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
                    ) : orgs.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="p-8 text-center text-gray-500">
                                No organizations match the selected filter.
                            </td>
                        </tr>
                    ) : (
                        orgs.map((o) => (
                            <tr key={o._id} className="hover:bg-gray-50/40 transition-colors">
                                <td className="p-4 text-center">
                                    <button onClick={() => handleSelectRow(o._id)} className="focus:outline-none text-gray-300 cursor-pointer">
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
                                            onChange={() => handleStatusChangeClick(o._id, o.isActive)}
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
                                            className="p-1.5 text-gray-400 hover:text-[#0A437A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
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
    );
};

export default OrganizationTable;
