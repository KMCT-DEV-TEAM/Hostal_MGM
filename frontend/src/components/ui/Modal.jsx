import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function Modal({
  isOpen = true,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "max-w-4xl",
  asForm = false,
  onSubmit,
  avatar,
}) {
  if (!isOpen || typeof document === "undefined") return null;

  const Wrapper = asForm ? "form" : "div";

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      <Wrapper
        className={`bg-white rounded-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200`}
        onSubmit={asForm ? onSubmit : undefined}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-3">
              {avatar && (
            <div className="w-12 h-12 bg-[#0A437A] rounded-xl flex items-center justify-center text-white">
                <span className="font-bold text-xl uppercase">
                  {(avatar || title || "")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2) || "?"}
                </span>
            </div>
              )}
            <div>
              {title && (
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              )}
              {subtitle && (
                <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Content */}
        {children}

        {/* Footer */}
        {footer && (
          <div className="mt-10 pt-6 border-t border-gray-200 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </Wrapper>
    </div>
  );

  return createPortal(modalContent, document.body);
}
