import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft } from 'lucide-react';
import OtpInput from '@/components/ui/OtpInput';

export default function EmailVerificationModal({ isOpen, onClose, onVerify, email, isSubmitting, onResend, error }) {
    const [otp, setOtp] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [resendTimer, setResendTimer] = useState(300);
    const [isTimerActive, setIsTimerActive] = useState(true);

    useEffect(() => {
        let interval;
        if (isTimerActive && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        } else if (resendTimer === 0) {
            setIsTimerActive(false);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, resendTimer]);

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    const handleVerify = () => {
        if (otp.length === 6) {
            onVerify(otp);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            if (onResend) {
                await onResend();
            } else {
                await requestEmailChange({ newEmail: email });
            }
            setResendTimer(300);
            setIsTimerActive(true);
            const { showSuccessToast } = await import('@/utils/toast');
            showSuccessToast('OTP Resent', 'Check your new email for the verification code');
        } catch (error) {
            const { showErrorToast } = await import('@/utils/toast');
            showErrorToast('Failed', error?.message || 'Failed to resend OTP');
        } finally {
            setIsResending(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <form onSubmit={(e) => {
                e.preventDefault();
                handleVerify();
            }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-center">
                <div className="flex justify-between items-center mb-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={24} strokeWidth={1.5} />
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-md border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                <h3 className="text-[32px] font-bold text-[#0A437A] mb-4">Enter the code</h3>
                <p className="text-gray-500 mb-3 text-[15px]">
                    A 6-digit code was sent to <span className="text-[#0A437A]">{email || '@usergmail.com'}</span>
                </p>

                <div className="flex justify-center gap-2 sm:gap-3 mb-2 w-full">
                    <OtpInput value={otp} onChange={setOtp} error={!!error} />
                </div>
                {error && (
                    <p className="text-red-500 text-xs mb-6 font-medium">{error}</p>
                )}

                <p className={`text-[14px] text-gray-400 font-medium ${error ? 'mb-8' : 'mb-8 mt-6'}`}>
                    Didn't receive it ? {resendTimer > 0 ? (
                        <span className="text-gray-500 font-semibold ml-1">Resend in {formatTime(resendTimer)}</span>
                    ) : (
                        <button type="button" onClick={handleResend} disabled={isResending} className="text-[#0A437A] cursor-pointer hover:underline font-semibold ml-1 disabled:opacity-50">
                            {isResending ? 'Sending...' : 'Resend the code'}
                        </button>
                    )}
                </p>

                <button
                    type="submit"
                    disabled={isSubmitting || otp.length !== 6}
                    className="w-full py-3.5 bg-[#0A437A] text-white font-medium rounded-lg hover:bg-[#083663] transition-colors cursor-pointer text-lg disabled:opacity-50"
                >
                    {isSubmitting ? 'Verifying...' : 'Verify'}
                </button>
            </form>
        </div>,
        document.body
    );
}
