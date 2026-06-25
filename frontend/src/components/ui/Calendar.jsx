import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendar({ selectedDate, onSelect, min, max }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const initialDate = selectedDate ? new Date(selectedDate) : today;
    const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const prevMonth = (e) => {
        e.preventDefault();
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = (e) => {
        e.preventDefault();
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleSelect = (day) => {
        const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        onSelect(`${yyyy}-${mm}-${dd}`);
    };

    const isDateDisabled = (year, month, day) => {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        if (min) {
            const minDate = new Date(min);
            minDate.setHours(0, 0, 0, 0);
            if (date < minDate) return true;
        }
        if (max) {
            const maxDate = new Date(max);
            maxDate.setHours(0, 0, 0, 0);
            if (date > maxDate) return true;
        }
        return false;
    };

    const isSelected = (day) => {
        if (!selectedDate) return false;
        const [y, m, d] = selectedDate.split('-');
        return parseInt(y, 10) === currentMonth.getFullYear() &&
            parseInt(m, 10) === currentMonth.getMonth() + 1 &&
            parseInt(d, 10) === day;
    };

    const isToday = (day) => {
        return today.getFullYear() === currentMonth.getFullYear() &&
            today.getMonth() === currentMonth.getMonth() &&
            today.getDate() === day;
    };

    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-lg w-64 select-none z-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={prevMonth} className="p-1 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-sm font-bold text-gray-800">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <button type="button" onClick={nextMonth} className="p-1 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 mb-2">
                {days.map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-400">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const disabled = isDateDisabled(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const selected = isSelected(day);
                    const current = isToday(day);

                    return (
                        <button
                            type="button"
                            key={day}
                            disabled={disabled}
                            onClick={(e) => { e.preventDefault(); handleSelect(day); }}
                            className={`h-8 w-full rounded-full text-xs font-medium flex items-center justify-center transition-colors cursor-pointer
                                ${disabled ? 'text-gray-300 cursor-not-allowed!' :
                                    selected ? 'bg-primary text-white shadow-sm' :
                                        current ? 'bg-primary/10 text-primary hover:bg-primary/20' :
                                            'text-gray-700 hover:bg-gray-100'
                                }
                            `}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
