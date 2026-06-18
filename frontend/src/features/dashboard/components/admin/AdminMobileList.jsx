import React from 'react';
import { Pencil, Mail, Phone, Square, CheckSquare, Loader2 } from 'lucide-react';

const AdminMobileList = ({
    paginatedAdmins,
    organizations = [],
    openEditAdminModal,
    setSelectedAdminDetail,
    setView,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    handleOrganizationChange,
    loading,
    error
}) => {
    const isAllSelected = paginatedAdmins.length > 0 && paginatedAdmins.every(o => selectedIds.includes(o._id));

    return (
        <div className="md:hidden flex flex-col gap-4 mt-4 md:mt-0 flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {paginatedAdmins.length > 0 && (
                <div className="flex items-center gap-2 px-1 mb-1">
                    <button onClick={handleSelectAll} className="focus:outline-none text-gray-400 cursor-pointer flex items-center gap-2">
                        {isAllSelected ? (
                            <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                        ) : (
                            <Square className="w-5 h-5" />
                        )}
                        <span className="text-sm font-medium text-gray-600">Select All</span>
                    </button>
                </div>
            )}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0A437A] mb-2" />
                    <span className="text-sm">Loading administrators...</span>
                </div>
            ) : error ? (
                <div className="text-center text-red-500 p-8 bg-white rounded-xl shadow-sm">{error}</div>
            ) : paginatedAdmins.length === 0 ? (
                <div className="text-center text-gray-500 p-8 bg-white rounded-xl shadow-sm">No administrators match the selected filter.</div>
            ) : (
                paginatedAdmins.map((o) => {
                    const isSelected = selectedIds.includes(o._id);
                    return (
                    <div key={o._id} className={`bg-white p-4 rounded-xl shadow-sm flex flex-col relative border ${isSelected ? 'border-[#0A437A] bg-blue-50/20' : 'border-transparent'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <button
                                onClick={() => handleSelectRow(o._id)}
                                className="focus:outline-none text-gray-300 cursor-pointer"
                            >
                                {isSelected ? (
                                    <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                ) : (
                                    <Square className="w-5 h-5" />
                                )}
                            </button>
                            <button
                                onClick={() => openEditAdminModal(o)}
                                className="text-blue-400 hover:text-[#0A437A] cursor-pointer"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 mt-1">
                                {o.name ? o.name.substring(0, 2) : 'NA'}
                            </div>

                            <div className="flex-1 min-w-0 pr-6">
                                <div
                                    className="font-bold text-gray-900 text-base mb-1 cursor-pointer truncate"
                                    onClick={() => {
                                        setSelectedAdminDetail(o);
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
                                    <select
                                        value={o.organization?._id || o.organization || ""}
                                        onChange={(e) => handleOrganizationChange(o._id, e.target.value)}
                                        className="appearance-none bg-white border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:border-[#0A437A] px-2 py-1 cursor-pointer max-w-full"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <option value="" disabled>Select Organization</option>
                                        {organizations.map((org) => (
                                            <option key={org._id} value={org._id}>
                                                {org.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-auto">
                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-medium
                                ${o.isActive ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${o.isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                {o.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </div>
                )})
            )}
        </div>
    );
};

export default AdminMobileList;
