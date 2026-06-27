import React, { useState } from "react";
import { Lock, KeyRound } from "lucide-react";
import Modal from "@/components/ui/Modal";

export default function PasswordConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isVerifying,
  title = "Restricted Access",
  subtitle = "Please verify your identity by entering your password.",
  confirmText = "Verify Identity"
}) {
  const [password, setPassword] = useState("");

  // Reset states when closed
  React.useEffect(() => {
    if (!isOpen) {
      setPassword("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) return;
    onConfirm(password);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center -mt-8">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          {subtitle}
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative">
            <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A437A] focus:ring-1 focus:ring-[#0A437A]/20 transition-all"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying || !password.trim()}
            className="w-full py-3 bg-[#0A437A] hover:bg-[#0A437A]/90 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </form>
      </div>
    </Modal>
  );
}
