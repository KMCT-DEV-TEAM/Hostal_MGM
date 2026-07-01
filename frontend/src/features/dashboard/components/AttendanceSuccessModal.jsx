import React from 'react';
import Modal from '@/components/ui/Modal';
import { Check } from 'lucide-react';

export default function AttendanceSuccessModal({
    isOpen,
    onClose,
    date = new Date()
}) {
    // Format date like "19 June - 08 : 15 Pm"
    const formattedDate = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return (
        <Modal bottomSheetOnMobile={true}
            isOpen={isOpen}
            onClose={onClose}
            title=""
            maxWidth="max-w-md"
        >
            <div className="flex flex-col items-center  -mt-12 ">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Today's Attendance</h2>

                <div className="w-full h-px bg-gray-100 mb-8"></div>

                <div className="w-20 h-20 rounded-full border-2 border-green-500 flex items-center justify-center mb-6">
                    <Check className="w-10 h-10 text-green-500" strokeWidth={2.5} />
                </div>

                <h3 className="text-gray-800 font-medium mb-3">Attendance marked successfully !</h3>

                <p className="text-xs text-gray-400">
                    {formattedDate} - {formattedTime}
                </p>
            </div>
        </Modal>
    );
}
