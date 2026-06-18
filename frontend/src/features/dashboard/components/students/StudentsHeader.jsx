import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

export default function StudentsHeader({ selectedIds, students, canEdit, canDelete, onEdit, onActivateSelected, onDeactivateSelected }) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Students</h1>
                <p className="text-xs text-gray-400 mt-1">Manage all Students</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {canEdit && selectedIds.length > 0 && (
                    <button
                        onClick={onActivateSelected}
                        className="hidden md:flex items-center gap-2 px-4 py-2 border border-success text-success bg-green-50/40 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                    >
                        Active ({selectedIds.length})
                    </button>
                )}

                {canDelete && selectedIds.length > 0 && (
                    <button
                        onClick={onDeactivateSelected}
                        className="hidden md:flex items-center gap-2 px-4 py-2 border border-red-200 text-danger bg-red-50/40 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                        Inactive ({selectedIds.length})
                    </button>
                )}

                {canEdit && selectedIds.length === 1 && (
                    <button
                        onClick={() => {
                            const target = students.find((student) => (student._id ?? student.id) === selectedIds[0]);
                            if (target && onEdit) onEdit(target);
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-[#0A437A] text-[#0A437A] bg-blue-50/40 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                    >
                        <Pencil className="w-4 h-4" />
                        Edit
                    </button>
                )}
            </div>
        </div>
    );
}
