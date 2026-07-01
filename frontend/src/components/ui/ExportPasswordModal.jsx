import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import DateInput from "@/components/ui/DateInput";

export default function ExportPasswordModal({
  isOpen,
  onClose,
  onConfirm,
  isVerifying,
  title = "Verify Password",
  subtitle = "Please enter your password to export this sensitive data.",
  showDateFilters = false
}) {
  const [password, setPassword] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Reset states when closed
  React.useEffect(() => {
    if (!isOpen) {
      setPassword("");
      setStartDate("");
      setEndDate("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) return;
    if (showDateFilters) {
      onConfirm({ password, startDate, endDate });
    } else {
      onConfirm(password);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth="max-w-[90%] sm:max-w-md !p-5 sm:!p-8"
      asForm
      onSubmit={handleSubmit}
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            disabled={isVerifying}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isVerifying || !password}
            className="px-5 py-2 bg-[#0A437A] text-white rounded-md text-xs font-medium hover:bg-[#083663] disabled:opacity-50 flex items-center justify-center min-w-[120px] cursor-pointer"
          >
            {isVerifying ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Confirm & Export"
            )}
          </button>
        </div>
      }
    >
      <div className="py-2 space-y-4">
        {showDateFilters && (
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block mb-1.5 text-xs font-medium text-gray-700">From Date</label>
              <DateInput
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Select from date"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-secondary"
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1.5 text-xs font-medium text-gray-700">To Date</label>
              <DateInput
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Select to date"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-secondary"
              />
            </div>
          </div>
        )}
        
        <div>
          <label className="block mb-1.5 text-xs font-medium text-gray-700">
            Your Password <span className="text-red-500">*</span>
          </label>
        <Input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        </div>
      </div>
    </Modal>
  );
}
