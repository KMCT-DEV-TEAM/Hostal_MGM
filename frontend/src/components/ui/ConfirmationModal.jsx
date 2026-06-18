import React from 'react';

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmButtonClass = "bg-[#0A437A] text-white hover:bg-[#083663]",
    isSubmitting = false,
    loadingText = "Confirming..."
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-sm font-bold text-gray-900 cursor-pointer">{title}</h3>
                <p className="text-xs text-gray-500 mt-1 mb-6 cursor-pointer">
                    {message}
                </p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                        disabled={isSubmitting}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        disabled={isSubmitting}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${confirmButtonClass}`}
                    >
                        {isSubmitting ? loadingText : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
