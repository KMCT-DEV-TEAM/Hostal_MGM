import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import OtpInput from "@/components/ui/OtpInput";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import otpService from "@/services/otp.service";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import EmailVerificationModal from "@/components/ui/EmailVerificationModal";

export default function ChangeEmailModal({
  isOpen,
  title = "Change Email",
  subjectName = "this user",
  currentEmail = "",
  onClose,
  onConfirmChange,
}) {
  const [oldEmail, setOldEmail] = useState(currentEmail || "");
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setOldEmail(currentEmail || "");
    setNewEmail("");
    setOtp("");
    setOtpModalOpen(false);
    setConfirmOpen(false);
    setIsEmailVerified(false);
    setOtpError("");
  }, [currentEmail, isOpen]);

  const handleNewEmailChange = (event) => {
    setNewEmail(event.target.value);
    setIsEmailVerified(false);
    setOtp("");
    setOtpError("");
  };

  const handleSendOtp = async () => {
    if (!newEmail) {
      showErrorToast("Validation Error", "Please enter a new email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      showErrorToast("Validation Error", "Please enter a valid email address");
      return;
    }

    if (newEmail === oldEmail) {
      showErrorToast(
        "Validation Error",
        "New email must be different from current email",
      );
      return;
    }

    try {
      setSendingOtp(true);
      setOtpError("");
      await otpService.sendOtp(newEmail);
      setOtp("");
      setOtpModalOpen(true);
      showSuccessToast("OTP sent successfully");
    } catch (error) {
      showErrorToast(
        "OTP Failed",
        error?.message || "Failed to send OTP",
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (otpValue) => {
    if (!otpValue || otpValue.length !== 6) {
      setOtpError("Please enter the 6-digit OTP");
      return;
    }

    try {
      setVerifyingOtp(true);
      setOtpError("");
      await otpService.verifyOtp(newEmail, otpValue);
      setOtp(otpValue);
      setIsEmailVerified(true);
      setOtpModalOpen(false);
      showSuccessToast("Email verified successfully");
    } catch (error) {
      const message =
        error?.message || "Invalid or expired OTP";
      setOtpError(message);
      showErrorToast("Verification Failed", message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!isEmailVerified) {
      showErrorToast("Validation Error", "Please verify the new email first");
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirmChange = async () => {
    try {
      setSaving(true);
      await onConfirmChange?.({ oldEmail, newEmail, otp });
      showSuccessToast("Email changed successfully");
      setConfirmOpen(false);
      onClose?.();
    } catch (error) {
      showErrorToast(
        "Action Failed",
        error?.message ||
          "Failed to update email",
      );

      setIsEmailVerified(false);
      setOtp("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal bottomSheetOnMobile={true}
        isOpen={isOpen && !otpModalOpen}
        onClose={saving ? undefined : onClose}
        title={title}
        titleSize="text-xl"
        subtitle={`Change the email of ${subjectName}`}
        maxWidth="max-w-md"
        asForm
        onSubmit={handleSubmit}
        footer={
          <button
            type="submit"
            disabled={!isEmailVerified || saving}
            className={`w-full py-3 text-white text-sm font-medium rounded-lg transition-colors ${
              isEmailVerified && !saving
                ? "bg-[#0A437A] hover:bg-[#083663] cursor-pointer"
                : "bg-[#94A3B8] cursor-not-allowed"
            }`}
          >
            {saving ? "Changing..." : "Change Email"}
          </button>
        }
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2">
              Current Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={oldEmail}
              onChange={(event) => setOldEmail(event.target.value)}
              required
              disabled={saving}
              placeholder="Enter current email"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0A437A] disabled:opacity-60 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2">
              New Email <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <input
                type="email"
                required
                disabled={isEmailVerified || saving}
                value={newEmail}
                onChange={handleNewEmailChange}
                placeholder="Enter new email"
                className="flex-1 min-w-0 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0A437A] disabled:opacity-60 disabled:bg-gray-50"
              />
              {isEmailVerified ? (
                <button
                  type="button"
                  className="px-4 py-2.5 bg-green-50 text-success border border-green-200 text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-default"
                >
                  <Check size={16} /> Verified
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || saving}
                  className="px-4 py-2.5 bg-[#0A437A] text-white text-sm font-medium rounded-lg hover:bg-[#083663] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sendingOtp ? "Sending..." : "Verify"}
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <EmailVerificationModal
        isOpen={otpModalOpen}
        onClose={() => {
          if (!verifyingOtp) setOtpModalOpen(false);
        }}
        onVerify={handleVerifyOtp}
        email={newEmail}
        isSubmitting={verifyingOtp}
        onResend={handleSendOtp}
        error={otpError}
      />

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => {
          if (!saving) setConfirmOpen(false);
        }}
        onConfirm={handleConfirmChange}
        isSubmitting={saving}
        title="Change Email"
        message={`Are you sure you want to change ${subjectName}'s email to ${newEmail}?`}
        confirmText="Change Email"
        loadingText="Changing..."
      />
    </>
  );
}
