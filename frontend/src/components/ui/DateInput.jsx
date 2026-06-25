import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon } from 'lucide-react';
import Calendar from './Calendar';

const DateInput = forwardRef(({ label, error, className, min, max, value, onChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [popoverCoords, setPopoverCoords] = useState({ top: 0, left: 0 });
    const containerRef = useRef(null);
    const popoverRef = useRef(null);

    // Default uncontrolled value if not managed by React Hook Form
    const [internalValue, setInternalValue] = useState(value || '');

    // The current display value
    const displayValue = value !== undefined ? value : internalValue;

    const updatePosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setPopoverCoords({
                top: rect.bottom + 4, // 4px gap
                left: rect.left,
            });
        }
    };

    // Handle clicking outside and positioning
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current && !containerRef.current.contains(event.target) &&
                (!popoverRef.current || !popoverRef.current.contains(event.target))
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            updatePosition();
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', updatePosition, true); // true = capture phase to catch modal scroll
            window.addEventListener('resize', updatePosition);

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isOpen]);

    const handleSelect = (dateStr) => {
        setInternalValue(dateStr);
        setIsOpen(false);
        if (onChange) {
            onChange({
                target: {
                    name: props.name,
                    value: dateStr
                }
            });
        }
    };

    return (
        <div className={className} ref={containerRef}>
            {label && (
                <label className="block mb-1.5 text-xs font-medium text-text-primary">
                    {label} {props.required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div
                className={`relative flex items-center h-10 border rounded-md transition-colors bg-white cursor-pointer ${error ? "border-red-300 focus-within:border-red-500 bg-red-50/30" : "border-gray-200 hover:border-gray-300"
                    } ${isOpen ? 'ring-2 ring-primary/20 border-secondary' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={`pl-3 pr-2 flex items-center justify-center transition-colors ${error ? "text-red-400" : (isOpen ? "text-secondary" : "text-gray-400")}`}>
                    <CalendarIcon className="w-4 h-4" />
                </div>

                {/* RHF compatible hidden text input that can receive focus */}
                <input
                    type="text"
                    ref={ref}
                    value={displayValue}
                    onChange={() => { }} // Handle React controlled warning
                    readOnly
                    {...props}
                    className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
                />

                <div className={`flex-1 w-full h-full pr-3 text-xs flex items-center bg-transparent ${displayValue ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                    {displayValue ? displayValue : 'YYYY-MM-DD'}
                </div>

                {/* Popover */}
                {isOpen && typeof document !== 'undefined' && createPortal(
                    <div
                        ref={popoverRef}
                        className="fixed z-[9999] animate-in fade-in zoom-in-95 duration-100 shadow-xl rounded-xl"
                        style={{ top: popoverCoords.top, left: popoverCoords.left }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Calendar
                            selectedDate={displayValue}
                            onSelect={handleSelect}
                            min={min}
                            max={max}
                        />
                    </div>,
                    document.body
                )}
            </div>
            {error && <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium animate-in fade-in">{error.message || error}</p>}
        </div>
    );
});

DateInput.displayName = 'DateInput';
export default DateInput;
