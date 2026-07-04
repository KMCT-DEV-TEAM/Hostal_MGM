import React from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isSubmitting = false,
    variant = 'primary', // 'primary', 'danger'
    confirmButtonClass = '',
}) => {
    if (!isOpen || typeof document === "undefined") return null;

    const variantStyles = {
        primary: {
            button: 'bg-[#0A437A] text-white hover:bg-secondary',
        },
        danger: {
            button: 'bg-red-500 text-white hover:bg-red-600',
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-t-2xl md:rounded-2xl rounded-b-none shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up md:animate-in md:zoom-in-95 mt-auto md:mt-0">
                <div className="p-6">
                    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                    <p className="text-xs text-gray-500 mt-2 mb-6 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3 justify-end items-center">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer text-gray-600 hover:bg-gray-100 border border-gray-200`}
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isSubmitting}
                            className={`flex items-center justify-center min-w-[80px] px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed ${confirmButtonClass || variantStyles[variant].button}`}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ConfirmationModal;
