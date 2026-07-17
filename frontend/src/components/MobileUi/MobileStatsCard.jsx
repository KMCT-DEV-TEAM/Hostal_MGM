import React from 'react';

/**
 * MobileStatsCard
 * A reusable mobile card for displaying up to 3 or 4 key statistics.
 * 
 * @param {Object[]} stats - Array of stat objects.
 * @param {string} stats[].value - The large text value (e.g., "90%", "01")
 * @param {string} stats[].label - The small text label (e.g., "Attendance")
 * @param {string} [stats[].valueColor] - Optional Tailwind text color class (e.g., "text-blue-600")
 */
export default function MobileStatsCard({ stats = [] }) {
    if (!stats || stats.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex items-center justify-around w-full">
            {stats.map((stat, index) => (
                <div key={index} className="flex flex-col items-center justify-center text-center flex-1">
                    <span
                        className={`text-lg font-bold mb-1 ${stat.valueColor || 'text-text-primary'}`}
                    >
                        {stat.value}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium tracking-wide">
                        {stat.label}
                    </span>
                </div>
            ))}
        </div>
    );
}
