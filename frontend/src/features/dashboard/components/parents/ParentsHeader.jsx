import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

export default function ParentsHeader({ selectedIds, parents, onEdit, onActivateSelected, onDeactivateSelected, canEdit, canDelete }) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h1 className="text-2xl font-bold ">Parents</h1>
                <p className="text-xs text-text-secondary mt-1">Manage all Parents</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
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
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <button
                                onClick={onActivateSelected}
                                className="px-4 py-2 bg-white border border-[#23A26D] text-[#23A26D] rounded-lg hover:bg-[#E9F6F0] transition-colors text-sm font-medium whitespace-nowrap shadow-sm"
                            >
                                Activate ({selectedIds.length})
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={onDeactivateSelected}
                                className="px-4 py-2 bg-white border border-[#E33B32] text-[#E33B32] rounded-lg hover:bg-[#FCECEB] transition-colors text-sm font-medium whitespace-nowrap shadow-sm"
                            >
                                Deactivate ({selectedIds.length})
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
