import React from 'react';

export default function DetailsSkeletonLoader() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 mt-4 animate-pulse">
            {/* LEFT COLUMN SKELETON */}
            <div className="space-y-6">
                <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/4 mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                        <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                    </div>
                </div>
                <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/4 mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN SKELETON */}
            <div className="space-y-6">
                <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/3 mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-3 bg-gray-100 rounded w-full"></div>
                        <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                        <div className="h-3 bg-gray-100 rounded w-4/5"></div>
                    </div>
                </div>
                <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/3 mb-6"></div>
                    <div className="space-y-3">
                        <div className="h-14 bg-gray-100 rounded w-full"></div>
                        <div className="h-14 bg-gray-100 rounded w-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
