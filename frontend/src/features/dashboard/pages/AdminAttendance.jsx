import React from 'react';
import AttendanceHeader from '../components/AttendanceHeader';

const AdminAttendance = () => {
    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <AttendanceHeader />
            {/* Admin table will go here */}
        </div>
    );
};

export default AdminAttendance;
