import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import AttendanceHeader from '../components/attendance/AttendanceHeader';
import AttendanceWindowsTable from '../components/attendance/AttendanceWindowsTable';
import AttendanceRecordsTable from '../components/attendance/AttendanceRecordsTable';
import BackButton from '@/components/ui/BackButton';

const AdminAttendance = () => {
    const { windowId } = useParams();
    const navigate = useNavigate();

    if (windowId) {
        return (
            <div className="w-full h-[calc(100vh-82px)] overflow-y-auto md:overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
                <div className="mb-6">
                    <BackButton text="Back to Windows" onClick={() => navigate('/dashboard/attendance')} />
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
