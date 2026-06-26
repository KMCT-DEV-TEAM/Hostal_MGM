import React from 'react';

export default function StatsCard({ label, icon: Icon, iconBg = 'bg-blue-50 text-primary', value, sub, borderColor = 'border-gray-100' }) {
    return (
        <div className={`bg-white rounded-lg p-5 shadow-sm border border-gray-100 flex justify-between items-start ${borderColor}`}>
            <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {label}
                </p>
                <h3 className="text-2xl font-bold text-gray-900">
                    {value}
                </h3>
                {sub && <div className="text-[12px] text-[#9CA3AF] mt-1">{sub}</div>}
            </div>
            <div className={`p-1.5 rounded ${iconBg} shrink-0 flex items-center justify-center`}>
                {Icon}
            </div>
        </div>
    );
}
