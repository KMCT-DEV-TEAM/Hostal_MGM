import React, { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
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
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import EmailVerificationModal from "@/components/ui/EmailVerificationModal";

// Human-readable labels used to build friendly required/invalid messages
// for fields where Zod's default message isn't useful (enums, picked
// fields that fall back to "received undefined", etc).
const FIELD_LABELS = {
  studentId: "Admission number",
  name: "Name",
  email: "Email",
  parentEmail: "Parent email",
  phone: "Phone number",
  parentPhone: "Parent phone number",
  gender: "Gender",
  dob: "Date of birth",
  courseId: "Course",
  departmentId: "Department",
  batchId: "Batch",
  academicYear: "Academic year",
  organizationId: "Organization",
  hostelId: "Hostel",
  address: "Address",
  parentName: "Parent name",
  relationship: "Relationship",
  studentOtp: "Student OTP",
  parentOtp: "Parent OTP",
  status: "Status",
};

// Translates a single Zod issue into a friendly, human message. Falls back
// to the schema's own custom message (e.g. "Enter a valid 10-digit phone
// number") when one was actually authored — only the generic Zod-internal
// phrasing ("Invalid option: expected one of...", "Invalid input: expected
// string, received undefined") gets rewritten.
function toFriendlyMessage(issue, fieldName) {
  const label = FIELD_LABELS[fieldName] || "This field";
  const raw = issue.message || "";
  const isGenericTypeError =
    raw.startsWith("Invalid input") || raw.startsWith("Required");
  const isGenericEnumError = raw.startsWith("Invalid option");

  if (issue.code === "invalid_type" || isGenericTypeError) {
    return `${label} is required`;
  }
  if (issue.code === "invalid_enum_value" || isGenericEnumError) {
    return `Please select a ${label.toLowerCase()}`;
  }
  // Custom messages authored on the schema (.min, .regex, .email, etc.)
  // are already human-friendly — keep them as-is.
  return raw || `${label} is invalid`;
}

function toFieldErrors(zodError) {
  const fieldErrors = {};
  for (const issue of zodError.issues) {
    const key = issue.path[0];
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = toFriendlyMessage(issue, key);
    }
  }
  return fieldErrors;
}

function toIdString(value) {
  if (!value) return "";
  return typeof value === "string" ? value : value._id || "";
}

// updateStudentSchema is a ZodEffects (because of .refine()), so the plain
// object schema (which supports .pick()) lives on `.innerType()` in zod v3.
// createStudentSchema is already a plain ZodObject.
const updateStudentObjectSchema =
  typeof updateStudentSchema.innerType === "function"
    ? updateStudentSchema.innerType()
    : updateStudentSchema._def.schema;

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

// Reusable field wrapper. If the label ends with "*" (our convention for
// marking required fields), the asterisk renders in red while the rest of
// the label keeps its normal color.
const Field = ({ label, error, children, className = "" }) => {
  const isRequired = typeof label === "string" && label.trim().endsWith("*");
  const labelText = isRequired ? label.trim().slice(0, -1).trimEnd() : label;

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs mb-1.5 font-medium">
          {labelText}
          {isRequired && <span className="text-red-500"> *</span>}
        </label>
      )}
      {children}
      {error && <p className="text-red-500 text-[11px] mt-1">{error}</p>}
    </div>
  );
};

// Phone input with flag prefix — controlled, digits-only, hard-capped at 10
const PhoneInput = ({ name, value, onChange, onBlur }) => (
  <div className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:border-secondary">
    <div className="px-2 py-2 border-r border-gray-200 flex items-center gap-1 text-xs text-black shrink-0">
      <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-4 h-3" />
      +91
    </div>
    <input
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      required
      placeholder="00000 00000"
      value={value}
      maxLength={10}
      onChange={(e) => {
        const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
        onChange(digitsOnly);
      }}
      onBlur={onBlur}
      className="w-full px-3 py-2 outline-none bg-transparent text-xs"
    />
  </div>
);

export default function StudentFormModal({ editingStudent, onClose, onSave }) {
  const [studentEmail, setStudentEmail] = useState(editingStudent?.email || "");
  const [parentEmail, setParentEmail] = useState("");
  const [studentOtp, setStudentOtp] = useState("");
  const [parentOtp, setParentOtp] = useState("");
  const [_studentOtpSent, setStudentOtpSent] = useState(false);
  const [_parentOtpSent, setParentOtpSent] = useState(false);
  const [otpErrors, setOtpErrors] = useState({ student: "", parent: "" });
  const [sendingOtpFor, setSendingOtpFor] = useState("");
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [verifyOtpValue, setVerifyOtpValue] = useState("");
  const [emailVerified, setEmailVerified] = useState({ student: false, parent: false });
  const [fieldErrors, setFieldErrors] = useState({});
  // Tracks which fields the user has actually interacted with, so we don't
  // flash "Course is required" the instant the modal opens — only after
  // the user has touched (changed/blurred) that specific field.
  const [touchedFields, setTouchedFields] = useState({});
  const role = useAuthStore((state) => state.user?.role);
  const userOrganization = useAuthStore((state) => {
    const organization = state.user?.organization;
    if (!organization) return null;
    return typeof organization === "string" ? organization : organization._id || null;
  });
  const [organizations, setOrganizations] = useState([]);
  const [loadingHostels, setLoadingHostels] = useState(false);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [organizationId, setOrganizationId] = useState(toIdString(editingStudent?.organization?._id || editingStudent?.organizationId) || "");
  const [hostelId, setHostelId] = useState(
    toIdString(editingStudent?.hostel?._id || editingStudent?.hostelId) || "",
  );
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [courseId, setCourseId] = useState(toIdString(editingStudent?.course?._id || editingStudent?.courseId) || "");
  const [departmentId, setDepartmentId] = useState(toIdString(editingStudent?.department?._id || editingStudent?.departmentId) || "");
  const [batchId, setBatchId] = useState(toIdString(editingStudent?.batch?._id || editingStudent?.batchId) || "");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Fields that were previously plain uncontrolled <input>/<select> elements
  // now need their own state since we validate live and Dropdown is controlled.
  const [gender, setGender] = useState(editingStudent?.gender || "");
  const [status, setStatus] = useState(editingStudent?.isActive ? "active" : "inactive");
  const [relationship, setRelationship] = useState("");

  const [name, setName] = useState(editingStudent?.name || "");
  const [studentId, setStudentId] = useState(editingStudent?.studentId || "");
  const [dob, setDob] = useState(editingStudent?.dob?.split("T")[0] || "");
  const [address, setAddress] = useState(editingStudent?.address || "");
  const [phone, setPhone] = useState(editingStudent?.phone || "");
  const [parentPhone, setParentPhone] = useState("");
  const [parentName, setParentName] = useState("");

  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  useEffect(() => {
    if (role !== ROLES.SUPER_ADMIN && userOrganization) {
      setOrganizationId(userOrganization);
    }
  }, [role, userOrganization]);



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

  const loadCourses = async (orgId) => {
    if (!orgId) {
      setCourses([]);
      return;
    }
    setLoadingCourses(true);
    try {
      const res = await courseService.getCourses({ organizationId: orgId, limit: 0, status: "Active" });
      setCourses(res.data || []);
    } catch (error) {
      console.error("Failed to load courses", error);
      showErrorToast("Failed to load courses");
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    if (role === ROLES.SUPER_ADMIN) {
      loadOrganizations();
    }
  }, [role]);

  useEffect(() => {
    loadCourses(organizationId);
  }, [organizationId]);

  useEffect(() => {
    if (!courseId) { setDepartments([]); return; }
    let isCurrent = true;
    setLoadingDepartments(true);
    departmentService.getDepartments({ courseId, limit: 0, status: "Active" })
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

    batchService.getBatches({ departmentId, status: "Active", limit: 0 })
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

  const validateField = (fieldName, value, { silent = false } = {}) => {
    if (!silent) {
      setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
    }
    const baseSchema = editingStudent ? updateStudentObjectSchema : createStudentSchema;
    const fieldSchema = baseSchema.pick({ [fieldName]: true });
    const result = fieldSchema.safeParse({ [fieldName]: value });
    if (!result.success) {
      if (silent && !touchedFields[fieldName]) return; // don't show errors for untouched fields
      const message = toFriendlyMessage(result.error.issues[0], fieldName);
      setFieldErrors((prev) => ({ ...prev, [fieldName]: message }));
    } else {
      clearFieldError(fieldName);
    }
  };

  const handleCourseChange = (value) => {
    setCourseId(value);
    setDepartmentId("");
    setBatchId("");
    validateField("courseId", value);
    // Resetting department/batch to "" is a side effect of changing course,
    // not the user touching those fields directly — validate silently so
    // we don't surface "Department is required" right after this reset.
    validateField("departmentId", "", { silent: true });
    validateField("batchId", "", { silent: true });
  };

  const handleDepartmentChange = (value) => {
    setDepartmentId(value);
    setBatchId("");
    validateField("departmentId", value);
    validateField("batchId", "", { silent: true });
  };

  const handleBatchChange = (value) => {
    setBatchId(value);
    validateField("batchId", value);
  };

  const handleGenderChange = (value) => {
    setGender(value);
    validateField("gender", value);
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
    validateField("hostelId", value);
  };

  const handleOrganizationChange = (value) => {
    setOrganizationId(value);

    setCourseId("");
    setDepartmentId("");
    setBatchId("");
    validateField("organizationId", value);
    validateField("courseId", "", { silent: true });
    validateField("departmentId", "", { silent: true });
    validateField("batchId", "", { silent: true });
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

      // Build the final payload. If the organization changed, explicitly
      // null-out any dependent fields that were reset to "" so the backend
      // clears stale cross-org references instead of silently keeping them.
      const payload = { ...result.data };
      const originalOrgId = toIdString(
        editingStudent?.organization?._id || editingStudent?.organizationId
      );
      if (payload.organizationId && payload.organizationId !== originalOrgId) {
        if (!courseId) payload.courseId = null;
        if (!departmentId) payload.departmentId = null;
        if (!batchId) payload.batchId = null;
        if (!hostelId) payload.hostelId = null;
      }

      try {
        setSaving(true);
        await onSave(payload);
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
      const message = error?.message || "Failed to send OTP";
      setOtpErrors((prev) => ({ ...prev, [type]: message }));
      showErrorToast(message);
    } finally {
      setSendingOtpFor("");
    }
  };

  const handleVerifyOtpSubmit = async (otpValue) => {
    if (!otpValue || otpValue.length !== 6) {
      setOtpErrors((prev) => ({ ...prev, [verifyTarget]: "Please enter the 6-digit OTP" }));
      showErrorToast("Please enter the 6-digit OTP");
      return;
    }
    try {
      setVerifyingOtp(true);
      const email = verifyTarget === "student" ? studentEmail : parentEmail;
      await otpService.verifyOtp(email, otpValue);
      if (verifyTarget === "student") {
        setStudentOtp(otpValue);
        setEmailVerified((prev) => ({ ...prev, student: true }));
      } else {
        setParentOtp(otpValue);
        setEmailVerified((prev) => ({ ...prev, parent: true }));
      }
      setOtpErrors((prev) => ({ ...prev, [verifyTarget]: "" }));
      showSuccessToast(`${verifyTarget === "student" ? "Student" : "Parent"} email verified successfully`);
      setVerifyModalOpen(false);
    } catch (error) {
      const message = error?.message || "Invalid OTP";
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
  const confirmDiscard = () => {
    setIsDiscardConfirmOpen(false);
    onClose();
  };

  const courseOptions = [
    { value: "", label: organizationId ? "Select course" : "Select an organization first" },
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



  const organizationOptions = [
    { value: "", label: "Select organization" },
    ...organizations.map((org) => ({ value: org._id, label: org.name })),
  ];

  const dropdownTriggerClass =
    "w-full px-2.5 py-2.5 text-xs bg-white border-gray-200 focus:border-secondary";

  // Renders the email field + verify button. Once verified, the input
  // locks and the button itself becomes a green "Verified" pill with a
  // check icon — no separate helper text underneath.
  const renderEmailField = ({ type, value, onValueChange, label, name }) => {
    const verified = emailVerified[type];
    return (
      <Field label={label} error={fieldErrors[name]}>
        <div className="flex gap-2">
          <input
            name={name}
            type="email"
            required
            value={value}
            onChange={(e) => {
              onValueChange(e.target.value);
              if (type === "student") {
                setStudentOtp("");
                setEmailVerified((prev) => ({ ...prev, student: false }));
              } else {
                setParentOtp("");
                setEmailVerified((prev) => ({ ...prev, parent: false }));
              }
              clearFieldError(name);
            }}
            onBlur={(e) => validateField(name, e.target.value)}
            placeholder="Enter the email"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
          />
          <button
            type="button"
            onClick={() => openVerifyModal(type)}
            disabled={sendingOtpFor === type || !value || verified}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 disabled:cursor-not-allowed ${verified
              ? "bg-green-50 text-success border border-green-200 disabled:opacity-100"
              : "bg-primary text-white hover:bg-secondary disabled:opacity-50"
              }`}
          >
            {verified ? (
              <>
                <Check className="w-3.5 h-3.5" /> Verified
              </>
            ) : sendingOtpFor === type ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
              </>
            ) : (
              "Verify"
            )}
          </button>
        </div>
      </Field>
    );
  };

  // Edit modal
  if (editingStudent) {
    return (
      <Modal bottomSheetOnMobile={true}
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
              onClick={() => { console.log("clicked "), setIsDiscardConfirmOpen(true) }}
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
                  value={name}
                  required
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError("name");
                  }}
                  onBlur={(e) => validateField("name", e.target.value)}
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
                <PhoneInput
                  name="phone"
                  value={phone}
                  onChange={(val) => {
                    setPhone(val);
                    clearFieldError("phone");
                  }}
                  onBlur={(e) => validateField("phone", e.target.value)}
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

              <Field label="Date of Birth *" error={fieldErrors.dob}>
                <input
                  type="date"
                  name="dob"
                  value={dob}
                  max={new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]}
                  onChange={(e) => {
                    setDob(e.target.value);
                    clearFieldError("dob");
                  }}
                  onBlur={(e) => validateField("dob", e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs"
                />
                {dob && (
                  <p className="text-[10.5px] text-gray-500 mt-1 font-medium">
                    Age: {(() => {
                      const d = new Date(dob);
                      const t = new Date();
                      let a = t.getFullYear() - d.getFullYear();
                      const m = t.getMonth() - d.getMonth();
                      if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
                      return a >= 0 ? a : 0;
                    })()} years
                  </p>
                )}
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
              {role === ROLES.SUPER_ADMIN && (
                <Field label="Organization *" error={fieldErrors.organizationId}>
                  <Dropdown
                    options={organizationOptions}
                    value={organizationId}
                    onChange={handleOrganizationChange}
                    className="w-full"
                    minWidth=""
                    triggerClassName={dropdownTriggerClass}
                  />
                  <input type="hidden" name="organizationId" value={organizationId} />
                  {loadingOrganizations && <p className="text-xs text-text-secondary mt-2">Loading organizations...</p>}
                </Field>
              )}

              <Field label="Course" error={fieldErrors.courseId}>
                <Dropdown
                  options={courseOptions}
                  value={courseId}
                  onChange={handleCourseChange}
                  disabled={!organizationId && role === ROLES.SUPER_ADMIN}
                  className="w-full"
                  minWidth=""
                  triggerClassName={`${dropdownTriggerClass} ${(!organizationId && role === ROLES.SUPER_ADMIN) ? "opacity-60 pointer-events-none disabled:bg-gray-100 disabled:cursor-not-allowed" : ""}`}
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




            </div>
          </section>

          {/* Address */}
          <section>
            <h3 className="text-sm font-medium text-primary mb-4">Address Information</h3>
            <Field label="Full Address *" error={fieldErrors.address}>
              <textarea
                name="address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  clearFieldError("address");
                }}
                onBlur={(e) => validateField("address", e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg text-xs"
                rows={5}
              />
            </Field>
          </section>
        </div>

        <ConfirmationModal
          isOpen={isDiscardConfirmOpen}
          onClose={() => setIsDiscardConfirmOpen(false)}
          onConfirm={confirmDiscard}
          title="Discard Changes"
          message="Are you sure you want to discard your changes? Any unsaved edits will be lost."
          confirmText="Discard"
          cancelText="Continue Editing"
          confirmButtonClass="bg-red-600 text-white hover:bg-red-700"
        />
      </Modal>
    );
  }

  // Add New Student modal
  return (
    <Modal bottomSheetOnMobile={true}
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
            onClick={() => setIsDiscardConfirmOpen(true)}

            className="px-6 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </>
      }
    >
      <div className="space-y-8">
        <EmailVerificationModal
          isOpen={verifyModalOpen}
          onClose={() => setVerifyModalOpen(false)}
          onVerify={handleVerifyOtpSubmit}
          email={verifyTarget === "student" ? studentEmail : parentEmail}
          isSubmitting={verifyingOtp}
          onResend={() => sendEmailOtp(verifyTarget === "student" ? studentEmail : parentEmail, verifyTarget, true)}
          error={otpErrors[verifyTarget]}
        />

        {/* Basic Info */}
        <section>
          <SectionHeader title="Basic Info" subtitle="Basic contact information of the student" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Field label="Admission No *" error={fieldErrors.studentId}>
              <input
                name="studentId"
                value={studentId}
                required
                onChange={(e) => {
                  setStudentId(e.target.value);
                  clearFieldError("studentId");
                }}
                onBlur={(e) => validateField("studentId", e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"
                placeholder="Enter the student id"
              />
            </Field>

            <Field label="Full Name *" error={fieldErrors.name}>
              <input
                name="name"
                value={name}
                required
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError("name");
                }}
                onBlur={(e) => validateField("name", e.target.value)}
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
                value={dob}
                max={new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]}
                onChange={(e) => {
                  setDob(e.target.value);
                  clearFieldError("dob");
                }}
                onBlur={(e) => validateField("dob", e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs  outline-none focus:border-secondary"
              />
              {dob && (
                <p className="text-[10.5px] text-gray-500 mt-1 font-medium">
                  Age: {(() => {
                    const d = new Date(dob);
                    const t = new Date();
                    let a = t.getFullYear() - d.getFullYear();
                    const m = t.getMonth() - d.getMonth();
                    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
                    return a >= 0 ? a : 0;
                  })()} years
                </p>
              )}
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




          </div>
        </section>

        {/* Contact Information */}
        <section>
          <SectionHeader title="Contact Information" subtitle="Contact information of the student" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Field label="Phone Number *" error={fieldErrors.phone}>
              <PhoneInput
                name="phone"
                value={phone}
                onChange={(val) => {
                  setPhone(val);
                  clearFieldError("phone");
                }}
                onBlur={(e) => validateField("phone", e.target.value)}
              />
            </Field>

            {renderEmailField({
              type: "student",
              value: studentEmail,
              onValueChange: setStudentEmail,
              label: "Email Address *",
              name: "email",
            })}
          </div>
          <input type="hidden" name="studentOtp" value={studentOtp} />
        </section>

        {/* Address Information */}
        <section>
          <SectionHeader title="Address Information" subtitle="Address information of the student" />
          <Field label="Full Address *" error={fieldErrors.address}>
            <textarea
              name="address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                clearFieldError("address");
              }}
              onBlur={(e) => validateField("address", e.target.value)}
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
                value={parentName}
                required
                onChange={(e) => {
                  setParentName(e.target.value);
                  clearFieldError("parentName");
                }}
                onBlur={(e) => validateField("parentName", e.target.value)}
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
              <PhoneInput
                name="parentPhone"
                value={parentPhone}
                onChange={(val) => {
                  setParentPhone(val);
                  clearFieldError("parentPhone");
                }}
                onBlur={(e) => validateField("parentPhone", e.target.value)}
              />
            </Field>

            {renderEmailField({
              type: "parent",
              value: parentEmail,
              onValueChange: setParentEmail,
              label: "Email Address *",
              name: "parentEmail",
            })}
          </div>
          <input type="hidden" name="parentOtp" value={parentOtp} />
        </section>
      </div>
      <ConfirmationModal
        isOpen={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        onConfirm={confirmDiscard}
        title="Discard Changes"
        message="Are you sure you want to discard your changes? Any unsaved edits will be lost."
        confirmText="Discard"
        cancelText="Continue Editing"
        confirmButtonClass="bg-red-600 text-white hover:bg-red-700"
      />
    </Modal>
  );
}


