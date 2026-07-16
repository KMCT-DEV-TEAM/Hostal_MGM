import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import attendanceService from '@/services/attendance.service';
import { showErrorToast } from '@/utils/toast';
import { ROLES } from '@/constants/roles';

export default function StudentMonthlyCalendar({
    student,
    userRole,
    onDayClick,
    refreshTrigger,
    showStats = true
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState(null);
    const [loading, setLoading] = useState(false);

    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const fetchCalendar = useCallback(async () => {
        if (!student?._id || !userRole) return;

        try {
            setLoading(true);
            const response = await attendanceService.getStudentCalendarByRole(userRole, {
                studentId: student._id,
                month,
                year
            });
            setCalendarData(response);
        } catch (error) {
            // console.log(error)
            showErrorToast('Failed to load calendar data', error.message);
        } finally {
            setLoading(false);
        }
    }, [student?._id, userRole, month, year]);

    useEffect(() => {
        if (student) {
            fetchCalendar();
        }
    }, [student, fetchCalendar, refreshTrigger]);

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
            statusClasses = 'border-success/70 text-success bg-success/5';
        } else if (status === 'absent') {
            statusClasses = 'border-danger/70 text-danger bg-danger/5';
        } else if (status === 'on_leave') {
            statusClasses = 'border-warning/70 text-warning bg-warning/5';
        }

        const today = new Date();
        const isToday = (dayNum === today.getDate() && month === (today.getMonth() + 1) && year === today.getFullYear());

        let wrapperProps = {};
        if (isToday && userRole === ROLES.WARDEN && onDayClick) {
            statusClasses += ' cursor-pointer hover:opacity-80 hover:scale-105';
            wrapperProps.onClick = () => onDayClick({ date: dayStr, status });
        }

        return (
            <div key={dayStr || Math.random()} className="flex justify-center">
                {dayNum ? (
                    <div {...wrapperProps} className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-medium transition-all ${statusClasses}`}>
                        {dayNum}
                    </div>
                ) : (
                    <div className="w-8 h-8" />
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col shrink-0">
            {/* Stats Boxes */}
            {showStats && (
                <div className="bg-white rounded-xl md:rounded-[24px] p-4 md:p-5 shadow-sm border border-gray-50 flex flex-col gap-4 md:gap-6 shrink-0 mb-6">
                    <div>
                        <h3 className="text-base md:text-lg font-semibold text-text-primary">Monthly Summary</h3>
                        <p className="text-xs md:text-sm text-text-secondary mt-1">Performance metrics for {monthName} {year}</p>
                    </div>

                    <div className="flex gap-3 md:gap-4">
                        <div className="flex-1 rounded-[12px] md:rounded-[16px] p-3 md:p-4 flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 rounded-[10px] md:rounded-[12px] bg-green-50 flex items-center justify-center shrink-0">
                                <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-success" strokeWidth={1.5} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-text-primary">{(calendarData?.summary?.present || 0).toString().padStart(2, '0')}</span>
                                <span className="text-[9px] md:text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Present</span>
                            </div>
                        </div>

                        <div className="flex-1 rounded-[12px] md:rounded-[16px] p-3 md:p-4 flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 rounded-[10px] md:rounded-[12px] bg-red-50 flex items-center justify-center shrink-0">
                                <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-danger" strokeWidth={1.5} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-text-primary">{(calendarData?.summary?.absent || 0).toString().padStart(2, '0')}</span>
                                <span className="text-[9px] md:text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Absent</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Calendar Section */}
            <div className="border border-gray-100 bg-white rounded-xl md:rounded-[24px] p-4 md:p-6 shadow-sm shrink-0">
                {/* Calendar Header */}
                <div className="flex justify-between items-center mb-6">
                    <button onClick={handlePrevMonth} className="p-1 md:p-1.5 hover:bg-gray-50 rounded-full border border-gray-100 transition-colors">
                        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                    </button>
                    <span className="text-sm md:text-base font-semibold text-gray-700 tracking-wide">{monthName} {year}</span>
                    <button onClick={handleNextMonth} className="p-1 md:p-1.5 hover:bg-gray-50 rounded-full border border-gray-100 transition-colors">
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="relative min-h-[220px]">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10 rounded-xl">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    <div className="grid grid-cols-7 gap-y-4 mb-2">
                        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                            <div key={d} className="text-center text-[10px] font-medium text-gray-400">
                                {d}
                            </div>
                        ))}
                        {days.map((d, idx) => {
                            if (!d) return renderDay(null, null);
                            const yStr = year;
                            const mStr = String(month).padStart(2, '0');
                            const dStr = String(d).padStart(2, '0');
                            const fullDateStr = `${yStr}-${mStr}-${dStr}`;
                            return renderDay(fullDateStr, d);
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex justify-center flex-wrap items-center gap-x-4 md:gap-x-6 gap-y-2 mt-6 border-t border-gray-50 pt-4">
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-success"></div>
                        <span className="text-[9px] md:text-[10px] font-medium text-gray-600">Present</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-danger"></div>
                        <span className="text-[9px] md:text-[10px] font-medium text-gray-600">Absent</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-warning"></div>
                        <span className="text-[9px] md:text-[10px] font-medium text-gray-600">On Leave</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gray-200"></div>
                        <span className="text-[9px] md:text-[10px] font-medium text-gray-600">Not Marked</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
