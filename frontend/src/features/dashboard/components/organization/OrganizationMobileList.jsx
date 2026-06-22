import React from 'react';
import { Pencil, Mail, Phone, Square, CheckSquare } from 'lucide-react';
import MobileSkeletonLoader from '@/components/ui/MobileSkeletonLoader';

const OrganizationMobileList = ({
    orgs,
    loading,
    error,
    openModal,
    setSelectedOrganizationDetail,
    setView,
    selectedIds,
    handleSelectAll,
    handleSelectRow
}) => {
    const isAllSelected = orgs.length > 0 && orgs.every(o => selectedIds.includes(o._id));

    return (
        <div className="md:hidden flex flex-col gap-4 mt-4 md:mt-0 flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {!error && orgs.length > 0 && (
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
                <div className="text-center text-danger p-8 bg-white rounded-xl">{error}</div>
            ) : orgs.length === 0 ? (
                <div className="text-center text-gray-500 p-8 bg-white rounded-xl">No organizations match the selected filter.</div>
            ) : (
                orgs.map((o) => {
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
                                onClick={() => openModal('edit', o)}
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
                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-medium
                                ${o.isActive ? 'bg-green-50 text-success' : 'bg-danger/10 text-danger'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${o.isActive ? 'bg-green-600' : 'bg-danger'}`}></span>
                                {o.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </div>
                )})
            )}
        </div>
    );
};

export default OrganizationMobileList;
