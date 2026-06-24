import React from 'react';
import { Pencil, Mail, Phone } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import ListTable from '@/components/ui/ListTable';
import Dropdown from '@/components/ui/Dropdown';
import { ROLES } from '@/constants/roles';

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
    statusLoadingIds = [],
    role
}) {
    const { t } = useTranslation();

    const headers = [
        t('name'),
        t('email'),
        t('phone'),
        t('student'),
        ...(role === ROLES.SUPER_ADMIN || role === ROLES.WARDEN ? [t('organization')] : []),
        ...(canEdit ? [t('status')] : []),
        ...(canEdit ? [{ label: t('action'), align: 'center' }] : [])
    ];

    return (
        <ListTable
            headers={headers}
            items={parents}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectAll={onSelectAll}
            onSelect={onSelect}
            canSelect={canEdit || canDelete}
            statusLoadingIds={statusLoadingIds}
            emptyText="No parents match the selected filter."
            renderRow={(p) => (
                <>
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
                    {(role === ROLES.SUPER_ADMIN || role === ROLES.WARDEN) && (
                        <td className="p-4 text-text-secondary font-medium">{p.organization?.name || "N/A"}</td>
                    )}
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
                                    triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${(p.isActive === true || p.isActive === 'true')
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
                </>
            )}
        />
    );
}
