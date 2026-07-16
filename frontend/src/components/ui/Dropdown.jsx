import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({
    options = [],
    value,
    onChange,
    placeholder = "Select an option",
    className = "",
    minWidth = "min-w-[120px]",
    triggerClassName = "",
    placement = "bottom",
    error,
    hideChevron = false,
    mobileIcon = null
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [dynamicPlacement, setDynamicPlacement] = useState(placement);
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

    const handleToggle = () => {
        if (!isOpen) {
            if (dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const dropdownHeight = 200; // estimated max height based on max-h-48 (192px)

                let spaceBelowParent = spaceBelow;
                let scrollParent = dropdownRef.current.parentElement;
                while (scrollParent) {
                    if (scrollParent === document.body || scrollParent === document.documentElement) break;
                    const style = window.getComputedStyle(scrollParent);
                    if (/(auto|scroll)/.test(style.overflow + style.overflowY)) {
                        const parentRect = scrollParent.getBoundingClientRect();
                        spaceBelowParent = parentRect.bottom - rect.bottom;
                        break;
                    }
                    scrollParent = scrollParent.parentElement;
                }

                if ((spaceBelow < dropdownHeight || spaceBelowParent < dropdownHeight) && rect.top > dropdownHeight) {
                    setDynamicPlacement('top');
                } else {
                    setDynamicPlacement(placement);
                }
            }
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className={`relative ${minWidth} ${className}`} ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={handleToggle}
                className={`flex items-center justify-between w-full border rounded-lg outline-none transition-colors ${triggerClassName || 'px-3 py-2 text-sm bg-white border-gray-200 focus:border-secondary'}`}
            >
                {mobileIcon && <span className="lg:hidden flex items-center justify-center w-full">{mobileIcon}</span>}
                <span className={`truncate font-inherit text-inherit ${mobileIcon ? 'hidden lg:inline' : ''}`}>{displayValue}</span>
                {!hideChevron && <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${mobileIcon ? 'hidden lg:block' : ''} ${isOpen ? 'rotate-180' : ''}`} />}
            </button>

            {isOpen && (
                <div className={`absolute z-[100] flex flex-col min-w-full w-max max-w-[200px] ${dynamicPlacement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
                    {options.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400 text-center">No options</div>
                    ) : (
                        options.map((opt, idx) => {
                            const val = typeof opt === 'object' ? opt.value : opt;
                            const label = typeof opt === 'object' ? opt.label : opt;
                            const isDisabled = typeof opt === 'object' ? opt.disabled : false;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => !isDisabled && handleSelect(opt)}
                                    disabled={isDisabled}
                                    className={`w-full text-left px-3 py-2 text-sm transition-colors whitespace-normal break-words ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-gray-50'} ${value === val ? 'bg-blue-50/50 text-[#0A437A] font-medium' : 'text-gray-700'}`}
                                >
                                    {label}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
            {error && <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium animate-in fade-in">{error}</p>}
        </div>
    );
}
