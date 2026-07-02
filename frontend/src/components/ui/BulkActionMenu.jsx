import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';

export default function BulkActionMenu({ selectedCount, onMarkActive, onMarkInactive, onDelete }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!selectedCount || selectedCount === 0) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0A437A]/10 text-[#0A437A] border border-[#0A437A]/20 rounded-lg text-sm hover:bg-[#0A437A]/20 transition-colors cursor-pointer whitespace-nowrap"
            >
                <SlidersHorizontal className="w-4 h-4" />
                Bulk Actions ({selectedCount})
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    {onMarkActive && (
                        <button
                            onClick={() => {
                                onMarkActive();
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            Mark as Active
                        </button>
                    )}
                    {onMarkInactive && (
                        <button
                            onClick={() => {
                                onMarkInactive();
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            Mark as Inactive
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => {
                                onDelete();
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors border-t border-gray-100 mt-1 pt-3"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            Delete Selected
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
