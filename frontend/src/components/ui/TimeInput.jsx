import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

const TimeInput = forwardRef(({
    label,
    name,
    value,
    onChange,
    onBlur,
    className = "",
    containerClassName = "",
    labelClassName = "block mb-2 text-sm text-text-primary font-medium",
    error,
    placeholder = "Select Time",
    ...props
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const [popoverStyle, setPopoverStyle] = useState({});

    // Parse current value
    const currentHour = value ? value.split(':')[0] : '12';
    const currentMinute = value ? value.split(':')[1] : '00';

    const [selectedHour, setSelectedHour] = useState(currentHour);
    const [selectedMinute, setSelectedMinute] = useState(currentMinute);

    const hoursRef = useRef(null);
    const minutesRef = useRef(null);

    // Sync state with value prop
    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            setSelectedHour(h);
            setSelectedMinute(m);
        }
    }, [value]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                const portalEl = document.getElementById('dropdown-portal');
                if (portalEl && portalEl.contains(event.target)) {
                    return;
                }
                setIsOpen(false);
                if (onBlur) onBlur();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onBlur]);

    // Close on scroll to avoid detached popover
    useEffect(() => {
        const handleScroll = (e) => {
            const portalEl = document.getElementById('dropdown-portal');
            if (portalEl && portalEl.contains(e.target)) return;
            setIsOpen(false);
        };
        if (isOpen) {
            window.addEventListener('scroll', handleScroll, true);
        }
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [isOpen]);

    // Update position when opened
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const dropUp = spaceBelow < 250 && spaceAbove > spaceBelow;

            setPopoverStyle({
                position: 'fixed',
                top: dropUp ? 'auto' : rect.bottom + 4,
                bottom: dropUp ? window.innerHeight - rect.top + 4 : 'auto',
                left: rect.left,
                width: 160, // Fixed width for time picker
                zIndex: 9999
            });

            // Scroll to selected items
            setTimeout(() => {
                if (hoursRef.current) {
                    const selected = hoursRef.current.querySelector('.selected');
                    if (selected) selected.scrollIntoView({ block: 'center' });
                }
                if (minutesRef.current) {
                    const selected = minutesRef.current.querySelector('.selected');
                    if (selected) selected.scrollIntoView({ block: 'center' });
                }
            }, 10);
        }
    }, [isOpen]);

    const handleTimeSelect = (type, val) => {
        let newHour = selectedHour;
        let newMinute = selectedMinute;

        if (type === 'hour') {
            newHour = val;
            setSelectedHour(val);
        } else {
            newMinute = val;
            setSelectedMinute(val);
        }

        const newValue = `${newHour}:${newMinute}`;

        // Call react-hook-form's onChange or native onChange
        if (onChange) {
            onChange({ target: { name, value: newValue } });
        }

        // Auto-close if minute is selected (optional, maybe better not to for tweaking)
        // if (type === 'minute') setIsOpen(false);
    };

    let portalTarget = null;
    if (typeof document !== 'undefined') {
        portalTarget = document.getElementById('dropdown-portal');
        if (!portalTarget) {
            portalTarget = document.createElement('div');
            portalTarget.id = 'dropdown-portal';
            document.body.appendChild(portalTarget);
        }
    }

    return (
        <div className={containerClassName} ref={containerRef}>
            {label && (
                <label className={labelClassName}>
                    {label} {props.required && <span className="text-red-500">*</span>}
                </label>
            )}

            {/* Hidden native input for react-hook-form to register correctly if used with standard ref */}
            <input
                type="hidden"
                ref={ref}
                name={name}
                value={value || `${selectedHour}:${selectedMinute}`}
                {...props}
            />

            <div
                className={`relative w-full group flex items-center bg-white border rounded-lg cursor-pointer transition-colors ${error
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : isOpen
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-slate-300 hover:border-gray-400'
                    }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={`pl-4 pr-2 transition-colors pointer-events-none ${error ? 'text-red-400' : (isOpen ? 'text-primary' : 'text-gray-400')}`}>
                    <Clock className="w-[18px] h-[18px]" />
                </div>
                <div className={`flex-1 w-full py-3 pr-4 text-sm bg-transparent outline-none select-none text-gray-900 font-medium ${className}`}>
                    {value || `${selectedHour}:${selectedMinute}`}
                </div>
            </div>

            {error && (
                <p className="text-red-500 text-xs mt-1.5 animate-in fade-in">{error.message || error}</p>
            )}

            {isOpen && portalTarget && createPortal(
                <div
                    style={popoverStyle}
                    className="bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                >
                    <div className="flex h-56 divide-x divide-gray-100">
                        {/* Hours Column */}
                        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth" ref={hoursRef}>
                            {HOURS.map(h => {
                                const isSelected = h === selectedHour;
                                return (
                                    <div
                                        key={`h-${h}`}
                                        className={`py-2 text-center text-sm cursor-pointer transition-colors ${isSelected ? 'bg-primary text-white font-bold selected' : 'text-gray-700 hover:bg-gray-50'}`}
                                        onClick={() => handleTimeSelect('hour', h)}
                                    >
                                        {h}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Minutes Column */}
                        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth" ref={minutesRef}>
                            {MINUTES.map(m => {
                                const isSelected = m === selectedMinute;
                                return (
                                    <div
                                        key={`m-${m}`}
                                        className={`py-2 text-center text-sm cursor-pointer transition-colors ${isSelected ? 'bg-primary text-white font-bold selected' : 'text-gray-700 hover:bg-gray-50'}`}
                                        onClick={() => handleTimeSelect('minute', m)}
                                    >
                                        {m}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>,
                portalTarget
            )}
        </div>
    );
});

TimeInput.displayName = 'TimeInput';

export default TimeInput;
