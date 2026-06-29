import React from 'react';
import { User, BookOpen, Building2, Calendar, Clock } from 'lucide-react';

export default function ParentAttendanceStatsCards({ studentInfo, todayStatus, summary }) {

    // Status text formatting
    const statusLabel = todayStatus?.status || 'Pending';
    const markedOn = todayStatus?.markedAt || '-- : --';
    const todayDate = todayStatus?.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' - ');

    const getStatusDotClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'present': return 'bg-success';
            case 'absent': return 'bg-danger';
            default: return 'bg-warning';
        }
    };

    const getStatusTextClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'present': return 'text-success';
            case 'absent': return 'text-danger';
            default: return 'text-warning';
        }
    };

    // const studentInfo = [
    //     {

    //     }
    // ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Student Info Card */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm flex flex-col justify-center">
                <h2 className="font-bold text-sm mb-4">{studentInfo?.name || 'Loading...'}</h2>
                <div className="flex flex-col gap-3 text-xs font-medium text-gray-500">
                    <div className="flex items-center gap-4">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="w-24">Admission No</span>
                        <span>:</span>
                        <span className="text-gray-900 font-semibold">{studentInfo?.admissionNo || '---'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                        <span className="w-24">Course</span>
                        <span>:</span>
                        <span className="text-gray-900 font-semibold">{studentInfo?.course || '---'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="w-24">Hostel</span>
                        <span>:</span>
                        <span className="text-gray-900 font-semibold">{studentInfo?.hostel?.name || studentInfo?.hostel || '---'}</span>
                    </div>
                </div>
            </div>

            {/* Today's Attendance Card */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm flex flex-col justify-center">
                <h2 className="font-bold text-sm mb-4">Today's Attendance</h2>
                <div className="flex flex-col gap-3 text-xs font-medium text-gray-500">
                    <div className="flex items-center gap-4">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="w-20">Date</span>
                        <span>:</span>
                        <span className="text-gray-900">{todayDate}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-3.5 h-3.5" /> {/* Spacer */}
                        <span className="w-20">Status</span>
                        <span>:</span>
                        <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(statusLabel)}`}></span>
                            <span className={getStatusTextClass(statusLabel)}>{statusLabel}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="w-20">Marked on</span>
                        <span>:</span>
                        <span className="text-gray-900">{markedOn}</span>
                    </div>
                </div>
            </div>

            {/* Attendance Summary Card */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm flex flex-col justify-center">
                <h2 className="font-bold text-sm mb-4">Attendance summary</h2>
                <div className="flex flex-col gap-3 text-xs font-medium text-gray-500">
                    <div className="flex items-center gap-4">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="w-20">Present</span>
                        <span>:</span>
                        <span className="text-gray-900 font-semibold">{summary?.present || 0}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="w-20">Absent</span>
                        <span>:</span>
                        <span className="text-gray-900 font-semibold">{summary?.absent || 0}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-3.5 h-3.5" /> {/* Spacer */}
                        <span className="w-20">% Rate</span>
                        <span>:</span>
                        <span className="text-gray-900 font-semibold">{summary?.percentage || 0}%</span>
                    </div>
                </div>
            </div>

        </div>
    );
}

const StudentInfoCard = ({ studentInfo }) => {
    return (
        <div className="flex items-center gap-4">
            <div className="w-3.5 h-3.5" /> {/* Spacer */}
            <span className="w-20">% Rate</span>
            <span>:</span>
            <span className="text-gray-900 font-semibold">{summary?.percentage || 0}%</span>
        </div>
    )
}