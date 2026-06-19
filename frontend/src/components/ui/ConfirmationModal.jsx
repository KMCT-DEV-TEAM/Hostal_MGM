import React from "react";
import { createPortal } from "react-dom";

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
  loadingText = "Confirming...",
}) {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
        <h3 className="text-sm font-bold text-gray-900">
          {title}
        </h3>

        <p className="text-xs text-gray-500 mt-1 mb-6">
          {message}
        </p>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${confirmButtonClass}`}
          >
            {isSubmitting ? loadingText : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}