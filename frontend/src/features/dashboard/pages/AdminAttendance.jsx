import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import AttendanceHeader from '../components/attendance/AttendanceHeader';
import AttendanceWindowsTable from '../components/attendance/AttendanceWindowsTable';
import AttendanceRecordsTable from '../components/attendance/AttendanceRecordsTable';
import BackButton from '@/components/ui/BackButton';
import PageHeader from '@/components/ui/PageHeader';

const AdminAttendance = () => {
    const { windowId } = useParams();
    const navigate = useNavigate();

    if (windowId) {
        return (
            <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
                <div className="p-4 md:p-6 flex-1 flex flex-col">
                    <div className="mb-6">

                    <PageHeader
                        title="Attendance Records"
                        subtitle="Viewing student attendance for the selected window."
                        actionButton={<BackButton text="Back to Windows" onClick={() => navigate('/dashboard/attendance')} />}
                    />
                </div>
                    <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col">
                        <AttendanceRecordsTable windowId={windowId} />
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <AttendanceHeader />
                <div className="mt-8 bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col">
                    <AttendanceWindowsTable
                        showHostel={true}
                        showWarden={true}
                        onRowClick={(window) => navigate(`/dashboard/attendance/${window.id || window.id}`)}
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminAttendance;
