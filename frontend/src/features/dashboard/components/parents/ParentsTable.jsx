import React from 'react';
import { Square, CheckSquare, Pencil, Trash2, ChevronDown, Phone, Mail } from 'lucide-react';

export default function ParentsTable({
    parents,
    selectedIds,
    onSelectAll,
    onSelect,
    onStatusChangeRequest,
    onEdit,
    onView,
    statusLoadingIds = []
}) {
    return (
        <div className="hidden md:block h-full overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
            <table className="w-full text-start relative">
                <thead className="sticky top-0 z-10 bg-[#F8FAFC] shadow-sm">
                    <tr className="text-text-primary text-sm font-semibold border-b border-gray-50">
                        <th className="text-gray-300 p-4 w-12">
                            <button onClick={onSelectAll} className="focus:outline-none flex items-center justify-center">
                                {selectedIds.length > 0 && selectedIds.length === parents.length ?
                                    <CheckSquare className="h-5 w-5 text-[#0A437A]" /> :
                                    <Square className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                                }
                            </button>
                        </th>
                        {['Name', 'Email', 'Phone', 'Student', 'Relation', 'Status', 'Action'].map(h => (
                            <th key={h} className="p-4">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-text-secondary">
                    {parents.map((p) => {
                        const rowId = p._id || p.id;
                        const isSelected = selectedIds.includes(rowId);
                        const isLoading = statusLoadingIds.includes(rowId);
                        return (
                            <tr key={rowId} className={`hover:bg-gray-50/40 transition-colors ${isSelected ? 'bg-blue-50/20' : ''} ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                                <td className="p-4">
                                    <button onClick={() => onSelect && onSelect(rowId)} className="focus:outline-none flex items-center justify-center">
                                        {isSelected ?
                                            <CheckSquare className="w-5 h-5 text-[#0A437A]" /> :
                                            <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                                        }
                                    </button>
                                </td>
                                <td
                                    className="p-4 flex items-center gap-3 font-medium text-gray-700 cursor-pointer hover:text-[#0A437A] transition-colors"
                                    onClick={() => onView && onView(p)}
                                >
                                    <div className="w-8 h-8 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                        {p.parentName?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </div>
                                    {p.parentName}
                                </td>
                                <td className="p-4 text-gray-500"><Mail className="w-3 h-3 inline mr-2 text-gray-400" />{p.email}</td>
                                <td className="p-4 text-gray-500"><Phone className="w-3 h-3 inline mr-2 text-gray-400" />{p.phone}</td>
                                <td className="p-4 text-gray-700 font-medium">{p.student?.name ?? "No Student"}</td>
                                <td className="p-4 text-gray-700 font-medium">{p.relationship?.toUpperCase()}</td>
                                <td className="p-4">
                                    <div className="relative w-fit">
                                        <select
                                            value={p.isActive ? 'Active' : 'Inactive'}
                                            onChange={(e) =>
                                                onStatusChangeRequest?.(
                                                    p,
                                                    e.target.value === 'Active'
                                                )
                                            }
                                            className={`appearance-none rounded-full pl-3 pr-8 py-1.5 text-xs font-semibold border outline-none cursor-pointer
        ${p.isActive
                                                    ? 'bg-green-50 text-success border-green-200/60'
                                                    : 'bg-red-50 text-danger border-red-200/60'
                                                }`}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>

                                        <ChevronDown
                                            size={14}
                                            className={`absolute right-2.5 top-1.5 pointer-events-none
                                                ${p.isActive === "true" ? "text-success" : "text-danger"}`}
                                        />
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex text-primary items-center">
                                        <button onClick={() => onEdit && onEdit(p)} className="hover:text-secondary focus:outline-none transition-colors p-1 cursor-pointer">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
