import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import { Camera, UploadCloud, Loader2 } from 'lucide-react';
import { showErrorToast } from '@/utils/toast';
import jsQR from 'jsqr';

export default function ScanQRModal({
    isOpen,
    onClose,
    onScanSuccess,
    isProcessing
}) {
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const [manualToken, setManualToken] = useState('');

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (manualToken.trim()) {
            onScanSuccess(manualToken.trim());
            setManualToken('');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    onScanSuccess(code.data);
                } else {
                    showErrorToast('QR Code Not Found', 'Could not read a QR code from the uploaded image.');
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);

        // Reset input value so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            maxWidth="max-w-md"
        >
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-6">
                    <Camera className="w-5 h-5 text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-900">Scan The QR</h2>
                </div>

                {isProcessing ? (
                    <div className="flex flex-col items-center justify-center p-10 w-full h-[250px] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p className="text-sm font-medium text-gray-600">Processing QR Data...</p>
                    </div>
                ) : (
                    <>
                        <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300">
                            {/* Visual Placeholder for Scanner */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[60%] aspect-square border-2 border-blue-500 rounded-[20px] relative">
                                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-[20px]" />
                                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-[20px]" />
                                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-[20px]" />
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-[20px]" />
                                </div>
                            </div>

                            {/* Hidden input to capture physical USB scanner output */}
                            <form onSubmit={handleFormSubmit} className="w-full h-full opacity-0 absolute inset-0 z-10">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={manualToken}
                                    onChange={(e) => setManualToken(e.target.value)}
                                    className="w-full h-full"
                                    placeholder="Focus here to scan"
                                    autoFocus
                                />
                            </form>
                        </div>

                        <p className="text-sm text-gray-500 mt-4 mb-6">
                            Align the QR code within the frame.
                        </p>

                        <div className="flex items-center gap-4 w-full mb-6">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">OR</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                        </div>

                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            id="qr-upload"
                        />
                        <label
                            htmlFor="qr-upload"
                            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#0A437A] text-white rounded-md text-sm font-medium hover:bg-secondary transition-colors cursor-pointer"
                        >
                            <UploadCloud className="w-4 h-4" />
                            Upload QR Code
                        </label>
                    </>
                )}
            </div>
        </Modal>
    );
}
