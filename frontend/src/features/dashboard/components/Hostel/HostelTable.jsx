import React from 'react';
import {
    Square, CheckSquare, Pencil, Mail, Phone, ChevronDown, Users, Loader2
} from 'lucide-react';
import TableSkeletonLoader from '@/components/ui/TableSkeletonLoader';
import MobileSkeletonLoader from '@/components/ui/MobileSkeletonLoader';
export default function HostelTable({
    hostels,
    loading,
    error,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedHostelDetail,
    setView,
    handleStatusChangeClick,
    openEditHostelModal,
    tableContainerRef
}) {
    return (
        <div
            ref={tableContainerRef}
            className="overflow-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
            <table className="hidden md:table w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[#FAFBFD] shadow-sm">
                    <tr className="bg-[#FAFBFD] border-b border-gray-100 text-[#222222] text-sm  tracking-wider ">
                        <th className="p-4 w-12 text-center">
                            <button onClick={handleSelectAll} className="focus:outline-none text-gray-300 hover:text-gray-500 cursor-pointer">
                                {hostels.length > 0 && hostels.every(h => selectedIds.includes(h._id)) ? (
                                    <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                ) : (
                                    <Square className="w-5 h-5" />
                                )}
                            </button>
                        </th>
                        <th className="p-4 font-semibold">Hostel Name</th>
                        <th className="p-4 font-semibold text-start">Email</th>
                        <th className="p-4 font-semibold text-start">Phone</th>
                        <th className="p-4 font-semibold text-center">Capacity</th>
                        <th className="p-4 font-semibold text-center">Students</th>
                        <th className="p-4 font-semibold text-center">Status</th>
                        <th className="p-4 font-semibold text-center rounded-tr-xl">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-center">
                    {loading ? (
                        <TableSkeletonLoader columns={8} />
                    ) : error ? (
                        <tr>
                            <td colSpan="8" className="p-8 text-start text-red-500">{error}</td>
                        </tr>
                    ) : hostels.length === 0 ? (
                        <tr>
                            <td colSpan="8" className="p-8 text-start text-gray-400">No records found matching your search criteria.</td>
                        </tr>
                    ) : (
                        hostels.map((hostel) => {
                            const isSelected = selectedIds.includes(hostel._id);
                            return (
                                <tr key={hostel._id} className={`hover:bg-gray-50/40 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/40' : ''}`}>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleSelectRow(hostel._id)} className="focus:outline-none text-gray-300 cursor-pointer">
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
                                                setSelectedHostelDetail(hostel);
                                                setView('detail');
                                            }}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                {hostel.name ? hostel.name.substring(0, 2) : 'NA'}
                                            </div>
                                            <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors">{hostel.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-start text-gray-500">
                                        <div className="flex items-center justify-start gap-1.5 text-gray-500">
                                            <Mail size={14} className="text-gray-400" />
                                            <span>{hostel.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-start justify-start gap-1.5 text-gray-500">
                                            <Phone size={14} className="text-gray-400" />
                                            <span>{hostel.phone || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-1.5 text-gray-500">
                                            <Users size={14} className="text-gray-400" />
                                            <span>{hostel.capacity}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-1.5 text-gray-500">
                                            <Users size={14} className="text-gray-400" />
                                            <span>0</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="relative inline-block mx-auto">
                                            <select
                                                value={hostel.isActive ? 'Active' : 'Inactive'}
                                                onChange={() => handleStatusChangeClick(hostel._id, hostel.isActive)}
                                                className={`appearance-none rounded-lg px-3 py-1 text-xs pr-7 focus:outline-none border cursor-pointer transition-colors ${hostel.isActive
                                                    ? 'bg-green-50 text-success border-green-100 hover:bg-green-100/70'
                                                    : 'bg-red-50 text-danger border-red-100 hover:bg-red-100/70'
                                                    }`}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                            <ChevronDown className={`w-3 h-3 absolute right-2 top-2.5 pointer-events-none ${hostel.isActive ? 'text-green-600' : 'text-red-500'}`} />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-3 text-gray-400">

                                            <button onClick={() => openEditHostelModal(hostel)} className="text-secondary cursor-pointer transition-colors" title="Edit row item">
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

            {/* Cards for Mobile */}
            <div className="md:hidden flex flex-col gap-4 mt-4 md:mt-0">
                {!error && !loading && hostels.length > 0 && (
                    <div className="flex items-center gap-2 px-1 mb-1">
                        <button onClick={handleSelectAll} className="focus:outline-none text-gray-400 cursor-pointer flex items-center gap-2">
                            {hostels.length > 0 && hostels.every(h => selectedIds.includes(h._id)) ? (
                                <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                            ) : (
                                <Square className="w-5 h-5" />
                            )}
                            <span className="text-sm font-medium text-gray-600">Select All</span>
                        </button>
                    </div>
                )}
                {loading ? (
                    <MobileSkeletonLoader />
                ) : error ? (
                    <div className="text-center text-red-500 p-8 bg-white rounded-xl shadow-sm border border-gray-100">{error}</div>
                ) : hostels.length === 0 ? (
                    <div className="text-center text-gray-400 p-8 bg-white rounded-xl shadow-sm border border-gray-100">No records found matching your search criteria.</div>
                ) : (
                    hostels.map((hostel) => {
                        const isSelected = selectedIds.includes(hostel._id);
                        return (
                            <div key={hostel._id} className={`bg-white p-4 rounded-xl shadow-sm flex flex-col relative transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                                <button
                                    onClick={() => openEditHostelModal(hostel)}
                                    className="absolute top-4 right-4 text-blue-400 hover:text-[#0A437A] cursor-pointer transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>

                                <div className="flex items-start gap-3">
                                    <div className="mt-3">
                                        <button onClick={() => handleSelectRow(hostel._id)} className="focus:outline-none text-gray-300 cursor-pointer">
                                            {isSelected ? (
                                                <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>

                                    <div
                                        className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 mt-1 cursor-pointer transition-colors hover:bg-[#083561]"
                                        onClick={() => {
                                            setSelectedHostelDetail(hostel);
                                            setView('detail');
                                        }}
                                    >
                                        {hostel.name ? hostel.name.substring(0, 2) : 'NA'}
                                    </div>

                                    <div className="flex-1 min-w-0 pr-6">
                                        <div
                                            className="font-bold text-gray-900 text-base mb-1 cursor-pointer truncate hover:text-[#0A437A] transition-colors"
                                            onClick={() => {
                                                setSelectedHostelDetail(hostel);
                                                setView('detail');
                                            }}
                                        >
                                            {hostel.name}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[10px] sm:text-xs text-gray-500 mb-2">
                                            <div className="flex items-center gap-1">
                                                <Mail className="w-3 h-3 text-gray-400" />
                                                <span className="truncate max-w-[120px]">{hostel.email}</span>
                                            </div>
                                            <span className="hidden sm:inline">-</span>
                                            <div className="flex items-center gap-1">
                                                <Phone className="w-3 h-3 text-gray-400" />
                                                <span>{hostel.phone || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="text-[10px] sm:text-xs text-gray-400 mb-3 truncate">
                                            {hostel.location || 'N/A'} • {hostel.capacity} Capacity
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-auto">
                                    <button
                                        type="button"
                                        onClick={() => handleStatusChangeClick(hostel._id, hostel.isActive)}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-colors
                                            ${hostel.isActive ? 'bg-green-50 text-success hover:bg-green-100' : 'bg-red-50 text-danger hover:bg-red-100'}`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${hostel.isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                        {hostel.isActive ? "Active" : "Inactive"}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
