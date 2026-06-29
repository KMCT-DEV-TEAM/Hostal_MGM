import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import AttendanceHeader from '../components/AttendanceHeader';
import AttendanceWindowsTable from '../components/AttendanceWindowsTable';
import AttendanceRecordsTable from '../components/AttendanceRecordsTable';

const AdminAttendance = () => {
    const [selectedWindowId, setSelectedWindowId] = useState(null);

    if (selectedWindowId) {
        return (
            <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                    <button 
                        onClick={() => setSelectedWindowId(null)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
                        <p className="text-sm text-gray-500 mt-1">Viewing student attendance for the selected window.</p>
                    </div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col">
                    <AttendanceRecordsTable windowId={selectedWindowId} />
                </div>
            </div>
        );
    }
    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <AttendanceHeader />
            <div className="mt-8 flex-1 min-h-0 flex flex-col">
                <AttendanceWindowsTable 
                    showHostel={true} 
                    showWarden={true} 
                    onRowClick={(window) => setSelectedWindowId(window._id)} 
                />
            </div>
        </div>
    );
};

export default AdminAttendance;
