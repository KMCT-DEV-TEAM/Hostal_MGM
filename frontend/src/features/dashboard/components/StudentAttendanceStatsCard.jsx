import React from 'react';
import Swal from 'sweetalert2';
import Button from '@/components/ui/Button';

export default function StudentAttendanceStatsCard({ todayStatus }) {
    const handleGenerateQR = () => {
        Swal.fire({
            title: 'Coming Soon!',
            text: 'QR Code generation will be available shortly.',
            icon: 'info',
            confirmButtonColor: '#0A437A'
        });
    };

    const statusLabel = todayStatus?.status || 'Pending';
    const dateLabel = todayStatus?.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' - ');

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

    return (
        <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className=" font-bold text-sm mb-4">Today's Attendance Status</h2>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-8 text-xs font-medium">
                        <span className=" w-24">Current Status</span>
                        <span className="">:</span>
                        <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(statusLabel)}`}></span>
                            <span className={getStatusTextClass(statusLabel)}>{statusLabel}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 text-xs font-medium">
                        <span className=" w-24">Date</span>
                        <span className="">:</span>
                        <span className="text-gray-700">{dateLabel}</span>
                    </div>
                </div>
            </div>

            <Button
                onClick={handleGenerateQR}
                className="px-6 py-2.5 bg-primary text-white rounded-md font-medium text-xs hover:bg-secondary transition-colors shadow-sm w-full md:w-auto cursor-pointer"
            >
                Generate QR
            </Button>
        </div>
    );
}
