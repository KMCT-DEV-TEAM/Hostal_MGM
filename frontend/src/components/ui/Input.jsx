import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
    label, 
    className = "w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm", 
    containerClassName = "", 
    labelClassName = "block mb-2 text-sm text-text-primary font-medium", 
    endIcon,
    error,
    ...props 
}, ref) => {
    return (
        <div className={containerClassName}>
            {label && (
                <label className={labelClassName}>
                    {label}
                </label>
            )}
            <div className="relative w-full">
                <input
                    ref={ref}
                    className={`${className} ${endIcon ? 'pr-10' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    {...props}
                />
                {endIcon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 flex items-center">
                        {endIcon}
                    </div>
                )}
            </div>
            {error && (
                <p className="text-red-500 text-xs mt-1.5">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
