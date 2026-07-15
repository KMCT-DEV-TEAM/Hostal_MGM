import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { useAuthStore } from "@/store/useAuthStore";
import { sendOtp } from "@/services/auth.service";
import OtpInput from "@/components/ui/OtpInput";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addParentSchema, editParentSchema } from "@/features/dashboard/validation/parentSchema";
import { useTranslation } from "@/hooks/useTranslation";
import Dropdown from "@/components/ui/Dropdown";

export default function ParentFormModal({
  studentId,
  editingParent,
  onClose,
  onSave,
}) {
  const { t } = useTranslation();
  const isEdit = !!editingParent;
  const role = useAuthStore((s) => s.user?.role);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // OTP State
  const [parentOtp, setParentOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyOtpValue, setVerifyOtpValue] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const initialEmail = editingParent?.email || editingParent?.parentEmail || "";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isEdit ? editParentSchema : addParentSchema),
    defaultValues: {
      name: editingParent?.name || editingParent?.parentName || "",
      email: initialEmail,
      phone: editingParent?.phone || "",
      relation: editingParent?.relation || editingParent?.relationship || "",
      studentId: studentId || "",
    },
  });

  const watchEmail = useWatch({ control, name: "email" });

  useEffect(() => {
    if (!isEdit && role && !studentId) {
      setLoadingStudents(true);
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
  }, [isEdit, role, studentId]);

  const sendEmailOtp = async () => {
    if (!watchEmail) {
      setOtpError("Please enter an email before sending OTP");
      return;
    }

    try {
      setSendingOtp(true);
      setOtpError("");
      await sendOtp({ email: watchEmail });
      setVerifyModalOpen(true);
      setVerifyOtpValue("");
    } catch (error) {
      setOtpError(error?.message || "Failed to send OTP");
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

  const onSubmit = (data) => {
    if (!isEdit && !emailVerified) {
      setOtpError("Please verify email first");
      return;
    }

    const payload = {
      parentName: data.name,
      phone: data.phone,
      relationship: data.relation,
    };

    if (parentOtp) {
      payload.parentOtp = parentOtp;
    }

    if (!isEdit) {
      payload.email = data.email;
      payload.studentId = data.studentId;
    }

    onSave?.(payload);
  };

  const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium animate-in fade-in">{error.message}</p>;
  };

  return (
    <Modal bottomSheetOnMobile={true}
      isOpen
      onClose={onClose}
      title={isEdit ? "Edit Parent" : "Add New Parent"}
      titleSize="text-lg"
      subtitle="Edit the details of parent"
      maxWidth="max-w-xl"
      asForm
      onSubmit={handleSubmit(onSubmit)}
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {isEdit ? "Save Changes" : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-5">
        {/* Full Name */}
        <div className={isEdit ? "col-span-2" : ""}>
          <label className="block mb-1.5 text-xs font-medium">
            Full Name <span className="text-red-500">*</span>
          </label>

          <input
            {...register("name")}
            placeholder="Enter full name"
            className={`w-full h-10 px-3 border rounded-md text-xs outline-none transition-colors ${errors.name ? "border-red-300 focus:border-red-500 bg-red-50/30" : "border-gray-200 focus:border-secondary"
              }`}
          />
          <ErrorMessage error={errors.name} />
        </div>

        {/* Phone */}
        <div>
          <label className="block mb-1.5 text-xs font-medium">
            Phone Number <span className="text-red-500">*</span>
          </label>

          <div className={`flex h-10 border rounded-md overflow-hidden transition-colors ${errors.phone ? "border-red-300 focus-within:border-red-500 bg-red-50/30" : "border-gray-200 focus-within:border-secondary"
            }`}>
            <div className={`px-3 border-r flex items-center gap-2 text-xs shrink-0 ${errors.phone ? "border-red-200" : "border-gray-200"}`}>
              <img
                src="https://flagcdn.com/w20/in.png"
                alt="India"
                className="w-4 h-3"
              />
              +91
            </div>

            <input
              {...register("phone")}
              type="text"
              maxLength={10}
              placeholder="0000000000"
              className="flex-1 px-3 text-xs outline-none bg-transparent"
            />
          </div>
          <ErrorMessage error={errors.phone} />
        </div>

        {/* Relation */}
        <div>
          <label className="block mb-1.5 text-xs font-medium">
            Relation <span className="text-red-500">*</span>
          </label>

          <Controller
            name="relation"
            control={control}
            render={({ field }) => (
              <Dropdown
                options={[
                  { value: "father", label: "Father" },
                  { value: "mother", label: "Mother" },
                  { value: "guardian", label: "Guardian" }
                ]}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select Relation"
                triggerClassName={`w-full h-10 px-3 border rounded-md text-xs outline-none transition-colors cursor-pointer bg-white ${errors.relation ? "border-red-300 focus:border-red-500 bg-red-50/30" : "border-gray-200 focus:border-secondary"
                  }`}
              />
            )}
          />
          <ErrorMessage error={errors.relation} />
        </div>

        {/* Student Selection - Add only */}
        {!isEdit && !studentId && (
          <div className="col-span-2">
            <label className="block mb-1.5 text-xs font-medium">
              Linked Student <span className="text-red-500">*</span>
            </label>

            <Controller
              name="studentId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  options={students.map(student => ({
                    value: student._id || student.id,
                    label: `${student.name} (${student.admissionNo})`
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={loadingStudents ? "Loading students..." : "Select Student"}
                  triggerClassName={`w-full h-10 px-3 border rounded-md text-xs outline-none transition-colors cursor-pointer bg-white ${
                    errors.studentId ? "border-red-300 focus:border-red-500 bg-red-50/30" : "border-gray-200 focus:border-secondary"
                  } ${loadingStudents ? "opacity-50 pointer-events-none" : ""}`}
                />
              )}
            />
            <ErrorMessage error={errors.studentId} />
          </div>
        )}

        {/* Email Address with OTP Verify */}
        {!isEdit && (
          <div className="col-span-2">
            <label className="block mb-1.5 text-xs font-medium">
              Email Address <span className="text-red-500">*</span>
            </label>

            <div className="flex gap-2">
              <input
                {...register("email", {
                  onChange: () => {
                    setEmailVerified(false);
                    setOtpError("");
                  }
                })}
                type="email"
                placeholder="Enter email address"
                className={`w-full h-10 px-3 border rounded-md text-xs outline-none transition-colors ${errors.email ? "border-red-300 focus:border-red-500 bg-red-50/30" : "border-gray-200 focus:border-secondary"
                  }`}
              />

              <button
                type="button"
                onClick={sendEmailOtp}
                disabled={!watchEmail || sendingOtp || emailVerified}
                className="px-4 bg-primary text-white rounded-md text-xs font-medium disabled:opacity-50 min-w-[80px]"
              >
                {sendingOtp ? "Sending..." : emailVerified ? "Verified" : "Verify"}
              </button>

            </div>

            <ErrorMessage error={errors.email} />

            {emailVerified && (
              <p className="text-green-600 text-[10px] mt-1 font-medium animate-in fade-in">
                Email verified successfully
              </p>
            )}

            {otpError && <p className="text-red-500 text-[10px] mt-1 font-medium animate-in fade-in">{otpError}</p>}
          </div>
        )}
      </div>

      {verifyModalOpen && (
        <Modal bottomSheetOnMobile={true}
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
                onClick={sendEmailOtp}
                className="px-3 py-2 bg-gray-100 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                Resend OTP
              </button>

              <button
                type="button"
                onClick={handleVerifyOtpSubmit}
                className="px-3 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-secondary transition-colors"
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
