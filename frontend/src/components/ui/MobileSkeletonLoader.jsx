import React from 'react';

const MobileSkeletonLoader = ({ rows = 5 }) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="bg-white p-4 rounded-xl shadow-sm flex flex-col relative border border-transparent">
                    <div className="flex justify-between items-start mb-3">
                        <div className="w-5 h-5 rounded bg-gray-200 animate-pulse" />
                        <div className="w-4 h-4 rounded bg-gray-200 animate-pulse" />
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse shrink-0 mt-1" />
                        
                        <div className="flex-1 min-w-0 pr-6 space-y-3">
                            <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
                            <div className="flex gap-2">
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
                            </div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <div className="w-16 h-6 rounded-lg bg-gray-200 animate-pulse" />
                    </div>
                </div>
            ))}
        </>
    );
};

export default MobileSkeletonLoader;
