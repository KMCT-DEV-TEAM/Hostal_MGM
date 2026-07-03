import React, { useState } from 'react';
import { Pencil, Mail, Phone, Users } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import ListTable from '@/components/ui/ListTable';
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

    const headers = [
        t('hostel_name'),
        t('email'),
        t('phone'),
        { label: t('capacity'), align: 'center' },
        { label: t('students'), align: 'center' },
        { label: t('status'), align: 'center' },
        { label: t('action'), align: 'center' }
    ];

    const renderRow = (hostel, index, isSelected, isLoading) => (
        <>
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
        </>
    );

    return (

        <ListTable
            headers={headers}
            items={hostels}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelectRow}
            canSelect={true}
            emptyText={t('no_records_found')}
            renderRow={renderRow}
        />

    );
}
