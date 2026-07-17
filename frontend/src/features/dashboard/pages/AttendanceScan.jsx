import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import attendanceService from '@/services/attendance.service';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Calendar, Clock, GraduationCap, CalendarCheck, Scan, Maximize, Search, UserCheck, ArrowLeft } from 'lucide-react';
import ScanQRModal from '../components/ScanQRModal';
import ConfirmStudentModal from '../components/ConfirmStudentModal';
import AttendanceSuccessModal from '../components/attendance/AttendanceSuccessModal';
import PageHeader from '@/components/ui/PageHeader';
import BackButton from '@/components/ui/BackButton';

// Using a basic fallback base64 decoder since jwt-decode wasn't installed
const decodeJWT = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        return null;
    }
};

export default function AttendanceScan() {
    const { windowId } = useParams();
    const { user } = useAuthStore();

    const [windowData, setWindowData] = useState(null);
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sessionScanned, setSessionScanned] = useState([]);

    // Modal states
    const [isScanOpen, setIsScanOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [successDate, setSuccessDate] = useState(new Date());
    const [scannedStudent, setScannedStudent] = useState(null);
    const [rawToken, setRawToken] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);

            const recordsResponse = await attendanceService.getRecordsByRole(user.role, windowId, { limit: 1000 });
            setRecords(recordsResponse?.records || []);
            // totalStudents should be fetched from recordsResponse if provided
            if (recordsResponse?.totalStudentsCount !== undefined) {
                setWindowData(prev => ({ ...prev, totalStudents: recordsResponse.totalStudentsCount }));
            }

        } catch (error) {
            console.log(error)
            showErrorToast('Failed to load scanning data', error.message);
        } finally {
            setIsLoading(false);
        }
    }, [windowId, user?.role]);

    const location = useLocation();

    useEffect(() => {
        fetchData();

        if (location.state?.autoOpenScanner) {
            setIsScanOpen(true);
            // Clean up state so it doesn't reopen on refresh
            window.history.replaceState({}, document.title);
        }
    }, [fetchData, location]);

    const handleScanSuccess = (token) => {
        let decoded;
        try {
            // Try parsing as simple JSON first (for testing QRs)
            const parsed = JSON.parse(token);
            if (parsed._id || parsed.studentId) {
                decoded = {
                    studentId: parsed._id || parsed.studentId,
                    idString: parsed.studentId || 'Unknown',
                    name: parsed.name || 'Student',
                    roomNo: parsed.roomNo || 'N/A',
                    profileImage: parsed.profileImage
                };
            }
        } catch (e) {
            // Ignore, proceed to JWT decoding
        }

        if (!decoded) {
            decoded = decodeJWT(token);
        }

        if (!decoded || !decoded.studentId) {
            showErrorToast('Invalid QR Code', 'Could not extract student data from QR');
            return false;
        }

        // Check if already scanned
        const alreadyScanned = records.find(r => r.student?._id === decoded.studentId);
        if (alreadyScanned) {
            showErrorToast('Already Scanned', `${decoded.name || 'Student'} has already been marked present.`);
            return false;
        }

        setIsScanOpen(false);

        // Map JWT payload to student object
        const student = {
            _id: decoded.studentId,
            studentId: decoded.idString,
            name: decoded.name,
            roomNo: decoded.roomNo,
            profileImage: decoded.profileImage
        };

        setScannedStudent(student);
        setRawToken(token);
        setIsConfirmOpen(true);
        return true;
    };

    const handleApproveScan = async () => {
        if (!scannedStudent) return;
        try {
            setIsScanning(true);
            await attendanceService.scanStudentByRole(user.role, windowId, { qrToken: rawToken, studentId: scannedStudent._id });

            showSuccessToast('Success', `${scannedStudent.name} marked as present.`);

            // Add to session list
            setSessionScanned(prev => [{
                _id: 'session_' + Date.now(),
                student: scannedStudent,
                scannedAt: new Date().toISOString()
            }, ...prev]);

            setIsConfirmOpen(false);
            setScannedStudent(null);
            setRawToken(null);
            setSuccessDate(new Date());
            setIsSuccessOpen(true);
            fetchData(); // refresh stats
        } catch (error) {
            showErrorToast('Scan Failed', error.message);
        } finally {
            setIsScanning(false);
        }
    };

    // Calculate dynamic stats
    const stats = useMemo(() => {
        const total = windowData?.totalStudents || 0;
        const present = records.length;
        return {
            total,
            present,
            scanned: present
        };
    }, [windowData, records]);

    const filteredSessionRecords = sessionScanned.filter(r =>
        r.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.student?.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 bg-[#F8FAFC]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">

                    {/* <div className="flex flex-col gap-1">
                        <h1 className="text-xl font-bold text-gray-900">Mark Attendance</h1>
                        <p className="text-sm text-gray-500 mt-1">Attendance &gt; Mark Attendance</p>
                    </div> */}
                    <PageHeader
                        title="Mark Attendance"
                        subtitle=""
                        actionButton={<BackButton text="Back to Attendance" />}
                    />
                </div>

                <button
                    onClick={() => setIsScanOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0A437A] text-white rounded-md font-medium text-sm w-full sm:w-auto hover:bg-secondary transition-colors"
                >
                    <Maximize className="w-4 h-4" />
                    Mark Today's Attendance
                </button>
            </div>

            {/* Stats Row */}
            <div className="bg-white p-4 sm:p-6 rounded-md grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#F4F7FB] flex items-center justify-center text-[#3BA0FF]">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <div className="w-[1px] h-8 bg-gray-200"></div>
                    <div className="flex flex-col">
                        <span className="text-[11px] text-gray-400 font-medium">Date</span>
                        <span className="text-xs font-semibold text-gray-700">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#F4F7FB] flex items-center justify-center text-[#3BA0FF]">
                        <Clock className="w-4 h-4" />
                    </div>
                    <div className="w-[1px] h-8 bg-gray-200"></div>
                    <div className="flex flex-col">
                        <span className="text-[11px] text-gray-400 font-medium">Day</span>
                        <span className="text-xs font-semibold text-gray-700">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#F4F7FB] flex items-center justify-center text-[#3BA0FF]">
                        <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="w-[1px] h-8 bg-gray-200"></div>
                    <div className="flex flex-col">
                        <span className="text-[11px] text-gray-400 font-medium">Students</span>
                        <span className="text-xs font-semibold text-gray-700">{stats.total}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#EBFDF3] flex items-center justify-center text-[#10B981]">
                        <CalendarCheck className="w-4 h-4" />
                    </div>
                    <div className="w-[1px] h-8 bg-gray-200"></div>
                    <div className="flex flex-col">
                        <span className="text-[11px] text-gray-400 font-medium">Present</span>
                        <span className="text-xs font-semibold text-gray-700">{stats.present}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#EBFDF3] flex items-center justify-center text-[#10B981]">
                        <Scan className="w-4 h-4" />
                    </div>
                    <div className="w-[1px] h-8 bg-gray-200"></div>
                    <div className="flex flex-col">
                        <span className="text-[11px] text-gray-400 font-medium">Scanned</span>
                        <span className="text-xs font-semibold text-gray-700">{stats.scanned}</span>
                    </div>
                </div>
            </div>

            {/* Scan Banner */}

            {/* Scanned Students List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 flex flex-col min-h-[300px]">
                <div className="p-4 border-b border-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="font-semibold text-gray-900">Recently Scanned <span className="text-gray-400 font-normal">({filteredSessionRecords.length})</span></h3>
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-gray-200">
                    {filteredSessionRecords.length === 0 ? (
                        <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center h-48 text-gray-400">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                <UserCheck className="w-8 h-8 text-blue-200" />
                            </div>
                            <p className="font-medium text-gray-700">No students scanned in this session</p>
                            <p className="text-sm mt-1">Scan QR codes to add students to the list</p>
                        </div>
                    ) : (
                        filteredSessionRecords.map((record) => {
                            const initials = record.student?.name ? record.student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
                            return (
                                <div key={record._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        {record.student?.profileImage ? (
                                            <img src={record.student.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-[#0A437A] text-white flex items-center justify-center text-xs font-medium">
                                                {initials}
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-gray-800">{record.student?.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{record.student?.studentId}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <ScanQRModal
                isOpen={isScanOpen}
                onClose={() => setIsScanOpen(false)}
                onScanSuccess={handleScanSuccess}
            />

            <ConfirmStudentModal
                isOpen={isConfirmOpen}
                onClose={() => {
                    setIsConfirmOpen(false);
                    setScannedStudent(null);
                }}
                student={scannedStudent}
                onConfirm={handleApproveScan}
                isSubmitting={isScanning}
            />

            <AttendanceSuccessModal
                isOpen={isSuccessOpen}
                onClose={() => setIsSuccessOpen(false)}
                date={successDate}
            />
        </div>
    );
}
