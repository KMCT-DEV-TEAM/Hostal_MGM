import React from 'react';
import AttendanceHeader from '../components/AttendanceHeader';

const WardenAttendance = () => {
    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <AttendanceHeader />
            {/* Warden table will go here */}
        </div>
    );
};

export default WardenAttendance;
