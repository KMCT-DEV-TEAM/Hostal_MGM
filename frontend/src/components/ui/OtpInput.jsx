import React, { useRef } from 'react';

const OtpInput = ({ length = 6, value, onChange, error }) => {
    const inputRefs = useRef([]);

    const handleChange = (e, index) => {
        const val = e.target.value;
        if (isNaN(val)) return;

        const newValue = value.substring(0, index) + val + value.substring(index + 1);
        onChange(newValue.slice(0, length));

        if (val && index < length - 1) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    return (
        <div className="flex gap-2 justify-between w-full max-w-sm">
            {[...Array(length)].map((_, i) => (
                <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    maxLength={1}
                    value={value[i] || ''}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    className={`w-[45px] h-12 sm:w-12 text-center rounded-lg border text-lg text-text-primary focus:outline-none focus:ring-2 transition-colors ${
                        error 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-gray-300 focus:ring-secondary/20 focus:border-secondary'
                    }`}
                />
            ))}
        </div>
    );
};

export default OtpInput;
