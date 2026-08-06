import React from 'react';

export default function DetailRow({ label, value, icon, valueClassName = '' }) {
    return (
        <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] items-center py-1.5 text-xs sm:text-sm">
            <div className="text-gray-500 flex items-center gap-2">
                {icon && <span className="text-gray-400">{icon}</span>}
                {label}
            </div>
            <div className="flex items-center gap-3">
                <span className="text-gray-400">:</span>
                <div className={`font-medium text-gray-700 flex-1 ${valueClassName}`}>
                    {value}
                </div>
            </div>
        </div>
    );
}
