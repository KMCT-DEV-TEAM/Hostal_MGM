import React from 'react';
import { Square, CheckSquare, Pencil, Trash2, Phone, ChevronDown, Mail, Loader2 } from 'lucide-react';

export default function WardenTable({
    paginatedWardens,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedWardenDetail,
    setView,
    handleHostelChange,
    handleStatusChangeClick,
    openEditWardenModal,
    loading,
    error,
    availableHostels = []
}) {
    return (
        <div className="hidden md:block overflow-x-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[#FAFBFD] shadow-sm">
                    <tr className="bg-[#FAFBFD] border-b border-gray-100 text-gray-400 text-xs tracking-wider uppercase font-semibold">
                        <th className="p-4 w-12 text-center">
                            <button onClick={handleSelectAll} className="focus:outline-none text-gray-300 hover:text-gray-500 cursor-pointer">
                                {paginatedWardens.length > 0 && paginatedWardens.every(w => selectedIds.includes(w.id)) ? (
                                    <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                ) : (
                                    <Square className="w-5 h-5" />
                                )}
                            </button>
                        </th>

                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Name</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Email</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Phone</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Hostel</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Status</th>
                        <th className="p-4 text-start normal-case text-sm font-semibold text-[#222222]">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                    {loading ? (
                        <tr>
                            <td colSpan="7" className="p-8 text-start text-gray-500">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0A437A]" />
                                Loading wardens...
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan="7" className="p-8 text-start text-red-500">{error}</td>
                        </tr>
                    ) : paginatedWardens.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="p-8 text-center text-gray-400">No records found matching your search criteria.</td>
                        </tr>
                    ) : (
                        paginatedWardens.map((warden) => {
                            const isSelected = selectedIds.includes(warden.id);
                            return (
                                <tr key={warden.id} className={`hover:bg-gray-50/40 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleSelectRow(warden.id)} className="focus:outline-none text-gray-300 cursor-pointer">
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
                                                setSelectedWardenDetail(warden);
                                                setView('detail');
                                            }}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0 cursor-pointer">
                                                {warden.name ? warden.name.substring(0, 2) : 'NA'}
                                            </div>
                                            <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors cursor-pointer">{warden.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-start text-gray-500">

                                        <div className="flex items-center justify-start gap-1.5 text-gray-500">

                                            <Mail size={14} className="text-gray-400" />
                                            <span>{warden.email}</span>
                                        </div>
                                    </td>

                                    <td className="p-4 text-start">
                                        <div className="flex items-center justify-start gap-1.5 text-gray-500">
                                            <Phone size={14} className="text-gray-400" />
                                            <span>{warden.phone}</span>
                                        </div>
                                    </td>

                                    <td className="p-4 text-start">

                                        <div className="relative inline-block w-44">
                                            <select
                                                value={warden.hostel?._id || warden.hostel || 'Not Assigned'}
                                                onChange={(e) => handleHostelChange(warden.id, e.target.value)}
                                                className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium bg-white pr-8 focus:outline-none text-gray-700 cursor-pointer hover:border-gray-300 transition-colors"
                                            >
                                                <option value="Not Assigned">Not Assigned</option>
                                                {availableHostels.map(h => (
                                                    <option key={h._id || h} value={h._id || h}>{h.name || h}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                                        </div>
                                    </td>

                                    <td className="p-4 text-start">

                                        <div className="relative inline-block">
                                            <select
                                                value={warden.status}
                                                onChange={(e) => handleStatusChangeClick(warden.id, warden.status)}
                                                className={`appearance-none rounded-lg px-3 py-1 text-xs pr-7 focus:outline-none border cursor-pointer transition-colors ${warden.status === 'Active'
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

                                    <td className="p-4 text-start">
                                        <div className="flex items-center justify-start gap-3 text-gray-400">

                                            <button onClick={() => openEditWardenModal(warden)} className="text-secondary cursor-pointer transition-colors" title="Edit row item">
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
}
