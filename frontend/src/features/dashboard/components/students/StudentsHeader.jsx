import React from 'react';

export default function StudentsHeader() {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-2 sm:gap-4 flex-shrink-0">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Students</h1>
                <p className="text-[10px] sm:text-xs text-[#777777] mt-0.5 sm:mt-1">Manage all students</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            </div>
        </div>
    );
}