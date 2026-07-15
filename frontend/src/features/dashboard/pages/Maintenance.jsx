import React from 'react'

const Maintenance = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F6F9]">
            {/* Shield + Wrench Illustration */}
            <div className="mb-6">
                <svg width="120" height="120" viewBox="0 0 72 72" fill="none">
                    <circle cx="36" cy="36" r="34" fill="#E8EDF4" stroke="#C8D0DC" strokeWidth="1" />
                    <path d="M36 16 L50 22 L50 38 C50 46 36 54 36 54 C36 54 22 46 22 38 L22 22 Z" fill="#C8CDD6" stroke="#a0a8b4" strokeWidth="1.2" />
                    <path d="M36 20 L47 25 L47 38 C47 44.5 36 51 36 51 C36 51 25 44.5 25 38 L25 25 Z" fill="#E8EDF4" />
                    <path d="M30 36 L34 40 L42 32" stroke="#0A467F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M42 46 Q48 40 52 42 Q54 38 50 36 Q46 34 44 38 L38 44 Z" fill="#F5A623" stroke="#d4891a" strokeWidth="0.8" />
                </svg>
            </div>

            {/* Text */}
            <h1 className="text-[40px] font-extrabold text-[#111827]">
                Site is under maintenance
            </h1>
        </div>
    )
}

export default Maintenance
