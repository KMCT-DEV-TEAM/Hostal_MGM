import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import AttendanceHeader from '../components/AttendanceHeader';
import AttendanceWindowsTable from '../components/AttendanceWindowsTable';
import AttendanceRecordsTable from '../components/AttendanceRecordsTable';

const AdminAttendance = () => {
    const { windowId } = useParams();
    const navigate = useNavigate();

    if (windowId) {
        return (
            <div className="w-full h-[calc(100vh-82px)] overflow-y-auto md:overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                    <button 
                        onClick={() => navigate('/dashboard/attendance')}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
                        <p className="text-sm text-gray-500 mt-1">Viewing student attendance for the selected window.</p>
                    </div>
                </div>
                <div className="flex-1 md:min-h-0 flex flex-col">
                    <AttendanceRecordsTable windowId={windowId} />
                </div>
            </div>
        );
    }
    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto md:overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <AttendanceHeader />
            <div className="mt-8 flex-1 md:min-h-0 flex flex-col">
                <AttendanceWindowsTable 
                    showHostel={true} 
                    showWarden={true} 
                    onRowClick={(window) => navigate(`/dashboard/attendance/${window._id || window.id}`)} 
                />
            </div>
        </div>
    );
};

export default AdminAttendance;
