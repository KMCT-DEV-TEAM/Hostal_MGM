import React, { useRef } from 'react';
import { Pencil } from 'lucide-react';

/**
 * InfoCard - Automatically builds a clean card layout from configuration.
 * Designed to exactly match the reference layout.
 */
export default function InfoCard({
    avatar,        // String (initials) or React Node
    title,         // String
    fields = [],   // Array of { icon: Component, value: String }
    stats = [],    // Array of { label: String, value: React Node }
    status,        // Object { text: String, color: String (e.g. 'green', 'red') }
    onEdit,        // Function
    onClick,       // Function
    selected = false,
    canSelect = false,
    selectionMode = false,
    onSelect
}) {
    const timerRef = useRef(null);

    const handleTouchStart = () => {
        if (!canSelect) return;
        timerRef.current = setTimeout(() => {
            onSelect?.();
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500);
    };

    const handleTouchEndOrMove = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    return (
        <div
            onClick={(e) => {
                if (canSelect && (selected || selectionMode)) {
                    onSelect?.();
                } else if (onClick) {
                    onClick(e);
                }
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEndOrMove}
            onTouchMove={handleTouchEndOrMove}
            onContextMenu={(e) => {
                if (canSelect) {
                    e.preventDefault();
                }
            }}
            className={`
                relative bg-white rounded-xl border p-4 shadow-sm transition-all select-none
                ${onClick || canSelect ? 'cursor-pointer hover:shadow-md hover:border-blue-100' : ''}
                ${selected ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500/50' : 'border-gray-100'}
            `}
        >
            <div className="flex gap-4">
                {/* Left Column: Avatar */}
                {avatar && (
                    <div className="flex-shrink-0">
                        {typeof avatar === 'string' ? (
                            <div className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-semibold text-sm uppercase shadow-sm">
                                {avatar}
                            </div>
                        ) : (
                            avatar
                        )}
                    </div>
                )}

                {/* Right Column: Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">

                    {/* Header: Title */}
                    {title && (
                        <h3 className="text-base font-bold text-[#0A437A] truncate mb-1.5">
                            {title}
                        </h3>
                    )}

                    {/* Middle: Icon Fields */}
                    {fields.length > 0 && (
                        <div className="flex flex-col gap-1.5 ">
                            {fields.map((field, idx) => {
                                const Icon = field.icon;
                                return (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                                        {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />}
                                        <span className="truncate">{field.value || '-'}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {stats && stats.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-50">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="flex flex-col text-center">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</span>
                                    <span className="text-sm font-semibold text-gray-700">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer: Status & Actions */}
                    <div className="flex items-center justify-end gap-3 mt-2">
                        {status && (
                            <div className={`
                                inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md
                                ${status.color === 'green' ? 'bg-green-50 text-green-700' : ''}
                                ${status.color === 'orange' ? 'bg-orange-50 text-orange-700' : ''}
                                ${status.color === 'red' ? 'bg-red-50 text-red-700' : ''}
                                ${status.color === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
                                
                                ${!['green', 'red', 'gray'].includes(status.color) ? 'bg-gray-50 text-gray-700' : ''}
                            `}>
                                <div className={`w-1.5 h-1.5 rounded-full ${status.color === 'green' ? 'bg-green-500' :
                                    status.color === 'red' ? 'bg-red-500' : 'bg-gray-400'
                                    }`} />
                                {status.text}
                            </div>
                        )}

                        {onEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                }}
                                className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
