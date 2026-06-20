import React from 'react';

export default function SettingsSkeleton() {
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto w-full animate-pulse">
            {/* Header Section */}
            <div className="mb-8">
                <div className="h-8 bg-gray-200 rounded-md w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-72"></div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Security Section */}
                <div className="border-b border-gray-100 last:border-0">
                    <div className="px-6 sm:px-8 py-5 bg-gray-50/50 flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-32"></div>
                    </div>

                    <div className="px-6 sm:px-8 py-6 max-w-md space-y-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item}>
                                <div className="h-4 bg-gray-200 rounded-md w-32 mb-1"></div>
                                <div className="h-10 bg-gray-200 rounded-md w-full"></div>
                            </div>
                        ))}
                        <div className="pt-2">
                            <div className="h-10 bg-gray-200 rounded-md w-32"></div>
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="border-b border-gray-100 last:border-0">
                    <div className="px-6 sm:px-8 py-5 bg-gray-50/50 flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-32"></div>
                    </div>

                    <div className="px-6 sm:px-8 py-6 space-y-6">
                        {[1, 2].map((item) => (
                            <div key={item} className="flex items-center justify-between">
                                <div>
                                    <div className="h-4 bg-gray-200 rounded-md w-32 mb-1"></div>
                                    <div className="h-3 bg-gray-200 rounded-md w-48"></div>
                                </div>
                                <div className="h-6 w-11 bg-gray-200 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preferences Section */}
                <div>
                    <div className="px-6 sm:px-8 py-5 bg-gray-50/50 flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-32"></div>
                    </div>

                    <div className="px-6 sm:px-8 py-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                            <div>
                                <div className="h-4 bg-gray-200 rounded-md w-24 mb-1"></div>
                                <div className="h-10 bg-gray-200 rounded-md w-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
