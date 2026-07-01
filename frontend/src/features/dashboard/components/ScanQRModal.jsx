import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import { Camera, UploadCloud, Loader2, VideoOff } from 'lucide-react';
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
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [manualToken, setManualToken] = useState('');
    const [cameraError, setCameraError] = useState('');
    const requestRef = useRef(null);
    const lastScannedRef = useRef(null);
    const pauseRef = useRef(false);

    // Stop camera stream
    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
        }
    }, []);

    // Start camera stream
    const startCamera = useCallback(async () => {
        setCameraError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute("playsinline", true);
                videoRef.current.play();
                requestRef.current = requestAnimationFrame(tick);
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setCameraError('Camera access denied or unavailable.');
        }
    }, []);

    // Scan loop
    const tick = useCallback(() => {
        if (pauseRef.current) return;

        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
            const canvasElement = canvasRef.current;
            const video = videoRef.current;
            const canvas = canvasElement.getContext("2d", { willReadFrequently: true });
            
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            
            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code && code.data) {
                if (code.data !== lastScannedRef.current) {
                    lastScannedRef.current = code.data;
                    const success = onScanSuccess(code.data);
                    
                    if (success === false) {
                        // Error case: pause scanning for 3 seconds
                        pauseRef.current = true;
                        setTimeout(() => {
                            pauseRef.current = false;
                            lastScannedRef.current = null;
                            requestRef.current = requestAnimationFrame(tick);
                        }, 3000);
                        return;
                    } else {
                        stopCamera();
                        return;
                    }
                }
            }
        }
        requestRef.current = requestAnimationFrame(tick);
    }, [onScanSuccess, stopCamera]);

    useEffect(() => {
        if (isOpen) {
            if (inputRef.current) {
                inputRef.current.focus();
            }
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, startCamera, stopCamera]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (manualToken.trim()) {
            const success = onScanSuccess(manualToken.trim());
            if (success !== false) stopCamera();
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
                    const success = onScanSuccess(code.data);
                    if (success !== false) stopCamera();
                } else {
                    showErrorToast('QR Code Not Found', 'Could not read a QR code from the uploaded image.');
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Modal bottomSheetOnMobile={true}
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
                        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 group">
                            
                            {!cameraError && (
                                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
                            )}
                            <canvas ref={canvasRef} className="hidden" />

                            {cameraError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-100 z-0">
                                    <VideoOff className="w-8 h-8 mb-2 text-gray-300" />
                                    <span className="text-xs">{cameraError}</span>
                                </div>
                            )}

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div className="w-[60%] aspect-square border-2 border-blue-500 rounded-[20px] relative">
                                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-[20px]" />
                                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-[20px]" />
                                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-[20px]" />
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-[20px]" />
                                </div>
                            </div>

                            <form onSubmit={handleFormSubmit} className="w-full h-full opacity-0 absolute inset-0 z-20">
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

                        <p className="text-sm text-gray-500 mt-4 mb-6 text-center px-4">
                            Align the QR code within the frame to scan using your camera.
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
