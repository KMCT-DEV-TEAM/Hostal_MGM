import React from 'react';

const AnnouncementSkeleton = () => {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col h-full animate-pulse">
            <div className="flex justify-between items-start mb-3 gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <div className="bg-gray-200 w-10 h-10 rounded-lg flex-shrink-0 mt-0.5"></div>
                    <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>

            <div className="flex-1 mt-1 mb-4 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6"></div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                    <div className="w-16 h-5 bg-gray-200 rounded-full"></div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-20 h-3 bg-gray-200 rounded"></div>
                    <div className="w-20 h-3 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementSkeleton;
