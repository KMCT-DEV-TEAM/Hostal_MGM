import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

/**
 * Automatically builds the desktop table from a column configuration array.
 */
export default function DesktopTable({
    data = [],
    columns = [],
    onRowClick,
    selectedIds = [],
    onSelectAll,
    onSelectRow,
    canSelect = false,
    isSelectableFn,
    pageScrollMode = false,
    loading = false
}) {
    if ((!data || data.length === 0) && !loading) return null;

    const selectableData = isSelectableFn ? data.filter(item => isSelectableFn(item)) : data;
    const isAllSelected = selectableData.length > 0 && selectableData.every(item => selectedIds.includes(item._id || item.id));

    return (
        <div className={`bg-white relative hidden md:block   w-full ${pageScrollMode ? '' : 'flex-1 overflow-auto'}`}>
            <table className="w-full text-start relative table-fixed min-w-full">
                <thead className={`z-20 bg-gray-50/90 backdrop-blur-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${pageScrollMode ? 'sticky top-[70px]' : 'sticky top-0'}`}>
                    <tr className="text-gray-600 text-xs uppercase tracking-wider font-semibold">
                        {canSelect && (
                            <th className="p-4 w-12 text-center align-middle">
                                <button
                                    type="button"
                                    onClick={onSelectAll}
                                    className="focus:outline-none flex items-center justify-center mx-auto transition-colors cursor-pointer"
                                    aria-label="Select all rows"
                                >
                                    {isAllSelected ? (
                                        <CheckSquare className="h-4 w-4 text-[#0A437A]" />
                                    ) : (
                                        <Square className="h-4 w-4 text-gray-400 hover:text-gray-500" />
                                    )}
                                </button>
                            </th>
                        )}

                        {columns.map((col, i) => {
                            if (col.hiddenOnDesktop) return null;
                            const alignClass = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';
                            const widthStyle = col.width ? { width: col.width } : (col.key === 'action' || col.key === 'status' ? { width: '160px' } : {});
                            return (
                                <th
                                    key={col.key || i}
                                    className={`p-4 ${alignClass}`}
                                    style={widthStyle}
                                >
                                    <div className="truncate">{col.header}</div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 text-sm text-gray-700 relative">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, rowIndex) => (
                            <tr key={`skeleton-${rowIndex}`} className="animate-pulse bg-gray-50/30">
                                {canSelect && (
                                    <td className="p-4 text-center align-middle">
                                        <div className="w-4 h-4 bg-gray-200 rounded mx-auto" />
                                    </td>
                                )}
                                {columns.map((col, i) => {
                                    if (col.hiddenOnDesktop) return null;
                                    const alignClass = col.align === 'center' ? 'mx-auto' : col.align === 'right' ? 'ml-auto' : '';
                                    return (
                                        <td key={`skeleton-col-${i}`} className="p-4 align-middle">
                                            {col.type === 'user' ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                                                    <div className="flex flex-col gap-1.5 flex-1">
                                                        <div className="h-4 bg-gray-200 rounded w-24" />
                                                        <div className="h-2.5 bg-gray-200 rounded w-16" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={`h-4 bg-gray-200 rounded w-20 ${alignClass}`} />
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    ) : (
                        data.map((item, index) => {
                            const rowId = item._id || item.id || index;
                            const isSelected = selectedIds.includes(rowId);

                            return (
                                <tr
                                    key={rowId}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    className={`transition-colors group ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50/50'
                                        } ${isSelected ? 'bg-blue-50/30' : ''}`}
                                >
                                    {canSelect && (!isSelectableFn || isSelectableFn(item)) ? (
                                        <td className="p-4 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => onSelectRow(rowId)}
                                                className="focus:outline-none flex items-center justify-center mx-auto cursor-pointer"
                                            >
                                                {isSelected ? (
                                                    <CheckSquare className="w-4 h-4 text-[#0A437A]" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
                                                )}
                                            </button>
                                        </td>
                                    ) : (
                                        canSelect && (
                                            <td className="p-4 text-center align-middle"></td>
                                        )
                                    )}

                                    {columns.map((col, i) => {
                                        if (col.hiddenOnDesktop) return null;

                                        const alignClass = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';

                                        // Complex override check
                                        if (col.renderCell) {
                                            return (
                                                <td key={col.key || i} className={`p-4 align-middle ${alignClass}`}>
                                                    {col.renderCell(item)}
                                                </td>
                                            );
                                        }

                                        const value = col.accessor ? col.accessor(item) : '-';
                                        const Icon = col.icon;
                                        let content = null;

                                        if (col.type === 'badge') {
                                            // Assume value is an object { text, color } or a string
                                            let text = value;
                                            let color = 'gray';

                                            if (value && typeof value === 'object') {
                                                text = value.text;
                                                color = value.color || 'gray';
                                            }

                                            content = (
                                                <div className={`
                                                inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium border rounded-md
                                                ${color === 'green' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                                ${color === 'red' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                                ${color === 'gray' ? 'bg-gray-100 text-gray-700 border-gray-200' : ''}
                                                ${!['green', 'red', 'gray'].includes(color) ? 'bg-gray-50 text-gray-700 border-gray-200' : ''}
                                            `}>
                                                    {text || '-'}
                                                </div>
                                            );
                                        } else if (col.type === 'user') {
                                            const title = col.titleAccessor ? col.titleAccessor(item) : (typeof value === 'string' ? value : '');
                                            const subtitle = col.subtitleAccessor ? col.subtitleAccessor(item) : null;
                                            const avatarStr = col.avatarAccessor ? col.avatarAccessor(item) : title;
                                            const getInitials = (name = "") => name.trim().split(/\s+/).filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || "NA";

                                            content = (
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                        {getInitials(avatarStr)}
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className={`font-medium text-[#777777] transition-colors truncate ${col.truncate ? 'max-w-[150px]' : ''}`} title={title}>
                                                            {title || "-"}
                                                        </span>
                                                        {subtitle && (
                                                            <span className={`text-[11px] text-gray-400 mt-0.5 truncate ${col.truncate ? 'max-w-[150px]' : ''}`} title={subtitle}>
                                                                {subtitle || "-"}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            // Standard text w/ optional icon
                                            content = (
                                                <div className={`flex items-center gap-2 ${alignClass === 'text-center' ? 'justify-center' : alignClass === 'text-right' ? 'justify-end' : 'justify-start'} text-gray-500 overflow-hidden`}>
                                                    {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                                                    <span className="truncate block" title={typeof value === 'string' ? value : ''}>
                                                        {value}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <td key={col.key || i} className={`p-4 align-middle ${alignClass} overflow-hidden`}>
                                                {content}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
