import React from 'react';
import { Pencil, Mail, Phone, MapPin } from 'lucide-react';

export default function WardenMobileList({
    paginatedWardens,
    selectedIds,
    handleSelectRow,
    setSelectedWardenDetail,
    setView,
    handleStatusChangeClick,
    openEditWardenModal
}) {
    return (
        <div className="md:hidden flex flex-col gap-4 mt-4 md:mt-0">
            {paginatedWardens.length === 0 ? (
                <div className="text-center text-gray-500 p-8 bg-white rounded-xl">No records found matching your search criteria.</div>
            ) : (
                paginatedWardens.map((warden) => (
                    <div key={warden.id} className="bg-white p-4 rounded-xl shadow-sm flex flex-col relative border border-gray-100">
                        <div className="absolute top-4 right-4 flex gap-2">
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(warden.id)}
                                onChange={() => handleSelectRow(warden.id)}
                                className="w-4 h-4 rounded border-gray-300 text-[#0A437A] focus:ring-[#0A437A] cursor-pointer"
                            />
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
                                        <span className="truncate text-primary font-medium">{warden.hostel || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                            <button
                                onClick={() => openEditWardenModal(warden)}
                                className="text-gray-400 hover:text-[#0A437A] p-1 transition-colors cursor-pointer"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>

                            <button 
                                type="button"
                                onClick={() => handleStatusChangeClick(warden.id, warden.status)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium cursor-pointer transition-colors
                                        ${warden.status === 'Active' ? 'bg-green-50 text-success hover:bg-green-100' : 'bg-red-50 text-danger hover:bg-red-100'}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${warden.status === 'Active' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                {warden.status === 'Active' ? "Active" : "Inactive"}
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
