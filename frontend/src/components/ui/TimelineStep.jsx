import React from 'react';

const getInitials = (name) => {
    if (!name || name === 'user' || name === 'Admin' || name === 'Parent' || name === 'Student') return name[0].toUpperCase();
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
};

export default function TimelineStep({
    title,
    subtitle,
    status,
    formattedDate,
    badgeLabel,
    badgeColor,
    badgeBg,
    nodeColor,
    avatarBg,
    avatarColor
}) {
    const actorName = (subtitle || '').split('-')[0].trim();

    return (
        <div className="relative flex items-center justify-between group">
            <div className="flex items-start gap-5 w-full">
                {/* Node on the timeline */}
                <div
                    className="absolute left-[-24.5px] top-1.5 w-[9px] h-[9px] rounded-full ring-2 ring-white z-10"
                    style={{ backgroundColor: nodeColor }}
                ></div>

                <div className="flex-1 space-y-1.5">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-1.5 font-semibold text-[10px] px-2 py-0.5 rounded-sm" style={{ color: badgeColor, backgroundColor: badgeBg }}>
                        <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: badgeColor }}></span>
                        {badgeLabel}
                    </div>

                    {/* Title */}
                    <h4 className="text-[13px] font-medium text-gray-700 capitalize">{title}</h4>

                    {/* Actor info */}
                    <div className="flex items-center gap-2 mt-1">
                        <div
                            className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[8px] font-bold"
                            style={{ backgroundColor: avatarBg, color: avatarColor }}
                        >
                            {getInitials(actorName)}
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium capitalize">{subtitle}</span>
                    </div>
                </div>
            </div>

            {/* Date on the right */}
            <div className="text-[10px] text-gray-400 font-medium whitespace-nowrap self-end mb-1">
                {formattedDate}
            </div>
        </div>
    );
}
