import React from 'react';

export default function CourseHeader() {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-2 sm:gap-4 shrink-0">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Course Management</h1>
                <p className="text-[10px] sm:text-xs text-[#777777] mt-0.5 sm:mt-1">Manage and organize courses across all organizations</p>
            </div>
        </div>
    );
}
