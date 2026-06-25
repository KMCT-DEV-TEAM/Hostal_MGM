import React, { forwardRef } from 'react';
import { Clock } from 'lucide-react';

const TimeInput = forwardRef(({ label, error, className, ...props }, ref) => {
    return (
        <div className={className}>
            {label && (
                <label className="block mb-1.5 text-xs font-medium text-text-primary">
                    {label} {props.required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className={`relative flex items-center h-10 border rounded-md overflow-hidden transition-colors bg-white ${
                error ? "border-red-300 focus-within:border-red-500 bg-red-50/30" : "border-gray-200 focus-within:border-secondary hover:border-gray-300"
            }`}>
                <div className={`pl-3 pr-2 flex items-center justify-center transition-colors ${error ? "text-red-400" : "text-gray-400"}`}>
                    <Clock className="w-4 h-4" />
                </div>
                <input
                    type="time"
                    ref={ref}
                    {...props}
                    className="flex-1 w-full h-full pr-3 text-xs outline-none bg-transparent custom-time-input text-gray-700 font-medium"
                />
            </div>
            {error && <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium animate-in fade-in">{error.message || error}</p>}
        </div>
    );
});

TimeInput.displayName = 'TimeInput';
export default TimeInput;
