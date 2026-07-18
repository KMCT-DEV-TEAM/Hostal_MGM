import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import QRCode from 'react-qr-code';
import { useQRModalStore } from '@/store/useQRModalStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function AttendanceQRModal() {
    const { isOpen, closeModal } = useQRModalStore();
    const { user } = useAuthStore();
    const qrToken = user?.qrToken;
    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal bottomSheetOnMobile={true}
            isOpen={isOpen}
            onClose={closeModal}
            maxWidth="max-w-sm"
        >
            <div className="flex flex-col items-center justify-center text-center">

                {/* User Info */}
                <h2 className="text-xl font-bold text-text-primary">{user?.name || 'Student'}</h2>
                <p className="text-sm text-text-secondary mt-1.5">Room No : {user?.roomNumber || user?.roomNo || 'N/A'}</p>

                {/* QR Code Container */}
                <div className="p-5 border border-gray-50 rounded-[28px] bg-white my-2 relative inline-block">
                    {qrToken ? (
                        <div className="relative flex items-center justify-center">
                            <QRCode
                                value={qrToken}
                                size={180}
                                level="H"
                                fgColor="#1a1a1a"
                            />
                        </div>
                    ) : (
                        <div className="w-[180px] h-[180px] flex items-center justify-center bg-gray-50 text-gray-400 text-sm rounded-2xl border border-dashed border-gray-200">
                            No QR
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <h3 className="text-[15px] font-semibold text-text-primary">Scan this Daily Attendance</h3>
                <p className="text-xs text-text-secondary mt-2 mb-2">Show this code to the warden for verification</p>

                {/* Hidden print button for desktop accessibility */}
                <button onClick={handlePrint} className="hidden md:block mt-4 text-xs text-gray-400 hover:text-gray-600 underline">
                    Print QR
                </button>
            </div>
        </Modal>
    );
}
