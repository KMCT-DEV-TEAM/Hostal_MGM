import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

export default function ParentsHeader({ selectedIds, parents, onEdit, onDeleteSelected }) {
    return (
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Parents</h1>
                <p className="text-xs text-gray-400 mt-1">Manage all Parents</p>
            </div>
            <div className="flex items-center gap-3">
                {selectedIds.length === 1 && (
                    <button
                        onClick={() => {
                            const target = parents.find(p => p.id === selectedIds[0]);
                            if (target && onEdit) onEdit(target);
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-[#0A437A] text-[#0A437A] bg-blue-50/40 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                    >
                        <Pencil className="w-4 h-4" />
                        Edit
                    </button>
                )}

                {selectedIds.length > 0 && (
                    <button
                        onClick={onDeleteSelected}
                        className="flex items-center gap-2 px-4 py-2 border border-red-200 text-danger rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete ({selectedIds.length})
                    </button>
                )}
            </div>
        </div>
    );
}
