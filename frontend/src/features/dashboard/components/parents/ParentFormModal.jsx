import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { useAuthStore } from "@/store/useAuthStore";
import { sendOtp } from "@/services/auth.service";
import OtpInput from "@/components/ui/OtpInput";

export default function ParentFormModal({
  studentId,
  editingParent,
  onClose,
  onSave,
}) {
  const isEdit = !!editingParent;
  const role = useAuthStore((s) => s.user?.role);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [parentEmail, setParentEmail] = useState(
    editingParent?.email || editingParent?.parentEmail || "",
  );

  const [parentOtp, setParentOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyOtpValue, setVerifyOtpValue] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const sendEmailOtp = async (email) => {
    if (!email) {
      setOtpError("Please enter an email before sending OTP");
      return;
    }

    try {
      setSendingOtp(true);
      setOtpError("");

      await sendOtp({ email });

      setVerifyModalOpen(true);
      setVerifyOtpValue("");
    } catch (error) {
      setOtpError(error?.response?.data?.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtpSubmit = () => {
    if (!verifyOtpValue || verifyOtpValue.length !== 6) {
      setOtpError("Please enter the 6-digit OTP");
      return;
    }

    setParentOtp(verifyOtpValue);
    setEmailVerified(true);
    setVerifyModalOpen(false);
  };
  useEffect(() => {
    if (!isEdit && role) {
      setLoadingStudents(true);
      // Dynamically import to avoid circular dependencies if any
      import("@/services/student.service").then(({ getStudents }) => {
        getStudents(role, { limit: 1000 })
          .then((data) => {
            setStudents(data.students || []);
          })
          .catch((err) => {
            console.error("Failed to load students", err);
          })
          .finally(() => setLoadingStudents(false));
      });
    }
  }, [isEdit, role]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isEdit && !emailVerified) {
      setOtpError("Please verify email first");
      return;
    }

    const formData = new FormData(e.target);

    const payload = {
      parentName: formData.get("name"),
      phone: formData.get("phone"),
      relationship: formData.get("relation"),
      email: parentEmail,
      parentOtp,
    };

    if (!isEdit) {
      payload.studentId = studentId || formData.get("studentId");
    }

    onSave?.(payload);
  };
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? "Edit Parent" : "Add New Parent"}
      titleSize="text-lg"
      subtitle="Edit the details of parent"
      maxWidth="max-w-xl"
      asForm
      onSubmit={handleSubmit}
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-5 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-secondary"
          >
            {isEdit ? "Save Changes" : "Save"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-5">
        {/* Full Name */}
        <div className={isEdit ? "col-span-2" : ""}>
          <label className="block mb-1.5 text-xs font-medium">
            Full Name *
          </label>

          <input
            name="name"
            required
            defaultValue={
              editingParent?.name || editingParent?.parentName || ""
            }
            placeholder="Enter full name"
            className="w-full h-10 px-3 border border-gray-200 rounded-md text-xs outline-none focus:border-secondary"
          />
        </div>

        {/* Email - Add only */}
        {!isEdit && !studentId && (
          <div>
            <label className="block mb-1.5 text-xs font-medium">
              Email Address *
            </label>

            <input
              name="email"
              type="email"
              required
              defaultValue={editingParent?.email || ""}
              placeholder="Enter email address"
              className="w-full h-10 px-3 border border-gray-200 rounded-md text-xs outline-none focus:border-secondary"
            />
          </div>
        )}

        {/* Phone */}
        <div>
          <label className="block mb-1.5 text-xs font-medium">
            Phone Number *
          </label>

          <div className="flex h-10 border border-gray-200 rounded-md overflow-hidden focus-within:border-secondary">
            <div className="px-3 border-r border-gray-200 flex items-center gap-2 text-xs shrink-0">
              <img
                src="https://flagcdn.com/w20/in.png"
                alt="India"
                className="w-4 h-3"
              />
              +91
            </div>

            <input
              name="phone"
              type="text"
              required
              defaultValue={editingParent?.phone || ""}
              placeholder="00000 00000"
              className="flex-1 px-3 text-xs outline-none"
            />
          </div>
        </div>

        {/* Relation */}
        <div>
          <label className="block mb-1.5 text-xs font-medium">Relation *</label>

          <select
            name="relation"
            required
            defaultValue={
              editingParent?.relation || editingParent?.relationship || ""
            }
            className="w-full h-10 px-3 border border-gray-200 rounded-md text-xs outline-none focus:border-secondary"
          >
            <option value="">Select Relation</option>
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="guardian">Guardian</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block mb-1.5 text-xs font-medium">
            Email Address *
          </label>

          <div className="flex gap-2">
            <input
              type="email"
              required
              value={parentEmail}
              onChange={(e) => {
                setParentEmail(e.target.value);
                setEmailVerified(false);
              }}
              placeholder="Enter email address"
              className="w-full h-10 px-3 border border-gray-200 rounded-md text-xs outline-none focus:border-secondary"
            />

            <button
              type="button"
              onClick={() => sendEmailOtp(parentEmail)}
              disabled={!parentEmail || sendingOtp}
              className="px-4 bg-primary text-white rounded-md text-xs"
            >
              {sendingOtp ? "Sending..." : "Verify"}
            </button>
          </div>

          {emailVerified && (
            <p className="text-green-600 text-xs mt-1">
              Email verified successfully
            </p>
          )}

          {otpError && <p className="text-red-500 text-xs mt-1">{otpError}</p>}
        </div>
      </div>

      {verifyModalOpen && (
        <Modal
          isOpen
          onClose={() => setVerifyModalOpen(false)}
          title="Verify Parent Email"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <OtpInput value={verifyOtpValue} onChange={setVerifyOtpValue} />

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => sendEmailOtp(parentEmail)}
                className="px-3 py-2 bg-gray-100 rounded-md text-xs"
              >
                Resend OTP
              </button>

              <button
                type="button"
                onClick={handleVerifyOtpSubmit}
                className="px-3 py-2 bg-primary text-white rounded-md text-xs"
              >
                Confirm OTP
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
