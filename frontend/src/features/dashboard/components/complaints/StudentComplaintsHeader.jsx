import React from 'react';

export default function StudentComplaintsHeader() {
    return (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-6 flex-shrink-0">
            <div>
                <h1 className="text-[22px] font-bold text-black">My Complaints</h1>
                <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5">Raise hostel-related issues and track their status until resolution.</p>
            </div>
        </div>
    );
}
