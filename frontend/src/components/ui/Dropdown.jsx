import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({
    options = [],
    value,
    onChange,
    placeholder = "Select an option",
    className = "",
    minWidth = "min-w-[120px]",
    triggerClassName = "",
    error
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [dropdownStyle, setDropdownStyle] = useState({});

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                // Check if clicking inside the portal
                const portalEl = document.getElementById('dropdown-portal');
                if (portalEl && portalEl.contains(event.target)) {
                    return;
                }
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on scroll to avoid floating dropdowns detached from trigger
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
        if (isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const dropUp = spaceBelow < 250 && spaceAbove > spaceBelow;
            
            setDropdownStyle({
                position: 'fixed',
                top: dropUp ? 'auto' : rect.bottom + 4,
                bottom: dropUp ? window.innerHeight - rect.top + 4 : 'auto',
                left: rect.left,
                width: rect.width,
                zIndex: 999999
            });
        }
    }, [isOpen]);

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

    const dropdownList = isOpen ? (
        <div 
            id="dropdown-portal"
            style={dropdownStyle}
            className={`flex flex-col bg-white border border-gray-200 rounded-lg shadow-xl py-1 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
        >
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
                            className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 whitespace-normal break-words cursor-pointer ${value === val ? 'bg-blue-50/50 text-[#0A437A] font-medium' : 'text-gray-700'}`}
                        >
                            {label}
                        </button>
                    );
                })
            )}
        </div>
    ) : null;

    return (
        <div className={`relative ${minWidth} ${className}`} ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full border rounded-lg outline-none transition-colors ${triggerClassName || 'px-3 py-2 text-sm bg-white border-gray-200 focus:border-secondary'}`}
            >
                <span className="truncate mr-2 font-inherit text-inherit">{displayValue}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {typeof document !== 'undefined' && createPortal(dropdownList, document.body)}
            
            {error && <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium animate-in fade-in">{error}</p>}
        </div>
    );
}
