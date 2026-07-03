import React, { useState } from 'react';
import {
    Square, CheckSquare, Pencil, Mail, Phone, ChevronDown, ChevronUp, Users, Loader2
} from 'lucide-react';
import TableSkeletonLoader from '@/components/ui/TableSkeletonLoader';
import MobileSkeletonLoader from '@/components/ui/MobileSkeletonLoader';
import Dropdown from '@/components/ui/Dropdown';
import { useTranslation } from '@/hooks/useTranslation';

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
    const { t } = useTranslation();
    const [expandedIds, setExpandedIds] = useState([]);

    const toggleExpand = (e, id) => {
        e.stopPropagation();
        setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div
            ref={tableContainerRef}
            className="hidden md:block overflow-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
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
                        <th className="p-4 font-semibold">{t('hostel_name')}</th>
                        <th className="p-4 font-semibold text-start">{t('email')}</th>
                        <th className="p-4 font-semibold text-start">{t('phone')}</th>
                        <th className="p-4 font-semibold text-center">{t('capacity')}</th>
                        <th className="p-4 font-semibold text-center">{t('students')}</th>
                        <th className="p-4 font-semibold text-center">{t('status')}</th>
                        <th className="p-4 font-semibold text-center rounded-tr-xl">{t('action')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-center">
                    {loading ? (
                        <TableSkeletonLoader columns={8} />
                    ) : error ? (
                        <tr>
                            <td colSpan="8" className="p-8 text-center text-danger">{error}</td>
                        </tr>
                    ) : hostels.length === 0 ? (
                        <tr>
                            <td colSpan="8" className="p-8 text-center text-gray-400">{t('no_records_found')}</td>
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
                                            <span>{hostel.studentsCount || 0}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="relative inline-block w-[105px]">
                                            <Dropdown
                                                minWidth=""
                                                options={[
                                                    { value: "Active", label: t('active') },
                                                    { value: "Inactive", label: t('inactive') }
                                                ]}
                                                value={hostel.isActive ? "Active" : "Inactive"}
                                                onChange={() => handleStatusChangeClick(hostel._id, hostel.isActive)}
                                                triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${hostel.isActive ? 'bg-green-50 text-success border-green-200 hover:bg-green-100' : 'bg-red-50 text-danger border-red-200 hover:bg-red-100'}`}
                                            />
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

        </div>
    );
}
