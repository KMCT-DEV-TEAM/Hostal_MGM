import React from 'react';

const NotificationSkeleton = ({ rows = 5 }) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="w-full bg-white rounded-[16px] p-4 flex gap-4 border border-gray-50 shadow-sm">
                    {/* Soft Square Icon */}
                    <div className="w-10 h-10 shrink-0 rounded-[12px] bg-gray-200 animate-pulse" />
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col pt-0.5 space-y-2">
                        {/* Title and Time */}
                        <div className="flex justify-between items-start">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-8" />
                        </div>
                        
                        {/* Sender */}
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                        
                        {/* Description */}
                        <div className="space-y-1.5 pt-1">
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5" />
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};

export default NotificationSkeleton;
