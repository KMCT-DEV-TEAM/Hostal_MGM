import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import OtpInput from "@/components/ui/OtpInput";
import Dropdown from "@/components/ui/Dropdown";
import { useAuthStore } from "@/store/useAuthStore";
import { getHostels } from "@/services/hostel.service";
import { getOrganizations } from "@/services/organization.service";
import departmentService from "@/services/department.service";
import { ROLES } from "@/constants/roles";
import otpService from "@/services/otp.service";
import { createStudentSchema, updateStudentSchema } from "../../validation/student";
import batchService from "@/services/batch.service";
import courseService from "@/services/course.service";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

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

function toIdString(value) {
  if (!value) return "";
  return typeof value === "string" ? value : value._id || "";
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const GENDER_OPTIONS_WITH_PLACEHOLDER = [
  { value: "", label: "Select gender" },
  ...GENDER_OPTIONS,
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "", label: "Select" },
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "guardian", label: "Guardian" },
];

// Reusable section header
const SectionHeader = ({ title, subtitle }) => (
  <>
    <h3 className="text-[13px] sm:text-[14px] font-medium text-primary">{title}</h3>
    <h5 className="text-xs font-medium text-text-secondary mb-4 pb-2 border-b border-gray-200">
      {subtitle}
    </h5>
  </>
);

// Reusable field wrapper
const Field = ({ label, error, children, className = "" }) => (
  <div className={className}>
    {label && (
      <label className="block text-xs mb-1.5 font-medium">{label}</label>
    )}
    {children}
    {error && <p className="text-red-500 text-[11px] mt-1">{error}</p>}
  </div>
);

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
  const [emailVerified, setEmailVerified] = useState({ student: false, parent: false });
  const [fieldErrors, setFieldErrors] = useState({});
  const role = useAuthStore((state) => state.user?.role);
  const userOrganization = useAuthStore((state) => {
    const organization = state.user?.organization;
    if (!organization) return null;
    return typeof organization === "string" ? organization : organization._id || null;
  });
  const [hostels, setHostels] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loadingHostels, setLoadingHostels] = useState(false);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [organizationId, setOrganizationId] = useState(editingStudent?.organizationId || "");
  const [hostelId, setHostelId] = useState(
    toIdString(editingStudent?.hostelId) || "",
  );
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [courseId, setCourseId] = useState(toIdString(editingStudent?.course?._id) || "");
  const [departmentId, setDepartmentId] = useState(toIdString(editingStudent?.department?._id) || "");
  const [batchId, setBatchId] = useState(toIdString(editingStudent?.batch?._id) || "");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Fields that were previously plain uncontrolled <select> elements now need
  // their own state since Dropdown is a controlled custom component.
  const [gender, setGender] = useState(editingStudent?.gender || "");
  const [status, setStatus] = useState(editingStudent?.isActive ? "active" : "inactive");
  const [relationship, setRelationship] = useState("");

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
      showErrorToast("Failed to load hostels");
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
      showErrorToast("Failed to load organizations");
    } finally {
      setLoadingOrganizations(false);
    }
  };

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await courseService.getCourses({ status: "Active" });
      setCourses(res.data || []);
    } catch (error) {
      console.error("Failed to load courses", error);
      showErrorToast("Failed to load courses");
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    loadHostels();
    loadCourses();
    if (role === ROLES.SUPER_ADMIN) loadOrganizations();
  }, [role]);

  useEffect(() => {
    if (!courseId) { setDepartments([]); return; }
    let isCurrent = true;
    setLoadingDepartments(true);
    departmentService.getDepartments({ courseId, status: "Active" })
      .then((res) => { if (isCurrent) setDepartments(res.data || []); })
      .catch((error) => {
        console.error("Failed to load departments", error);
        if (isCurrent) showErrorToast("Failed to load departments");
      })
      .finally(() => { if (isCurrent) setLoadingDepartments(false); });
    return () => { isCurrent = false; };
  }, [courseId]);

  useEffect(() => {
    if (!departmentId) { setBatches([]); return; }
    let isCurrent = true;
    setLoadingBatches(true);
    batchService.getBatches({ departmentId, status: "Active" })
      .then((res) => { if (isCurrent) setBatches(res.data || []); })
      .catch((error) => {
        console.error("Failed to load batches", error);
        if (isCurrent) showErrorToast("Failed to load batches");
      })
      .finally(() => { if (isCurrent) setLoadingBatches(false); });
    return () => { isCurrent = false; };
  }, [departmentId]);

  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleCourseChange = (value) => {
    setCourseId(value);
    setDepartmentId("");
    setBatchId("");
    clearFieldError("courseId");
  };

  const handleDepartmentChange = (value) => {
    setDepartmentId(value);
    setBatchId("");
    clearFieldError("departmentId");
  };

  const handleBatchChange = (value) => {
    setBatchId(value);
    clearFieldError("batchId");
  };

  const handleGenderChange = (value) => {
    setGender(value);
    clearFieldError("gender");
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    clearFieldError("status");
  };

  const handleRelationshipChange = (value) => {
    setRelationship(value);
    clearFieldError("relationship");
  };

  const handleHostelChange = (value) => {
    setHostelId(value);
    clearFieldError("hostelId");
  };

  const handleOrganizationChange = (value) => {
    setOrganizationId(value);
    clearFieldError("organizationId");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawPayload = Object.fromEntries(
      [...formData.entries()].filter(([, value]) => value !== ""),
    );

    if (editingStudent) {
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
        showErrorToast("Please fix the highlighted errors before saving");
        return;
      }
      setFieldErrors({});
      try {
        setSaving(true);
        await onSave(result.data);
      } catch (error) {
        // onSave (handleSaveStudent in parent) already shows its own toast,
        // this catch just prevents an unhandled rejection here.
        console.error("Failed to update student", error);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!studentOtp || !parentOtp) {
      setOtpErrors({
        student: !studentOtp ? "Please enter the student OTP" : "",
        parent: !parentOtp ? "Please enter the parent OTP" : "",
      });
      showErrorToast("Please verify both student and parent emails before saving");
      return;
    }
    if (!emailVerified.student || !emailVerified.parent) {
      setOtpErrors({
        student: !emailVerified.student ? "Student email not verified" : "",
        parent: !emailVerified.parent ? "Parent email not verified" : "",
      });
      showErrorToast("Please complete email verification before saving");
      return;
    }

    const result = createStudentSchema.safeParse(rawPayload);
    if (!result.success) {
      setFieldErrors(toFieldErrors(result.error));
      showErrorToast("Please fix the highlighted errors before saving");
      return;
    }
    setFieldErrors({});
    try {
      setSaving(true);
      await onSave(result.data);
    } catch (error) {
      // onSave (handleSaveStudent in parent) already shows its own toast,
      // this catch just prevents an unhandled rejection here.
      console.error("Failed to create student", error);
    } finally {
      setSaving(false);
    }
  };

  const sendEmailOtp = async (email, type, openModal = false) => {
    if (!email) {
      setOtpErrors((prev) => ({ ...prev, [type]: "Please enter an email before sending OTP" }));
      showErrorToast("Please enter an email before sending OTP");
      return;
    }
    setSendingOtpFor(type);
    setOtpErrors((prev) => ({ ...prev, [type]: "" }));
    try {
      await otpService.sendOtp(email);
      if (type === "student") setStudentOtpSent(true);
      else setParentOtpSent(true);
      showSuccessToast(`OTP sent to ${email}`);
      if (openModal) {
        setVerifyTarget(type);
        setVerifyOtpValue(type === "student" ? studentOtp : parentOtp);
        setVerifyModalOpen(true);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to send OTP";
      setOtpErrors((prev) => ({ ...prev, [type]: message }));
      showErrorToast(message);
    } finally {
      setSendingOtpFor("");
    }
  };

  const handleVerifyOtpSubmit = async () => {
    if (!verifyOtpValue || verifyOtpValue.length !== 6) {
      setOtpErrors((prev) => ({ ...prev, [verifyTarget]: "Please enter the 6-digit OTP" }));
      showErrorToast("Please enter the 6-digit OTP");
      return;
    }
    try {
      setVerifyingOtp(true);
      const email = verifyTarget === "student" ? studentEmail : parentEmail;
      await otpService.verifyOtp(email, verifyOtpValue);
      if (verifyTarget === "student") {
        setStudentOtp(verifyOtpValue);
        setEmailVerified((prev) => ({ ...prev, student: true }));
      } else {
        setParentOtp(verifyOtpValue);
        setEmailVerified((prev) => ({ ...prev, parent: true }));
      }
      setOtpErrors((prev) => ({ ...prev, [verifyTarget]: "" }));
      showSuccessToast(`${verifyTarget === "student" ? "Student" : "Parent"} email verified successfully`);
      setVerifyModalOpen(false);
    } catch (error) {
      const message = error?.response?.data?.message || "Invalid OTP";
      setOtpErrors((prev) => ({ ...prev, [verifyTarget]: message }));
      showErrorToast(message);
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

  // Phone input with flag prefix
  const PhoneInput = ({ name, onChangeClear }) => (
    <div className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:border-secondary">
      <div className="px-2 py-2 border-r border-gray-200 flex items-center gap-1 text-xs text-black shrink-0">
        <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-4 h-3" />
        +91
      </div>
      <input
        name={name}
        type="text"
        required
        placeholder="00000 00000"
        onChange={onChangeClear}
        className="w-full px-3 py-2 outline-none bg-transparent text-xs"
      />
    </div>
  );

  const courseOptions = [
    { value: "", label: "Select course" },
    ...courses.map((c) => ({ value: c._id, label: c.name })),
  ];

  const departmentOptions = [
    { value: "", label: courseId ? "Select department" : "Select a course first" },
    ...departments.map((d) => ({ value: d._id, label: d.name })),
  ];

  const batchOptions = [
    { value: "", label: departmentId ? "Select batch" : "Select a department first" },
    ...batches.map((b) => ({ value: b._id, label: b.name })),
  ];

  const hostelOptions = [
    { value: "", label: "Select hostel" },
    ...hostels.map((hostel) => ({ value: hostel._id, label: hostel.name })),
  ];

  const organizationOptions = [
    { value: "", label: "Select organization" },
    ...organizations.map((org) => ({ value: org._id, label: org.name })),
  ];

  const dropdownTriggerClass =
    "w-full px-2.5 py-2.5 text-xs bg-white border-gray-200 focus:border-secondary";

  // Edit modal
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
          {/* Basic Information */}
          <section>
            <h3 className="text-sm font-medium text-primary mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Field label="Full Name *" error={fieldErrors.name}>
                <input
                  name="name"
                  defaultValue={editingStudent.name}
                  required
                  onChange={() => clearFieldError("name")}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                />
              </Field>

              <Field label="Email">
                <input
                  value={editingStudent.email}
                  disabled
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-gray-100 cursor-not-allowed"
                />
                <p className="text-[11px] text-gray-400 mt-1">Email can only be changed from Change Email.</p>
              </Field>

              <Field label="Phone *" error={fieldErrors.phone}>
                <input
                  name="phone"
                  defaultValue={editingStudent.phone}
                  required
                  onChange={() => clearFieldError("phone")}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                />
              </Field>

              <Field label="Gender *" error={fieldErrors.gender}>
                <Dropdown
                  options={GENDER_OPTIONS}
                  value={gender}
                  onChange={handleGenderChange}
                  className="w-full"
                  minWidth=""
                  triggerClassName={dropdownTriggerClass}
                />
                <input type="hidden" name="gender" value={gender} />
              </Field>

              <Field label="Date of Birth" error={fieldErrors.dob}>
                <input
                  type="date"
                  name="dob"
                  defaultValue={editingStudent.dob?.split("T")[0]}
                  onChange={() => clearFieldError("dob")}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                />
              </Field>

              <Field label="Status" error={fieldErrors.status}>
                <Dropdown
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={handleStatusChange}
                  className="w-full"
                  minWidth=""
                  triggerClassName={dropdownTriggerClass}
                />
                <input type="hidden" name="status" value={status} />
              </Field>
            </div>
          </section>

          {/* Academic Information */}
          <section>
            <h3 className="text-sm font-medium text-primary mb-4">Academic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Field label="Course" error={fieldErrors.courseId}>
                <Dropdown
                  options={courseOptions}
                  value={courseId}
                  onChange={handleCourseChange}
                  className="w-full"
                  minWidth=""
                  triggerClassName={dropdownTriggerClass}
                />
                <input type="hidden" name="courseId" value={courseId} />
                {loadingCourses && <p className="text-xs text-text-secondary mt-2">Loading courses...</p>}
              </Field>

              <Field label="Department" error={fieldErrors.departmentId}>
                <Dropdown
                  options={departmentOptions}
                  value={departmentId}
                  onChange={handleDepartmentChange}
                  disabled={!courseId}
                  className="w-full"
                  minWidth=""
                  triggerClassName={`${dropdownTriggerClass} ${!courseId ? "disabled:bg-gray-100 disabled:cursor-not-allowed opacity-60 pointer-events-none" : ""}`}
                />
                <input type="hidden" name="departmentId" value={departmentId} />
                {loadingDepartments && <p className="text-xs text-text-secondary mt-2">Loading departments...</p>}
              </Field>

              <Field label="Batch" error={fieldErrors.batchId}>
                <Dropdown
                  options={batchOptions}
                  value={batchId}
                  onChange={handleBatchChange}
                  disabled={!departmentId}
                  className="w-full"
                  minWidth=""
                  triggerClassName={`${dropdownTriggerClass} ${!departmentId ? "opacity-60 pointer-events-none" : ""}`}
                />
                <input type="hidden" name="batchId" value={batchId} />
                {loadingBatches && <p className="text-xs text-text-secondary mt-2">Loading batches...</p>}
              </Field>

              <Field label="Academic Year" error={fieldErrors.academicYear}>
                <input
                  name="academicYear"
                  defaultValue={editingStudent.academicYear}
                  onChange={() => clearFieldError("academicYear")}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                />
              </Field>

              <Field label="Hostel" error={fieldErrors.hostelId}>
                <Dropdown
                  options={hostelOptions}
                  value={hostelId}
                  onChange={handleHostelChange}
                  className="w-full"
                  minWidth=""
                  triggerClassName={dropdownTriggerClass}
                />
                <input type="hidden" name="hostelId" value={hostelId} />
              </Field>
            </div>
          </section>

          {/* Address */}
          <section>
            <h3 className="text-sm font-medium text-primary mb-4">Address Information</h3>
            <Field error={fieldErrors.address}>
              <textarea
                name="address"
                defaultValue={editingStudent.address}
                onChange={() => clearFieldError("address")}
                className="w-full p-3 border border-gray-200 rounded-lg text-xs"
                rows={5}
              />
            </Field>
          </section>
        </div>
      </Modal>
    );
  }

  // Add New Student modal
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
              <OtpInput value={verifyOtpValue} onChange={setVerifyOtpValue} error={!!otpErrors[verifyTarget]} />
              {otpErrors[verifyTarget] && (
                <p className="text-red-500 text-xs">{otpErrors[verifyTarget]}</p>
              )}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => sendEmailOtp(verifyTarget === "student" ? studentEmail : parentEmail, verifyTarget, true)}
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
          <SectionHeader title="Basic Info" subtitle="Basic contact information of the student" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Field label="Admission No *" error={fieldErrors.studentId}>
              <input
                name="studentId"
                required
                onChange={() => clearFieldError("studentId")}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                placeholder="Enter the student id"
              />
            </Field>

            <Field label="Full Name *" error={fieldErrors.name}>
              <input
                name="name"
                required
                onChange={() => clearFieldError("name")}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                placeholder="Enter your full name"
              />
            </Field>

            <Field label="Gender *" error={fieldErrors.gender}>
              <Dropdown
                options={GENDER_OPTIONS_WITH_PLACEHOLDER}
                value={gender}
                onChange={handleGenderChange}
                className="w-full"
                minWidth=""
                triggerClassName={`${dropdownTriggerClass} ${!gender ? "text-gray-400" : ""}`}
              />
              <input type="hidden" name="gender" value={gender} required />
            </Field>

            <Field label="Date Of Birth *" error={fieldErrors.dob}>
              <input
                name="dob"
                type="date"
                onChange={() => clearFieldError("dob")}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-400 outline-none focus:border-secondary"
              />
            </Field>
          </div>
        </section>

        {/* Academic Information */}
        <section>
          <SectionHeader title="Academic Information" subtitle="Academic information of the student" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {role === ROLES.SUPER_ADMIN ? (
              <Field label="Organization *" error={fieldErrors.organizationId}>
                <Dropdown
                  options={organizationOptions}
                  value={organizationId}
                  onChange={handleOrganizationChange}
                  className="w-full"
                  minWidth=""
                  triggerClassName={`${dropdownTriggerClass} ${!organizationId ? "text-gray-400" : ""}`}
                />
                <input type="hidden" name="organizationId" value={organizationId} required />
                {loadingOrganizations && <p className="text-xs text-text-secondary mt-2">Loading organizations...</p>}
              </Field>
            ) : (
              <input type="hidden" name="organizationId" value={organizationId} />
            )}

            <Field label="Course *" error={fieldErrors.courseId}>
              <Dropdown
                options={courseOptions}
                value={courseId}
                onChange={handleCourseChange}
                className="w-full"
                minWidth=""
                triggerClassName={`${dropdownTriggerClass} ${!courseId ? "text-gray-400" : ""}`}
              />
              <input type="hidden" name="courseId" value={courseId} required />
              {loadingCourses && <p className="text-xs text-text-secondary mt-2">Loading courses...</p>}
            </Field>

            <Field label="Department *" error={fieldErrors.departmentId}>
              <Dropdown
                options={departmentOptions}
                value={departmentId}
                onChange={handleDepartmentChange}
                disabled={!courseId}
                className="w-full"
                minWidth=""
                triggerClassName={`${dropdownTriggerClass} ${!departmentId ? "text-gray-400" : ""} ${!courseId ? "opacity-60 pointer-events-none" : ""}`}
              />
              <input type="hidden" name="departmentId" value={departmentId} required />
              {loadingDepartments && <p className="text-xs text-text-secondary mt-2">Loading departments...</p>}
            </Field>

            <Field label="Batch" error={fieldErrors.batchId}>
              <Dropdown
                options={batchOptions}
                value={batchId}
                onChange={handleBatchChange}
                disabled={!departmentId}
                className="w-full"
                minWidth=""
                triggerClassName={`${dropdownTriggerClass} ${!batchId ? "text-gray-400" : ""} ${!departmentId ? "opacity-60 pointer-events-none" : ""}`}
              />
              <input type="hidden" name="batchId" value={batchId} />
              {loadingBatches && <p className="text-xs text-text-secondary mt-2">Loading batches...</p>}
            </Field>

            <Field label="Academic Year *" error={fieldErrors.academicYear}>
              <input
                name="academicYear"
                onChange={() => clearFieldError("academicYear")}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                placeholder="2024-2025"
              />
            </Field>

            <Field label="Assign Hostel" error={fieldErrors.hostelId} className="sm:col-span-2">
              <Dropdown
                options={hostelOptions}
                value={hostelId}
                onChange={handleHostelChange}
                className="w-full"
                minWidth=""
                triggerClassName={`${dropdownTriggerClass} ${!hostelId ? "text-gray-400" : ""}`}
              />
              <input type="hidden" name="hostelId" value={hostelId} />
              {loadingHostels && <p className="text-xs text-text-secondary mt-2">Loading hostels...</p>}
            </Field>
          </div>
        </section>

        {/* Contact Information */}
        <section>
          <SectionHeader title="Contact Information" subtitle="Contact information of the student" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Field label="Phone Number *" error={fieldErrors.phone}>
              <PhoneInput name="phone" onChangeClear={() => clearFieldError("phone")} />
            </Field>

            <Field label="Email Address *" error={fieldErrors.email}>
              <div className="flex gap-2">
                <input
                  name="email"
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => {
                    setStudentEmail(e.target.value);
                    setStudentOtp("");
                    setEmailVerified((prev) => ({ ...prev, student: false }));
                    clearFieldError("email");
                  }}
                  placeholder="Enter the email"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                />
                <button
                  type="button"
                  onClick={() => openVerifyModal("student")}
                  disabled={sendingOtpFor === "student" || !studentEmail}
                  className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-secondary transition-colors disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
                >
                  {sendingOtpFor === "student" ? "Sending..." : "Verify"}
                </button>
              </div>
              {emailVerified.student && (
                <p className="text-xs text-green-600 mt-1">Student email verified</p>
              )}
            </Field>
          </div>
          <input type="hidden" name="studentOtp" value={studentOtp} />
        </section>

        {/* Address Information */}
        <section>
          <SectionHeader title="Address Information" subtitle="Address information of the student" />
          <Field label="Full Address *" error={fieldErrors.address}>
            <textarea
              name="address"
              onChange={() => clearFieldError("address")}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
              style={{ minHeight: 106 }}
              placeholder="Enter your address"
            />
          </Field>
        </section>

        {/* Parent Information */}
        <section>
          <h3 className="text-sm font-medium text-primary mb-4 pb-2 border-b border-gray-200">
            Parent Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Field label="Full Name *" error={fieldErrors.parentName}>
              <input
                name="parentName"
                required
                onChange={() => clearFieldError("parentName")}
                placeholder="Enter the name"
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
              />
            </Field>

            <Field label="Relation *" error={fieldErrors.relationship}>
              <Dropdown
                options={RELATIONSHIP_OPTIONS}
                value={relationship}
                onChange={handleRelationshipChange}
                className="w-full"
                minWidth=""
                triggerClassName={`${dropdownTriggerClass} ${!relationship ? "text-gray-400" : ""}`}
              />
              <input type="hidden" name="relationship" value={relationship} required />
            </Field>

            <Field label="Phone Number *" error={fieldErrors.parentPhone}>
              <PhoneInput name="parentPhone" onChangeClear={() => clearFieldError("parentPhone")} />
            </Field>

            <Field label="Email Address *" error={fieldErrors.parentEmail}>
              <div className="flex gap-2">
                <input
                  name="parentEmail"
                  type="email"
                  required
                  value={parentEmail}
                  onChange={(e) => {
                    setParentEmail(e.target.value);
                    setParentOtp("");
                    setEmailVerified((prev) => ({ ...prev, parent: false }));
                    clearFieldError("parentEmail");
                  }}
                  placeholder="Enter the email"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                />
                <button
                  type="button"
                  onClick={() => openVerifyModal("parent")}
                  disabled={sendingOtpFor === "parent" || !parentEmail}
                  className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-secondary transition-colors disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
                >
                  {sendingOtpFor === "parent" ? "Sending..." : "Verify"}
                </button>
              </div>
              {emailVerified.parent && (
                <p className="text-xs text-green-600 mt-1">Parent email verified</p>
              )}
            </Field>
          </div>
          <input type="hidden" name="parentOtp" value={parentOtp} />
        </section>
      </div>
    </Modal>
  );
}