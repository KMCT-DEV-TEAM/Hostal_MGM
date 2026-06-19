import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({
    options = [],
    value,
    onChange,
    placeholder = "Select an option",
    className = "",
    minWidth = "min-w-[120px]"
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => 
        (typeof opt === 'object' ? opt.value : opt) === value
    );

    const displayValue = selectedOption 
        ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
        : placeholder;

    const handleSelect = (opt) => {
        const val = typeof opt === 'object' ? opt.value : opt;
        onChange?.(val);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${minWidth} ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-secondary transition-colors"
            >
                <span className="truncate mr-2 text-gray-700">{displayValue}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-100">
                    {options.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400 text-center">No options</div>
                    ) : (
                        options.map((opt, idx) => {
                            const val = typeof opt === 'object' ? opt.value : opt;
                            const label = typeof opt === 'object' ? opt.label : opt;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelect(opt)}
                                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${value === val ? 'bg-blue-50/50 text-[#0A437A] font-medium' : 'text-gray-700'}`}
                                >
                                    {label}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
