import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/useAuthStore';
import attendanceService from '@/services/attendance.service';
import { showErrorToast } from '@/utils/toast';

export default function StudentAttendanceModal({ isOpen, onClose, student }) {
    const { user } = useAuthStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState(null);
    const [loading, setLoading] = useState(false);

    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const fetchCalendar = useCallback(async () => {
        if (!student?._id || !user?.role) return;

        try {
            setLoading(true);
            const response = await attendanceService.getStudentCalendarByRole(user.role, {
                studentId: student._id,
                month,
                year
            });
            setCalendarData(response);
        } catch (error) {
            showErrorToast('Failed to load calendar data', error.message);
        } finally {
            setLoading(false);
        }
    }, [student?._id, user?.role, month, year]);

    useEffect(() => {
        if (isOpen && student) {
            fetchCalendar();
        }
    }, [isOpen, student, fetchCalendar]);

    if (!isOpen || !student) return null;

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // Calendar Generation Logic (Monday Start)
    const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Convert to Mon(0) - Sun(6)
    const totalDays = getDaysInMonth(year, month);

    const days = [];
    for (let i = 0; i < startingDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
        days.push(i);
    }

    const monthName = currentDate.toLocaleString('default', { month: 'long' }).toUpperCase();

    // Map events
    const eventsMap = {};
    if (calendarData?.events) {
        calendarData.events.forEach(ev => {
            const dateStr = ev.date; // assuming YYYY-MM-DD
            eventsMap[dateStr] = ev.status;
        });
    }

    const renderDay = (dayStr, dayNum) => {
        const status = eventsMap[dayStr];
        let statusClasses = 'border-gray-200 text-gray-500'; // Not marked
        if (status === 'present') {
            statusClasses = 'border-green-400 text-green-500';
        } else if (status === 'absent') {
            statusClasses = 'border-red-400 text-red-500';
        }

        return (
            <div key={dayStr || Math.random()} className="flex justify-center">
                {dayNum ? (
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-medium ${statusClasses}`}>
                        {dayNum}
                    </div>
                ) : (
                    <div className="w-8 h-8" />
                )}
            </div>
        );
    };

    return (
        <Modal bottomSheetOnMobile={true}
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-md"
        >
            <div className="-mt-16"> {/* Negative margin to offset Modal's default padding/header spacing */}


                {/* Profile Section */}
                <div className="flex flex-row h-fit items-center mb-6">
                    {student.profileImage ? (
                        <img src={student.profileImage} alt="" className="w-16 h-16 rounded-full object-cover shadow-sm" />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-blue-50 text-primary flex items-center justify-center text-xl font-semibold shadow-sm border border-blue-100">
                            {student.name?.substring(0, 2).toUpperCase()}
                        </div>
                    )}

                    <div className="ml-4 flex flex-col items-start">
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">Room No : {student.room || 'N/A'}</p>
                    </div>
                </div>

                {/* Stats Boxes */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="border border-red-100 bg-white rounded-xl p-3 flex flex-col relative">
                        <span className="text-[10px] font-bold text-gray-500 tracking-wider mb-2 uppercase">Total Absent</span>
                        <span className="text-xl font-semibold text-gray-900">{calendarData?.summary?.absent || 0}</span>
                        <div className="absolute top-3 right-3 bg-red-50 p-1 rounded">
                            <CalendarIcon className="w-3 h-3 text-red-400" />
                        </div>
                    </div>
                    <div className="border border-green-100 bg-white rounded-xl p-3 flex flex-col relative">
                        <span className="text-[10px] font-bold text-gray-500 tracking-wider mb-2 uppercase">Total Present</span>
                        <span className="text-xl font-semibold text-gray-900">{calendarData?.summary?.present || 0}</span>
                        <div className="absolute top-3 right-3 bg-green-50 p-1 rounded">
                            <CalendarIcon className="w-3 h-3 text-green-400" />
                        </div>
                    </div>
                </div>

                {/* Calendar Section */}
                <div className="border border-gray-100 rounded-xl p-4">
                    {/* Calendar Header */}
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-50 rounded-full border border-gray-100">
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="text-sm font-semibold text-gray-700">{monthName} {year}</span>
                        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-50 rounded-full border border-gray-100">
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="relative min-h-[220px]">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : null}
                        <div className="grid grid-cols-7 gap-y-4 mb-2">
                            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                                <div key={d} className="text-center text-[10px] font-medium text-gray-400">
                                    {d}
                                </div>
                            ))}
                            {days.map((d, idx) => {
                                if (!d) return renderDay(null, null);
                                // format date to match YYYY-MM-DD
                                const yStr = year;
                                const mStr = String(month).padStart(2, '0');
                                const dStr = String(d).padStart(2, '0');
                                const fullDateStr = `${yStr}-${mStr}-${dStr}`;
                                return renderDay(fullDateStr, d);
                            })}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center items-center gap-6 mt-6 border-t border-gray-50 pt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                            <span className="text-[10px] font-medium text-gray-600">Present</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                            <span className="text-[10px] font-medium text-gray-600">Absent</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                            <span className="text-[10px] font-medium text-gray-600">Not Marked</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
