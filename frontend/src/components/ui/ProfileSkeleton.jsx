import React from 'react';

export default function ProfileSkeleton() {
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto w-full animate-pulse">
            {/* Header Section */}
            <div className="mb-8">
                <div className="h-8 bg-gray-200 rounded-md w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-72"></div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Profile Overview (Top Section) */}
                <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gray-200 shadow-sm flex-shrink-0"></div>
                    <div className="flex-1">
                        <div className="h-7 bg-gray-200 rounded-md w-40 mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-24"></div>
                    </div>
                </div>

                {/* Personal Information Section */}
                <div className="border-b border-gray-100 last:border-0">
                    <div className="px-6 sm:px-8 py-5 bg-gray-50/50 flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-32"></div>
                    </div>

                    <div className="px-6 sm:px-8 pb-6">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="grid grid-cols-1 sm:grid-cols-3 py-5 border-b border-gray-50 items-center gap-4">
                                <div className="h-4 bg-gray-200 rounded-md w-24"></div>
                                <div className="sm:col-span-2">
                                    <div className="h-5 bg-gray-200 rounded-md w-full max-w-sm"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Account Settings Section */}
                <div className="border-b border-gray-100 last:border-0">
                    <div className="px-6 sm:px-8 pb-6 pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 py-4 border-t border-gray-50 items-center gap-4">
                            <div className="h-4 bg-gray-200 rounded-md w-24"></div>
                            <div className="sm:col-span-2">
                                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
