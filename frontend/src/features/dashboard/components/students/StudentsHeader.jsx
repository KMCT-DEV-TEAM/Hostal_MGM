import React from 'react';
import { Pencil } from 'lucide-react';

export default function StudentsHeader({ selectedIds, students, canEdit, canDelete, onEdit, onActivateSelected, onDeactivateSelected }) {
    return (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-6 flex-shrink-0">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Students</h1>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Manage all Students</p>
            </div>

            <div className="flex items-center gap-3">
                {canEdit && selectedIds.length > 0 && (
                    <button
                        onClick={onActivateSelected}
                        className="flex items-center gap-2 px-4 py-2 border border-success text-success bg-green-50/40 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium cursor-pointer"
                    >
                        Active ({selectedIds.length})
                    </button>
                )}

                {canDelete && selectedIds.length > 0 && (
                    <button
                        onClick={onDeactivateSelected}
                        className="flex items-center gap-2 px-4 py-2 border border-danger text-danger bg-red-50/40 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium cursor-pointer"
                    >
                        Inactive ({selectedIds.length})
                    </button>
                )}

                {canEdit && selectedIds.length === 1 && (
                    <button
                        onClick={() => {
                            const target = students.find((s) => (s._id ?? s.id) === selectedIds[0]);
                            if (target && onEdit) onEdit(target);
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-[#0A437A] text-[#0A437A] bg-blue-50/40 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium cursor-pointer"
                    >
                        <Pencil className="w-4 h-4" />
                        Edit
                    </button>
                )}
            </div>
        </div>
    );
}