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
    pageScrollMode = false
}) {
    if (!data || data.length === 0) return null;

    const isAllSelected = data.length > 0 && selectedIds.length === data.length;

    return (
        <div className={`bg-white relative hidden md:block w-full ${pageScrollMode ? '' : 'flex-1 overflow-auto'}`}>
            <table className="w-full text-start relative table-fixed min-w-full">
                <thead className={`z-20 bg-gray-50/90 backdrop-blur-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${pageScrollMode ? 'sticky top-[63px]' : 'sticky top-0'}`}>
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
                            const widthStyle = col.width ? { width: col.width } : (col.key === 'action' || col.key === 'status' ? { width: '120px' } : {});
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
                    {data.map((item, index) => {
                        const rowId = item._id || item.id || index;
                        const isSelected = selectedIds.includes(rowId);

                        return (
                            <tr
                                key={rowId}
                                onClick={() => onRowClick && onRowClick(item)}
                                className={`transition-colors group ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50/50'
                                    } ${isSelected ? 'bg-blue-50/30' : ''}`}
                            >
                                {canSelect && (
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
                    })}
                </tbody>
            </table>
        </div>
    );
}
