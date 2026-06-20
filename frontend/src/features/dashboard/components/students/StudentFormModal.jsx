import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import OtpInput from "@/components/ui/OtpInput";
import { sendOtp } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { getHostels } from "@/services/hostel.service";
import { getOrganizations } from "@/services/organization.service";
import { ROLES } from "@/constants/roles";
import otpService from "@/services/otp.service";
import { createStudentSchema, updateStudentSchema } from "../../validation/student";

// Turns a zod safeParse error into { fieldName: "message" }.
// Only keeps the first message per field, which is enough for inline display.
function toFieldErrors(zodError) {
  const fieldErrors = {};
  for (const issue of zodError.issues) {
    const key = issue.path[0];
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

export default function StudentFormModal({ editingStudent, onClose, onSave }) {
  const [studentEmail, setStudentEmail] = useState(editingStudent?.email || "");
  const [parentEmail, setParentEmail] = useState("");
  const [studentOtp, setStudentOtp] = useState("");
  const [parentOtp, setParentOtp] = useState("");
  const [studentOtpSent, setStudentOtpSent] = useState(false);
  const [parentOtpSent, setParentOtpSent] = useState(false);
  const [otpErrors, setOtpErrors] = useState({ student: "", parent: "" });
  const [sendingOtpFor, setSendingOtpFor] = useState("");
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [verifyOtpValue, setVerifyOtpValue] = useState("");
  const [emailVerified, setEmailVerified] = useState({
    student: false,
    parent: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const role = useAuthStore((state) => state.user?.role);
  const userOrganization = useAuthStore((state) => {
    const organization = state.user?.organization;
    if (!organization) return null;
    return typeof organization === "string"
      ? organization
      : organization._id || null;
  });
  const [hostels, setHostels] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loadingHostels, setLoadingHostels] = useState(false);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [organizationId, setOrganizationId] = useState(
    editingStudent?.organizationId || "",
  );
  const [hostelId, setHostelId] = useState(editingStudent?.hostelId || "");

  useEffect(() => {
    if (role !== ROLES.SUPER_ADMIN && userOrganization) {
      setOrganizationId(userOrganization);
    }
  }, [role, userOrganization]);

  const loadHostels = async () => {
    setLoadingHostels(true);
    try {
      const res = await getHostels({ page: 1, limit: 0, status: "Active" });
      setHostels(res.data || []);
    } catch (error) {
      console.error("Failed to load hostels", error);
    } finally {
      setLoadingHostels(false);
    }
  };

  const loadOrganizations = async () => {
    setLoadingOrganizations(true);
    try {
      const res = await getOrganizations({ limit: 100, status: "Active" });
      setOrganizations(res.data || []);
    } catch (error) {
      console.error("Failed to load organizations", error);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  useEffect(() => {
    loadHostels();
    if (role === ROLES.SUPER_ADMIN) {
      loadOrganizations();
    }
  }, [role]);

  // Clears a single field's zod error as soon as the user edits that field.
  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const rawPayload = Object.fromEntries(
      [...formData.entries()].filter(([, value]) => value !== ""),
    );

    if (editingStudent) {
      // These fields are never editable from this form; strip before validating/saving.
      delete rawPayload.email;
      delete rawPayload.studentOtp;
      delete rawPayload.parentOtp;
      delete rawPayload.parentEmail;
      delete rawPayload.parentName;
      delete rawPayload.parentPhone;
      delete rawPayload.relationship;

      const result = updateStudentSchema.safeParse(rawPayload);
      if (!result.success) {
        setFieldErrors(toFieldErrors(result.error));
        return;
      }
      setFieldErrors({});

      try {
        setSaving(true);
        await onSave(result.data);
      } finally {
        setSaving(false);
      }
      return;
    }

    // Add-student flow: OTP/verification gate runs first, same as before.
    if (!studentOtp || !parentOtp) {
      setOtpErrors({
        student: !studentOtp ? "Please enter the student OTP" : "",
        parent: !parentOtp ? "Please enter the parent OTP" : "",
      });
      return;
    }
    if (!emailVerified.student || !emailVerified.parent) {
      setOtpErrors({
        student: !emailVerified.student ? "Student email not verified" : "",
        parent: !emailVerified.parent ? "Parent email not verified" : "",
      });
      return;
    }

    const result = createStudentSchema.safeParse(rawPayload);
    if (!result.success) {
      setFieldErrors(toFieldErrors(result.error));
      return;
    }
    setFieldErrors({});

    try {
      setSaving(true);
      await onSave(result.data);
    } finally {
      setSaving(false);
    }
  };

  const sendEmailOtp = async (email, type, openModal = false) => {
    if (!email) {
      setOtpErrors((prev) => ({
        ...prev,
        [type]: "Please enter an email before sending OTP",
      }));
      return;
    }

    setSendingOtpFor(type);
    setOtpErrors((prev) => ({ ...prev, [type]: "" }));

    try {
      await sendOtp({ email });

      if (type === "student") {
        setStudentOtpSent(true);
      } else {
        setParentOtpSent(true);
      }

      if (openModal) {
        setVerifyTarget(type);
        setVerifyOtpValue(type === "student" ? studentOtp : parentOtp);
        setVerifyModalOpen(true);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to send OTP";
      setOtpErrors((prev) => ({ ...prev, [type]: message }));
    } finally {
      setSendingOtpFor("");
    }
  };

  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const handleVerifyOtpSubmit = async () => {
    if (!verifyOtpValue || verifyOtpValue.length !== 6) {
      setOtpErrors((prev) => ({
        ...prev,
        [verifyTarget]: "Please enter the 6-digit OTP",
      }));
      return;
    }

    try {
      setVerifyingOtp(true);

      const email = verifyTarget === "student" ? studentEmail : parentEmail;
      await otpService.verifyOtp(email, verifyOtpValue);

      if (verifyTarget === "student") {
        setStudentOtp(verifyOtpValue);
        setEmailVerified((prev) => ({
          ...prev,
          student: true,
        }));
      } else {
        setParentOtp(verifyOtpValue);
        setEmailVerified((prev) => ({
          ...prev,
          parent: true,
        }));
      }

      setOtpErrors((prev) => ({
        ...prev,
        [verifyTarget]: "",
      }));

      setVerifyModalOpen(false);
    } catch (error) {
      const message = error?.response?.data?.message || "Invalid OTP";
      setOtpErrors((prev) => ({
        ...prev,
        [verifyTarget]: message,
      }));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const openVerifyModal = async (type) => {
    const email = type === "student" ? studentEmail : parentEmail;
    setVerifyTarget(type);
    setVerifyOtpValue("");
    await sendEmailOtp(email, type, true);
  };

  // If it's the simplified edit modal (from the original code snippet)
  if (editingStudent) {
    return (
      <Modal
        isOpen
        onClose={onClose}
        title="Edit Student"
        subtitle="Update student information"
        maxWidth="max-w-4xl"
        asForm
        onSubmit={handleSubmit}
        footer={
          <>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-lg text-xs font-medium"
            >
              {saving ? "Updating..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-200 rounded-lg text-xs"
            >
              Cancel
            </button>
          </>
        }
      >
        <div className="space-y-8">
          <section>
            <h3 className="text-sm font-medium text-primary">
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-xs mb-1.5 font-medium">
                  Full Name *
                </label>

                <input
                  name="name"
                  defaultValue={editingStudent.name}
                  required
                  onChange={() => clearFieldError("name")}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                />
                {fieldErrors.name && (
                  <p className="text-red-500 text-[11px] mt-1">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs mb-1.5 font-medium">
                  Email
                </label>

                <input
                  value={editingStudent.email}
                  disabled
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-gray-100 cursor-not-allowed"
                />

                <p className="text-[11px] text-gray-400 mt-1">
                  Email can only be changed from Change Email.
                </p>
              </div>

              <div>
                <label className="block text-xs mb-1.5 font-medium">
                  Phone *
                </label>

                <input
                  name="phone"
                  defaultValue={editingStudent.phone}
                  required
                  onChange={() => clearFieldError("phone")}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                />
                {fieldErrors.phone && (
                  <p className="text-red-500 text-[11px] mt-1">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs mb-1.5 font-medium">
                  Gender *
                </label>

                <select
                  name="gender"
                  defaultValue={editingStudent.gender}
                  onChange={() => clearFieldError("gender")}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {fieldErrors.gender && (
                  <p className="text-red-500 text-[11px] mt-1">
                    {fieldErrors.gender}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs mb-1.5 font-medium">
                  Date of Birth
                </label>

                <input
                  type="date"
                  name="dob"
                  defaultValue={editingStudent.dob?.split("T")[0]}
                  onChange={() => clearFieldError("dob")}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                />
                {fieldErrors.dob && (
                  <p className="text-red-500 text-[11px] mt-1">
                    {fieldErrors.dob}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs mb-1.5 font-medium">
                  Status
                </label>

                <select
                  name="status"
                  defaultValue={editingStudent.isActive ? "active" : "inactive"}
                  onChange={() => clearFieldError("status")}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {fieldErrors.status && (
                  <p className="text-red-500 text-[11px] mt-1">
                    {fieldErrors.status}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-primary">
              Academic Information
            </h3>

            <div className="grid grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-xs mb-1.5 font-medium">
                  Course
                </label>

                <input
                  name="course"
                  defaultValue={editingStudent.course}
                  onChange={() => clearFieldError("course")}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                />
                {fieldErrors.course && (
                  <p className="text-red-500 text-[11px] mt-1">
                    {fieldErrors.course}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs mb-1.5 font-medium">
                  Department
                </label>

                <input
                  name="department"
                  defaultValue={editingStudent.department}
                  onChange={() => clearFieldError("department")}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                />
                {fieldErrors.department && (
                  <p className="text-red-500 text-[11px] mt-1">
                    {fieldErrors.department}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs mb-1.5 font-medium">
                  Academic Year
                </label>

                <input
                  name="academicYear"
                  defaultValue={editingStudent.academicYear}
                  onChange={() => clearFieldError("academicYear")}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                />
                {fieldErrors.academicYear && (
                  <p className="text-red-500 text-[11px] mt-1">
                    {fieldErrors.academicYear}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs mb-1.5 font-medium">
                  Hostel
                </label>

                <select
                  name="hostelId"
                  defaultValue={
                    editingStudent.hostelId?._id || editingStudent.hostelId
                  }
                  onChange={() => clearFieldError("hostelId")}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                >
                  <option value="">Select Hostel</option>

                  {hostels.map((hostel) => (
                    <option key={hostel._id} value={hostel._id}>
                      {hostel.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.hostelId && (
                  <p className="text-red-500 text-[11px] mt-1">
                    {fieldErrors.hostelId}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-primary">
              Address Information
            </h3>

            <div className="mt-4">
              <textarea
                name="address"
                defaultValue={editingStudent.address}
                onChange={() => clearFieldError("address")}
                className="w-full p-3 border border-gray-200 rounded-lg text-xs"
                rows={5}
              />
              {fieldErrors.address && (
                <p className="text-red-500 text-[11px] mt-1">
                  {fieldErrors.address}
                </p>
              )}
            </div>
          </section>
        </div>
      </Modal>
    );
  }

  // Add New Student Modal (from the original code snippet)
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Add New Student"
      subtitle="Fill in the details to manually create a new Student"
      maxWidth="max-w-4xl"
      asForm={true}
      onSubmit={handleSubmit}
      footer={
        <>
          <button
            type="submit"
            disabled={saving || !emailVerified.student || !emailVerified.parent}
            className="px-6 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-[#0A437A]/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </>
      }
    >
      <div className="space-y-8">
        {verifyModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setVerifyModalOpen(false)}
            title={`Verify ${verifyTarget === "student" ? "Student" : "Parent"} Email`}
            maxWidth="max-w-xl"
            asForm={false}
          >
            <div className="space-y-4">
              <p className="text-xs text-text-secondary">
                Enter the 6-digit OTP sent to{" "}
                {verifyTarget === "student" ? studentEmail : parentEmail}.
              </p>
              <OtpInput
                value={verifyOtpValue}
                onChange={setVerifyOtpValue}
                error={!!otpErrors[verifyTarget]}
              />
              {otpErrors[verifyTarget] && (
                <p className="text-red-500 text-xs">
                  {otpErrors[verifyTarget]}
                </p>
              )}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    sendEmailOtp(
                      verifyTarget === "student" ? studentEmail : parentEmail,
                      verifyTarget,
                      true,
                    )
                  }
                  disabled={sendingOtpFor === verifyTarget}
                  className="px-3 py-2 bg-gray-100 text-xs rounded-lg text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {sendingOtpFor === verifyTarget ? "Sending..." : "Resend OTP"}
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtpSubmit}
                  disabled={verifyingOtp}
                  className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  {verifyingOtp ? "Verifying..." : "Confirm OTP"}
                </button>
              </div>
            </div>
          </Modal>
        )}
        {/* Basic Info */}
        <section>
          <h3 className="text-[14px] font-medium text-primary">Basic Info</h3>
          <h5 className="text-xs font-medium text-text-secondary mb-4 pb-2 border-b border-gray-200">
            Basic contact information of the student
          </h5>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs mb-1.5 font-medium">
                Admission No *
              </label>
              <input
                name="studentId"
                required
                onChange={() => clearFieldError("studentId")}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                placeholder="Enter the student id"
              />
              {fieldErrors.studentId && (
                <p className="text-red-500 text-[11px] mt-1">
                  {fieldErrors.studentId}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium">
                Full Name *
              </label>
              <input
                name="name"
                required
                onChange={() => clearFieldError("name")}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                placeholder="Enter your full name"
              />
              {fieldErrors.name && (
                <p className="text-red-500 text-[11px] mt-1">
                  {fieldErrors.name}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium">
                Gender *
              </label>
              <select
                name="gender"
                required
                onChange={() => clearFieldError("gender")}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400 outline-none focus:border-secondary"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {fieldErrors.gender && (
                <p className="text-red-500 text-[11px] mt-1">
                  {fieldErrors.gender}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium">
                Date Of Birth *
              </label>
              <input
                name="dob"
                type="date"
                onChange={() => clearFieldError("dob")}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400 outline-none focus:border-secondary"
              />
              {fieldErrors.dob && (
                <p className="text-red-500 text-[11px] mt-1">
                  {fieldErrors.dob}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Academic Information */}
        <section>
          <h3 className="text-[14px] font-medium text-primary ">
            Academic Information
          </h3>
          <h5 className="text-xs font-medium text-text-secondary mb-4 pb-2 border-b border-gray-200">
            Academic information of the student
          </h5>
          <div className="grid grid-cols-2 gap-6">
            {role === ROLES.SUPER_ADMIN ? (
              <div>
                <label className="block text-xs mb-1.5 font-medium">
                  Organization *
                </label>
                <select
                  name="organizationId"
                  required
                  value={organizationId}
                  onChange={(e) => {
                    setOrganizationId(e.target.value);
                    clearFieldError("organizationId");
                  }}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400 outline-none focus:border-secondary"
                >
                  <option value="">Select organization</option>
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                {loadingOrganizations && (
                  <p className="text-xs text-text-secondary mt-2">
                    Loading organizations...
                  </p>
                )}
                {fieldErrors.organizationId && (
                  <p className="text-red-500 text-[11px] mt-1">
                    {fieldErrors.organizationId}
                  </p>
                )}
              </div>
            ) : (
              <input
                type="hidden"
                name="organizationId"
                value={organizationId}
              />
            )}
            <div>
              <label className="block text-xs mb-1.5 font-medium">
                Course *
              </label>
              <input
                name="course"
                onChange={() => clearFieldError("course")}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                placeholder="Course"
              />
              {fieldErrors.course && (
                <p className="text-red-500 text-[11px] mt-1">
                  {fieldErrors.course}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium">
                Department *
              </label>
              <input
                name="department"
                onChange={() => clearFieldError("department")}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                placeholder="Department"
              />
              {fieldErrors.department && (
                <p className="text-red-500 text-[11px] mt-1">
                  {fieldErrors.department}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium">
                Academic Year *
              </label>
              <input
                name="academicYear"
                onChange={() => clearFieldError("academicYear")}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                placeholder="2024-2025"
              />
              {fieldErrors.academicYear && (
                <p className="text-red-500 text-[11px] mt-1">
                  {fieldErrors.academicYear}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-xs mb-1.5 font-medium">
                Assign Hostel
              </label>
              <select
                name="hostelId"
                value={hostelId}
                onChange={(e) => {
                  setHostelId(e.target.value);
                  clearFieldError("hostelId");
                }}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400 outline-none focus:border-secondary"
              >
                <option value="">Select hostel</option>
                {hostels.map((hostel) => (
                  <option key={hostel._id} value={hostel._id}>
                    {hostel.name}
                  </option>
                ))}
              </select>
              {loadingHostels && (
                <p className="text-xs text-text-secondary mt-2">
                  Loading hostels...
                </p>
              )}
              {fieldErrors.hostelId && (
                <p className="text-red-500 text-[11px] mt-1">
                  {fieldErrors.hostelId}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Contact & Address */}
        <section className="w-full">
          <div className="w-full">
            <h3 className="text-[14px] font-medium text-primary">
              Contact Information
            </h3>
            <h5 className="text-xs font-medium text-text-secondary mb-4 pb-2 border-b border-gray-200">
              Contact information of the student
            </h5>
            <div className="flex w-full justify-between gap-6">
              <div className="col-span-2 w-[50%]">
                <label className="block text-xs font-medium text-black mb-1">
                  Phone Number *
                </label>
                <div className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:border-secondary">
                  <div className="px-2 py-2 border-r border-gray-200 flex items-center gap-1 text-xs text-black">
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
                    placeholder="00000 00000"
                    onChange={() => clearFieldError("phone")}
                    className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="text-red-500 text-[11px] mt-1">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>
              <div className="col-span-2 w-[50%]">
                <label className="block text-xs font-medium text-black mb-1">
                  Email Address *
                </label>
                <div className="flex gap-2">
                  <input
                    name="email"
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => {
                      setStudentEmail(e.target.value);
                      setStudentOtp("");
                      setEmailVerified((prev) => ({
                        ...prev,
                        student: false,
                      }));
                      clearFieldError("email");
                    }}
                    placeholder="Enter the email"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                  />
                  <button
                    type="button"
                    onClick={() => openVerifyModal("student")}
                    disabled={sendingOtpFor === "student" || !studentEmail}
                    className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-secondary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendingOtpFor === "student" ? "Sending..." : "Verify"}
                  </button>
                </div>
                {emailVerified.student && (
                  <p className="text-xs text-green-600 mt-1">
                    Student email verified
                  </p>
                )}
                {fieldErrors.email && (
                  <p className="text-red-500 text-[11px] mt-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>
            </div>
          </div>
          <input type="hidden" name="studentOtp" value={studentOtp} />
        </section>

        <section>
          <h3 className="text-[14px] font-medium text-primary">
            Address Information
          </h3>
          <h5 className="text-xs font-medium text-text-secondary mb-4 pb-2 border-b border-gray-200 ">
            Address information of the student
          </h5>
          <label className="block text-xs mb-1.5 font-medium">
            Full Address *
          </label>
          <textarea
            name="address"
            onChange={() => clearFieldError("address")}
            className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
            style={{ minHeight: 106 }}
            placeholder="text your address"
          />
          {fieldErrors.address && (
            <p className="text-red-500 text-[11px] mt-1">
              {fieldErrors.address}
            </p>
          )}
        </section>

        {/* Parent Information */}
        <section>
          <h3 className="text-sm w-full font-medium text-primary mb-4 pb-2 border-b border-gray-200 ">
            Parent Information
          </h3>
          <div className="grid grid-cols-2 w-full gap-6">
            <div>
              <label className="block text-xs mb-1.5 font-medium text-black">
                Full Name *
              </label>
              <input
                name="parentName"
                required
                onChange={() => clearFieldError("parentName")}
                placeholder="Enter the name"
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
              />
              {fieldErrors.parentName && (
                <p className="text-red-500 text-[11px] mt-1">
                  {fieldErrors.parentName}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium text-black">
                Relation *
              </label>
              <select
                name="relationship"
                required
                onChange={() => clearFieldError("relationship")}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400 outline-none focus:border-secondary"
              >
                <option value="">Select</option>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
              </select>
              {fieldErrors.relationship && (
                <p className="text-red-500 text-[11px] mt-1">
                  {fieldErrors.relationship}
                </p>
              )}
            </div>
          </div>
          <div className="flex w-full justify-between gap-6 mt-6">
            <div className="col-span-2 w-[50%]">
              <label className="block text-xs font-medium text-black mb-1">
                Phone Number *
              </label>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:border-secondary">
                <div className="px-2 py-2 border-r border-gray-200 flex items-center gap-1 text-xs text-black">
                  <img
                    src="https://flagcdn.com/w20/in.png"
                    alt="India"
                    className="w-4 h-3"
                  />
                  +91
                </div>
                <input
                  name="parentPhone"
                  type="text"
                  required
                  placeholder="00000 00000"
                  onChange={() => clearFieldError("parentPhone")}
                  className="w-full px-3 py-2 outline-none bg-transparent text-xs"
                />
              </div>
              {fieldErrors.parentPhone && (
                <p className="text-red-500 text-[11px] mt-1">
                  {fieldErrors.parentPhone}
                </p>
              )}
            </div>
            <div className="col-span-2 w-[50%]">
              <label className="block text-xs font-medium text-black mb-1">
                Email Address *
              </label>
              <div className="flex gap-2">
                <input
                  name="parentEmail"
                  type="email"
                  required
                  value={parentEmail}
                  onChange={(e) => {
                    setParentEmail(e.target.value);
                    setParentOtp("");
                    setEmailVerified((prev) => ({
                      ...prev,
                      parent: false,
                    }));
                    clearFieldError("parentEmail");
                  }}
                  placeholder="Enter the email"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                />
                <button
                  type="button"
                  onClick={() => openVerifyModal("parent")}
                  disabled={sendingOtpFor === "parent" || !parentEmail}
                  className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-secondary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingOtpFor === "parent" ? "Sending..." : "Verify"}
                </button>
              </div>
              {emailVerified.parent && (
                <p className="text-xs text-green-600 mt-1">
                  Parent email verified
                </p>
              )}
              {fieldErrors.parentEmail && (
                <p className="text-red-500 text-[11px] mt-1">
                  {fieldErrors.parentEmail}
                </p>
              )}
            </div>
          </div>
          <input type="hidden" name="parentOtp" value={parentOtp} />
        </section>
      </div>
    </Modal>
  );
}