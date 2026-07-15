import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import QRCode from 'react-qr-code';

export default function AttendanceQRModal({ isOpen, onClose, qrToken }) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal bottomSheetOnMobile={true}
            isOpen={isOpen}
            onClose={onClose}
            title="Today's Attendance QR"
            titleSize="text-lg font-semibold text-center w-full"
            maxWidth="max-w-md"
            className="text-center"
        >
            <div className="flex flex-col items-center justify-center p-6 space-y-6">

                {/* QR Code Container */}
                <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm inline-block">
                    {qrToken ? (
                        <div className="bg-white p-2 flex items-center justify-center w-56 h-56">
                            <QRCode
                                value={qrToken}
                                size={200}
                                level="M"
                            />
                        </div>
                    ) : (
                        <div className="w-56 h-56 flex items-center justify-center bg-gray-50 text-gray-400 text-sm rounded-lg border border-dashed border-gray-200">
                            No QR Token Found
                        </div>
                    )}
                </div>


                <Button
                    onClick={handlePrint}
                    className="mt-4 px-8 py-2.5 bg-primary hover:bg-secondary text-white rounded-md text-sm font-medium transition-colors"
                >
                    Print QR
                </Button>
            </div>
        </Modal>
    );
}
