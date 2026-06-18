import React from 'react';
import { Pencil, Mail, Phone, Square, CheckSquare, User } from 'lucide-react';

const ParentsMobileList = ({
    parents = [],
    error,
    selectedIds = [],
    onSelectAll,
    onSelect,
    onEdit,
    onView,
    statusLoadingIds = []
}) => {
    const isAllSelected = parents.length > 0 && parents.every(p => {
        const rowId = p._id || p.id;
        return selectedIds.includes(rowId);
    });

    return (
        <div className="md:hidden flex flex-col gap-4 mt-4 md:mt-0 flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none px-2 sm:px-0">
            {!error && parents.length > 0 && (
                <div className="flex items-center gap-2 px-1 mb-1">
                    <button onClick={onSelectAll} className="focus:outline-none text-gray-400 cursor-pointer flex items-center gap-2">
                        {isAllSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                            <Square className="w-5 h-5" />
                        )}
                        <span className="text-sm font-medium text-gray-600">Select All</span>
                    </button>
                </div>
            )}
            {error ? (
                <div className="text-center text-red-500 p-8 bg-white rounded-xl">{error.message || error}</div>
            ) : parents.length === 0 ? (
                <div className="text-center text-gray-500 p-8 bg-white rounded-xl border border-gray-100">No parents match the selected filter.</div>
            ) : (
                parents.map((p) => {
                    const rowId = p._id || p.id;
                    const isSelected = selectedIds.includes(rowId);
                    const isLoading = statusLoadingIds.includes(rowId);

                    return (
                        <div key={rowId} className={`bg-white p-4 rounded-xl shadow-sm flex flex-col relative border ${isSelected ? 'border-primary bg-blue-50/20' : 'border-gray-100'} ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex justify-between items-start mb-3">
                                <button
                                    onClick={() => onSelect(rowId)}
                                    className="focus:outline-none text-gray-300 cursor-pointer"
                                >
                                    {isSelected ? (
                                        <CheckSquare className="w-5 h-5 text-primary" />
                                    ) : (
                                        <Square className="w-5 h-5" />
                                    )}
                                </button>
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(p)}
                                        className="text-blue-400 hover:text-primary cursor-pointer"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 mt-1">
                                    {p.parentName ? p.parentName.substring(0, 2) : 'NA'}
                                </div>

                                <div className="flex-1 min-w-0 pr-6">
                                    <div
                                        className="font-bold text-primary text-base mb-1 cursor-pointer truncate hover:text-primary transition-colors"
                                        onClick={() => onView && onView(p)}
                                    >
                                        {p.parentName}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[10px] sm:text-xs text-gray-500 mb-2">
                                        <div className="flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            <span className="truncate max-w-[120px]">{p.email}</span>
                                        </div>
                                        <span className="hidden sm:inline">-</span>
                                        <div className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            <span>{p.phone || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1 text-[10px] sm:text-xs text-gray-400 mb-3 truncate">
                                        <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            <span className="truncate">Student: {typeof p.student === 'object' ? p.student?.name : p.student}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className="font-medium text-gray-500">Relation:</span> <span className="capitalize">{p.relationship}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-auto">
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-medium
                                ${p.isActive ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                    {p.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>
                    )
                })
            )}
        </div>
    );
};

export default ParentsMobileList;
