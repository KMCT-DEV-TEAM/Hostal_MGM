import React from 'react';
import { Square, CheckSquare, Pencil, Trash2, ChevronDown, Phone, Mail } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import TableSkeletonLoader from '@/components/ui/TableSkeletonLoader';
import Dropdown from '@/components/ui/Dropdown';

export default function ParentsTable({
    parents,
    loading,
    error,
    selectedIds,
    onSelectAll,
    onSelect,
    onStatusChangeRequest,
    onEdit,
    onView,
    canEdit,
    canDelete,
    statusLoadingIds = []
}) {
    const { t } = useTranslation();
    return (
        <div className="hidden md:block flex-1 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
            <table className="w-full text-start relative whitespace-nowrap">
                <thead className="sticky top-0 z-10 bg-[#F8FAFC] shadow-sm">
                    <tr className="text-text-primary text-sm font-semibold border-b border-gray-50">
                        {(canEdit || canDelete) && (
                            <th className="text-gray-300 p-4 w-12">
                                <button onClick={onSelectAll} className="focus:outline-none flex items-center justify-center">
                                    {selectedIds.length > 0 && selectedIds.length === parents.length ?
                                        <CheckSquare className="h-5 w-5 text-primary" /> :
                                        <Square className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                                    }
                                </button>
                            </th>
                        )}
                        {[t('name'), t('email'), t('phone'), t('student'), t('relation'), ...(canEdit ? [t('status')] : [])].map((h, i) => (
                            <th key={i} className="p-4 text-start">{h}</th>
                        ))}
                        {canEdit && <th className="p-4 text-center">{t('action')}</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-text-secondary">
                    {loading ? (
                        <TableSkeletonLoader columns={canEdit ? 8 : (canDelete ? 6 : 5)} />
                    ) : error ? (
                        <tr>
                            <td colSpan={canEdit ? 8 : (canDelete ? 6 : 5)} className="p-8 text-center text-red-500">
                                {error}
                            </td>
                        </tr>
                    ) : parents.length === 0 ? (
                        <tr>
                            <td colSpan={canEdit ? 8 : (canDelete ? 6 : 5)} className="p-8 text-center text-gray-500">
                                No parents match the selected filter.
                            </td>
                        </tr>
                    ) : (
                        parents.map((p) => {
                            const rowId = p._id || p.id;
                            const isSelected = selectedIds.includes(rowId);
                            const isLoading = statusLoadingIds.includes(rowId);
                            return (
                                <tr key={rowId} className={`hover:bg-gray-50/40 transition-colors ${isSelected ? 'bg-blue-50/20' : ''} ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {(canEdit || canDelete) && (
                                        <td className="p-4">
                                            <button onClick={() => onSelect && onSelect(rowId)} className="focus:outline-none flex items-center justify-center">
                                                {isSelected ?
                                                    <CheckSquare className="w-5 h-5 text-[#0A437A]" /> :
                                                    <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                                                }
                                            </button>
                                        </td>
                                    )}
                                    <td
                                        className="p-4 flex items-center gap-3 font-medium text-text-secondary cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => onView && onView(p)}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shadow-sm cursor-pointer">
                                            {p.parentName?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                        </div>
                                        {p.parentName}
                                    </td>
                                    <td className="p-4 text-text-secondary"><Mail className="w-3 h-3 inline mr-2 text-gray-400" />{p.email}</td>
                                    <td className="p-4 text-text-secondary"><Phone className="w-3 h-3 inline mr-2 text-gray-400" />{p.phone}</td>
                                    <td className="p-4 text-text-secondary font-medium">{p.student?.name ?? "No Student"}</td>
                                    <td className="p-4 text-text-secondary">
                                        <div className='border border-gray-300 w-24 px-4 py-1 rounded-md font-medium text-center'>
                                            {p.relationship
                                                ? p.relationship.charAt(0).toUpperCase() + p.relationship.slice(1).toLowerCase()
                                                : ""}
                                        </div>
                                    </td>
                                    {canEdit && (
                                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="relative inline-block w-[105px]">
                                                <Dropdown
                                                    minWidth=""
                                                    options={[
                                                        { value: "Active", label: "Active" },
                                                        { value: "Inactive", label: "Inactive" }
                                                    ]}
                                                    value={(p.isActive === true || p.isActive === 'true') ? 'Active' : 'Inactive'}
                                                    onChange={(val) =>
                                                        onStatusChangeRequest?.(
                                                            p,
                                                            val === 'Active'
                                                        )
                                                    }
                                                    triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${
                                                        (p.isActive === true || p.isActive === 'true')
                                                            ? 'bg-green-50 text-success border-green-200 hover:bg-green-100'
                                                            : 'bg-red-50 text-danger border-red-200 hover:bg-red-100'
                                                    }`}
                                                />
                                            </div>
                                        </td>
                                    )}
                                    {canEdit && (
                                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex text-primary items-center justify-center">
                                                <button onClick={() => onEdit && onEdit(p)} className="hover:text-secondary focus:outline-none transition-colors p-1 cursor-pointer">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        }))}
                </tbody>
            </table>
        </div>
    );
}
