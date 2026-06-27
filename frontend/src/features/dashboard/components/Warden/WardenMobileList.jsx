import React from 'react';
import { Pencil, Mail, Phone, MapPin, Square, CheckSquare, Loader2 } from 'lucide-react';
import MobileSkeletonLoader from '@/components/ui/MobileSkeletonLoader';
export default function WardenMobileList({
    paginatedWardens,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    setSelectedWardenDetail,
    setView,
    handleStatusChangeClick,
    openEditWardenModal,
    loading,
    error,
    availableHostels = [],
    handleHostelChange
}) {
    const isAllSelected = paginatedWardens.length > 0 && paginatedWardens.every(w => selectedIds.includes(w.id));

    return (
        <div className="md:hidden flex flex-col gap-4 mt-4 md:mt-0 flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {paginatedWardens.length > 0 && (
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
                <MobileSkeletonLoader />
            ) : error ? (
                <div className="text-center text-danger p-8 bg-white rounded-xl shadow-sm border border-gray-100">{error}</div>
            ) : paginatedWardens.length === 0 ? (
                <div className="text-center text-gray-500 p-8 bg-white rounded-xl">No records found matching your search criteria.</div>
            ) : (
                paginatedWardens.map((warden) => {
                    const isSelected = selectedIds.includes(warden.id);
                    return (
                    <div key={warden.id} className={`bg-white p-4 rounded-xl shadow-sm flex flex-col relative border ${isSelected ? 'border-[#0A437A] bg-blue-50/20' : 'border-transparent'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <button
                                onClick={() => handleSelectRow(warden.id)}
                                className="focus:outline-none text-gray-300 cursor-pointer"
                            >
                                {isSelected ? (
                                    <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                                ) : (
                                    <Square className="w-5 h-5" />
                                )}
                            </button>
                            <button
                                onClick={() => openEditWardenModal(warden)}
                                className="text-blue-400 hover:text-[#0A437A] cursor-pointer"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-start gap-4">
                            <div 
                                className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 mt-1 cursor-pointer transition-colors hover:bg-[#083561]"
                                onClick={() => {
                                    setSelectedWardenDetail(warden);
                                    setView('detail');
                                }}
                            >
                                {warden.name ? warden.name.substring(0, 2) : 'NA'}
                            </div>

                            <div className="flex-1 min-w-0 pr-8">
                                <div
                                    className="font-bold text-gray-900 text-base mb-1 cursor-pointer truncate"
                                    onClick={() => {
                                        setSelectedWardenDetail(warden);
                                        setView('detail');
                                    }}
                                >
                                    {warden.name}
                                </div>

                                <div className="flex flex-col gap-1 text-[10px] sm:text-xs text-gray-500 mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                                        <span className="truncate">{warden.email}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                                        <span>{warden.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                        <select
                                            value={warden.hostel?._id || warden.hostel || 'Not Assigned'}
                                            onChange={(e) => handleHostelChange(warden.id, e.target.value)}
                                            className="appearance-none bg-transparent border-none text-[10px] sm:text-xs font-medium text-[#0A437A] cursor-pointer focus:outline-none"
                                        >
                                            <option value="Not Assigned">Not Assigned</option>
                                            {availableHostels.map(h => (
                                                <option key={h._id || h} value={h._id || h}>{h.name || h}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-auto pt-3 border-t border-gray-50">
                            <button 
                                type="button"
                                onClick={() => handleStatusChangeClick(warden.id, warden.status)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-colors
                                        ${warden.status === 'Active' ? 'bg-success/10 text-success hover:bg-success/20' : 'bg-danger/10 text-danger hover:bg-danger/20'}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${warden.status === 'Active' ? 'bg-success' : 'bg-danger'}`}></span>
                                {warden.status === 'Active' ? "Active" : "Inactive"}
                            </button>
                        </div>
                    </div>
                )})
            )}
        </div>
    );
}
