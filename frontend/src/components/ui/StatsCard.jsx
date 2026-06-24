import React from 'react';

export default function StatsCard({ label, icon: Icon, iconBg = 'bg-blue-50 text-primary', value, sub, borderColor = 'border-gray-100' }) {
    return (
        <div className={`bg-white rounded-xl p-5 border border-t ${borderColor}`}>
            <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500 font-medium leading-tight">
                    {label}
                </span>

                <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center text-sm shrink-0`}>
                    {Icon}
                </div>
            </div>

            <div className="text-[24px] font-semibold tracking-tight mt-2">
                {value}
            </div>

            {sub && <div className="text-[12px] text-[#9CA3AF] mt-1">{sub}</div>}
        </div>
    );
}
