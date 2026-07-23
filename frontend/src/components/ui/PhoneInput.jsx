import React from 'react';

const PhoneInput = ({ name, value, onChange, onBlur, disabled }) => (
  <div className={`flex border border-gray-200 rounded-lg overflow-hidden focus-within:border-secondary ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-transparent'}`}>
    <div className="px-2 py-2 border-r border-gray-200 flex items-center gap-1 text-xs text-black shrink-0">
      <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-4 h-3" />
      +91
    </div>
    <input
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      required
      placeholder="00000 00000"
      value={value}
      maxLength={10}
      disabled={disabled}
      onChange={(e) => {
        const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
        onChange(digitsOnly);
      }}
      onBlur={onBlur}
      className={`w-full px-3 py-2 outline-none bg-transparent text-xs ${disabled ? 'cursor-not-allowed' : ''}`}
    />
  </div>
);

export default PhoneInput;
