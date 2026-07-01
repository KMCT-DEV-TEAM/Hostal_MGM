import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import {
  User,
  Users,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building2,
  BookOpen,
  Home,
  CheckCircle2,
  XCircle,
  Badge,
  FileText,
  Pencil,
  Plus,
} from "lucide-react";
import Button from "@/components/ui/Button";
import SetDefaultParentModal from "../parents/SetDefaultParentModal";
import ParentFormModal from "../parents/ParentFormModal";
import ChangeEmailModal from "./ChangeEmailModal";
import { useCreateParent } from "../../hooks/parent/useCreateParent";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants/roles";
import {  changeStudentEmail } from "@/services/student.service";
import {  changeParentEmail } from "@/services/parent.service";
import { formatDate } from "@/utils/dateFormatter";

const getParentId = (parent) =>
  String(parent?._id ?? parent?.id ?? parent?.parentId ?? "");

const normalizeParent = (parent, fallback = {}) => ({
  ...fallback,
  ...parent,
  _id: parent?._id ?? parent?.id ?? parent?.parentId ?? fallback?._id,
  parentName: parent?.parentName ?? fallback?.parentName,
  relationship: parent?.relationship ?? fallback?.relationship,
  phone: parent?.phone ?? parent?.parentPhone ?? fallback?.phone,
  email: parent?.email ?? parent?.parentEmail ?? fallback?.email,
  defaultGuardian:
    parent?.defaultGuardian ?? fallback?.defaultGuardian ?? false,
});

// Reusable row: stacks on mobile, grid on sm+
const InfoRow = ({ icon, label, children }) => (
  <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 sm:items-center">
    <span className="text-gray-500 flex items-center gap-1.5">
      {icon}
      {label}
    </span>
    <span className="sm:col-span-2 font-medium text-gray-900">
      <span className="hidden sm:inline">: </span>
      {children}
    </span>
  </div>
);

const StudentDetailView = ({ student, onClose, onStudentChange }) => {
  const role = useAuthStore((state) => state.user?.role);
  const [isDefaultParentModalOpen, setIsDefaultParentModalOpen] =
    useState(false);
  const [isAddParentModalOpen, setIsAddParentModalOpen] = useState(false);
  const [emailChangeTarget, setEmailChangeTarget] = useState(null);

  const { handleCreateParent } = useCreateParent((result, payload) => {
    const createdParent = normalizeParent(result?.data, payload);
    const studentId = createdParent.studentId ?? student._id;
    onStudentChange?.(studentId, (current) => ({
      ...current,
      parents: [...(current.parents || []), createdParent],
    }));
    setIsAddParentModalOpen(false);
  });

  if (!student) return null;

  const organizationName =
    student.organization?.name || student.organizationId || "N/A";
  const hostelName = student.hostel?.name || "N/A";
  const parents = Array.isArray(student.parents) ? student.parents : [];
  const parent = parents.find((p) => p.defaultGuardian) ?? parents[0] ?? null;
  const isActive = Boolean(student.isActive);
  const canChangeEmail = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role);

  const closeEmailChangeModal = () => setEmailChangeTarget(null);

  const handleEmailChange = async ({ oldEmail, newEmail, otp }) => {
    if (emailChangeTarget?.type === "student") {
      if (oldEmail !== student.email) {
        throw new Error("Current email does not match");
      }

      await changeStudentEmail(role, student._id, { oldEmail, newEmail, otp });

      onStudentChange?.(student._id, (current) => ({
        ...current,
        email: newEmail,
      }));

      return;
    }
    if (emailChangeTarget?.type === "parent") {
      const parentId = getParentId(emailChangeTarget.parent);
      const currentParentEmail =
        emailChangeTarget.parent?.email ||
        emailChangeTarget.parent?.parentEmail ||
        "";
      if (oldEmail !== currentParentEmail) {
        throw new Error("Current email does not match");
      }

      await changeParentEmail(role, parentId, {
        oldEmail,
        newEmail,
        otp
      });

      onStudentChange?.(student._id, (current) => ({
        ...current,
        parents: (current.parents || []).map((parent) =>
          getParentId(parent) === parentId
            ? {
              ...parent,
              email: newEmail,
              parentEmail: newEmail,
            }
            : parent,
        ),
      }));
    }
  };

  return (
    <Modal bottomSheetOnMobile={true}
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-5xl"
      avatar={student.name}
      title={student.name}
      subtitle={`Student - ${hostelName}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 [&>*:first-child]:order-2 [&>*:last-child]:order-1 lg:[&>*:first-child]:order-none lg:[&>*:last-child]:order-none">
        {" "}
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-primary mb-1">
              Basic Info
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Basic contact information of the Student
            </p>
            <div className="space-y-4">
              <InfoRow
                icon={<Badge className="w-4 h-4 text-gray-400" />}
                label="Admission No"
              >
                {student.studentId || "N/A"}
              </InfoRow>
              <InfoRow
                icon={<User className="w-4 h-4 text-gray-400" />}
                label="Full Name"
              >
                {student.name || "N/A"}
              </InfoRow>
              <InfoRow
                icon={<User className="w-4 h-4 text-gray-400" />}
                label="Gender"
              >
                {student.gender || "N/A"}
              </InfoRow>
              <InfoRow
                icon={<Calendar className="w-4 h-4 text-gray-400" />}
                label="Date Of Birth"
              >
                {student.dob
                  ? formatDate(student.dob)
                  : "N/A"}
              </InfoRow>
              {/* Status row needs custom layout for the dot */}
              <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 sm:items-center">
                <span className="text-gray-500 flex items-center gap-1.5">
                  {isActive ? (
                    <CheckCircle2 className="w-4 h-4 " />
                  ) : (
                    <XCircle className="w-4 h-4 " />
                  )}
                  Status
                </span>
                <span className="sm:col-span-2 font-medium text-gray-900 flex items-center gap-2">
                  <span className="hidden sm:inline">: </span>
                  <span
                    className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`}
                  />
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-primary mb-1">
              Academic Information
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Academic details and institutional information
            </p>
            <div className="space-y-4">
              <InfoRow
                icon={<Building2 className="w-4 h-4 text-gray-400" />}
                label="Organization"
              >
                {organizationName}
              </InfoRow>
              <InfoRow
                icon={<BookOpen className="w-4 h-4 text-gray-400" />}
                label="Course"
              >
                {student.course?.name || "N/A"}
              </InfoRow>
              <InfoRow
                icon={<FileText className="w-4 h-4 text-gray-400" />}
                label="Department"
              >
                {student.department?.name || "N/A"}
              </InfoRow>
              <InfoRow
                icon={<Users className="w-4 h-4 text-gray-400" />}
                label="Batch"
              >
                {student.batch?.name || "N/A"}
              </InfoRow>
              <InfoRow
                icon={<Calendar className="w-4 h-4 text-gray-400" />}
                label="Academic Year"
              >
                {student.academicYear || "N/A"}
              </InfoRow>
              <InfoRow
                icon={<Home className="w-4 h-4 text-gray-400" />}
                label="Assigned Hostel"
              >
                {hostelName}
              </InfoRow>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-primary mb-1">
              Contact Information
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Contact Information of The Student
            </p>
            <div className="space-y-4">
              <InfoRow
                icon={<Phone className="w-4 h-4 text-gray-400" />}
                label="Phone No"
              >
                {student.phone || "N/A"}
              </InfoRow>
              {/* Email row needs pencil button — custom layout */}
              <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 sm:items-center">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-gray-400" />
                  Email
                </span>
                <div className="sm:col-span-2 flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900 truncate">
                    <span className="hidden sm:inline">: </span>
                    {student.email || "N/A"}
                  </span>
                  {canChangeEmail && (
                    <button
                      type="button"
                      onClick={() =>
                        setEmailChangeTarget({
                          type: "student",
                          subjectName: student.name || "the student",
                          currentEmail: student.email || "",
                        })
                      }
                      className="p-1 rounded-md text-gray-500 hover:text-primary hover:bg-gray-50 cursor-pointer shrink-0"
                      aria-label="Change student email"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-primary mb-1">
              Address Information
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Current residential address
            </p>
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 sm:items-start">
              <span className="text-gray-500 flex items-start gap-1.5 pt-0.5">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                Full Address
              </span>
              <span className="sm:col-span-2 font-medium text-gray-900 leading-relaxed">
                <span className="hidden sm:inline">: </span>
                {student.address || "N/A"}
              </span>
            </div>
          </div>

          {/* Parent Information */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  Parent Information
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Primary parent/guardian contact details
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsAddParentModalOpen(true)}
                  className="flex items-center gap-2 cursor-pointer bg-primary hover:bg-secondary text-white px-4 py-2 rounded-md text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Parent
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDefaultParentModalOpen(true)}
                  className="px-4 py-2 rounded-md text-white cursor-pointer text-sm bg-primary hover:bg-secondary"
                >
                  Set Default
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <InfoRow
                icon={<User className="w-4 h-4 text-gray-400" />}
                label="Parent Name"
              >
                {parent?.parentName || "N/A"}
              </InfoRow>
              <InfoRow
                icon={<FileText className="w-4 h-4 text-gray-400" />}
                label="Relation"
              >
                {parent?.relationship || "N/A"}
              </InfoRow>
              <InfoRow
                icon={<Phone className="w-4 h-4 text-gray-400" />}
                label="Phone No"
              >
                {parent?.phone || parent?.parentPhone || "N/A"}
              </InfoRow>
              {/* Parent email with pencil — custom layout */}
              <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 sm:items-center">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-gray-400" />
                  Email
                </span>
                <div className="sm:col-span-2 flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900 truncate">
                    <span className="hidden sm:inline">: </span>
                    {parent?.email || parent?.parentEmail || "N/A"}
                  </span>
                  {canChangeEmail && parent && (
                    <button
                      type="button"
                      onClick={() =>
                        setEmailChangeTarget({
                          type: "parent",
                          parent,
                          subjectName: parent.parentName || "the parent",
                          currentEmail:
                            parent.email || parent.parentEmail || "",
                        })
                      }
                      className="p-1 rounded-md text-gray-500 hover:text-primary hover:bg-gray-50 cursor-pointer shrink-0"
                      aria-label="Change parent email"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Right Summary Sidebar */}
        <div className="bg-white p-5 col-span-2 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-primary">
              Student Summary
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Badge className="w-4 h-4 text-gray-400" /> Admission No
              </span>
              <span className="sm:col-span-2 font-medium text-gray-900">
                <span className="hidden sm:inline">: </span>
                {student.studentId || "N/A"}
              </span>
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
              <span className="text-gray-500 flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-400" /> Full Name
              </span>
              <span className="sm:col-span-2 font-medium text-gray-900">
                <span className="hidden sm:inline">: </span>
                {student.name || "N/A"}
              </span>
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" /> Gender
              </span>
              <span className="sm:col-span-2 font-medium text-gray-900">
                <span className="hidden sm:inline">: </span>
                {student.gender || "N/A"}
              </span>
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-gray-400" /> Organization
              </span>
              <span className="sm:col-span-2 font-medium text-gray-900 break-words">
                <span className="hidden sm:inline">: </span>
                {organizationName}
              </span>
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-gray-400" /> Hostel
              </span>
              <span className="sm:col-span-2 font-medium text-gray-900">
                <span className="hidden sm:inline">: </span>
                {hostelName}
              </span>
            </div>
            <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0 sm:items-center">
              <span className="text-gray-500 flex items-center gap-1.5">
                {isActive ? (
                  <CheckCircle2 className="w-4 h-4 " />
                ) : (
                  <XCircle className="w-4 h-4 " />
                )}
                Status
              </span>
              <span className="sm:col-span-2 font-medium text-gray-900 flex items-center gap-2">
                <span className="hidden sm:inline">: </span>
                <span
                  className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`}
                />
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isDefaultParentModalOpen && (
        <SetDefaultParentModal
          parents={parents}
          onClose={() => setIsDefaultParentModalOpen(false)}
          onDefaultChange={(parentId) => {
            onStudentChange?.(student._id, (current) => ({
              ...current,
              parents: (current.parents || []).map((p) => ({
                ...p,
                defaultGuardian: getParentId(p) === String(parentId),
              })),
            }));
          }}
        />
      )}

      {isAddParentModalOpen && (
        <ParentFormModal
          studentId={student._id}
          onClose={() => setIsAddParentModalOpen(false)}
          onSave={handleCreateParent}
        />
      )}

      <ChangeEmailModal
        isOpen={!!emailChangeTarget}
        title="Change Email"
        subjectName={emailChangeTarget?.subjectName}
        currentEmail={emailChangeTarget?.currentEmail}
        onClose={closeEmailChangeModal}
        onConfirmChange={handleEmailChange}
      />
    </Modal>
  );
};

export default StudentDetailView;
