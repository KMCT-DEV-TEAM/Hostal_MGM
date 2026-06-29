import React from 'react';

const StudentAttendance = () => {
    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <div className="flex flex-col p-4 sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        View your attendance history and calendar.
                    </p>
                </div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 mt-6">
                <p className="text-gray-500 text-sm">Student attendance view coming soon...</p>
            </div>
        </div>
    );
};

export default StudentAttendance;
