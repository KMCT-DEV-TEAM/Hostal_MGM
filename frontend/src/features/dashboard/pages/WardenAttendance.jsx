import React, { useState } from 'react';
import AttendanceHeader from '../components/AttendanceHeader';
import AttendanceRecordsTable from '../components/AttendanceRecordsTable';

const WardenAttendance = () => {
    const [windowId, setWindowId] = useState(null);

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <AttendanceHeader onStatsFetched={(stats) => setWindowId(stats.windowId)} />
            <div className="mt-8 flex-1 min-h-0 flex flex-col">
                <AttendanceRecordsTable windowId={windowId} />
            </div>
        </div>
    );
};

export default WardenAttendance;
