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
  GraduationCap,
  Home,
  CheckCircle2,
  XCircle,
  Badge,
  FileText,
  Info,
  Pen,
  PenIcon,
  Pencil,
  Plus,
} from "lucide-react";
import Button from "@/components/ui/Button";
import SetDefaultParentModal from "../parents/SetDefaultParentModal";
import ParentFormModal from "../parents/ParentFormModal";
import { useCreateParent } from "../../hooks/parent/useCreateParent";

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

const StudentDetailView = ({ student, onClose, onStudentChange }) => {
  const [isDefaultParentModalOpen, setIsDefaultParentModalOpen] =
    useState(false);

  const [isAddParentModalOpen, setIsAddParentModalOpen] = useState(false);
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
  const parent =
    parents.find((parent) => parent.defaultGuardian) ?? parents[0] ?? null;
  const isActive = Boolean(student.isActive);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-5xl"
      avatar={student.name}
      title={student.name}
      subtitle={`Student - ${hostelName}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-primary">Basic Info</h3>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Basic contact information of the Student
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <Badge className="w-4 h-4" />
                  <span>Admission No</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900">
                  : {student.studentId || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <User className="w-4 h-4" />
                  <span>Full Name</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900">
                  : {student.name || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <User className="w-4 h-4" />
                  <span>Gender</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900">
                  : {student.gender || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Date Of Birth</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900">
                  :{" "}
                  {student.dob
                    ? new Date(student.dob).toLocaleDateString("en-IN")
                    : "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  {isActive ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>Status</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900 flex items-center">
                  :
                  <span
                    className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"} mx-2`}
                  ></span>
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Academic Information Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-primary">
                Academic Information
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Academic details and institutional information
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>Gender</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900">
                  : {student.gender || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Date of Birth</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900">
                  :{" "}
                  {student.dob
                    ? new Date(student.dob).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span>Organization</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900">
                  : {organizationName}
                </span>
              </div>
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <BookOpen className="w-4 h-4" />
                  <span>Course</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900">
                  : {student.course || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <FileText className="w-4 h-4" />
                  <span>Department</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900">
                  : {student.department || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Academic Year</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900">
                  : {student.academicYear || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <Home className="w-4 h-4" />
                  <span>Assigned Hostel</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900">
                  : {hostelName}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-primary">
                Contact Information
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Contact Information of The Student
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <Phone className="w-4 h-4" />
                  <span>Phone No</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900">
                  : {student.phone || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </div>

                <div className="col-span-2 flex items-center justify-between">
                  <span className="font-medium text-gray-900 truncate">
                    : {student.email || "N/A"}
                  </span>

                  <Pencil className="w-4 h-4 cursor-pointer flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
          {/* Address Information Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-primary">
                Address Information
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Current residential address
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-3 text-sm items-start">
                <div className="flex items-start gap-2 text-gray-500 pt-1">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Full Address</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900 leading-relaxed">
                  : {student.address || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Parent Information Section */}
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
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <User className="w-4 h-4" />
                  <span>Parent Name</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900">
                  : {parent?.parentName || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <FileText className="w-4 h-4" />
                  <span>Relation</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900">
                  : {parent?.relationship || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <Phone className="w-4 h-4" />
                  <span>Phone No</span>
                </div>
                <span className="col-span-2 font-medium text-gray-900">
                  : {parent?.phone || parent?.parentPhone || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 text-sm items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <span className="col-span-2 font-medium text-gray-900">
                    : {parent?.email || parent?.parentEmail || "N/A"}
                  </span>

                  <Pencil className="w-4 h-4 cursor-pointer flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary Sidebar */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-primary">
              Student Summary
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex text-sm gap-3">
              <div className="w-28 shrink-0 text-gray-500 flex items-center gap-2">
                <Badge className="w-4 h-4" />
                <span>Admission No</span>
              </div>
              <span className="col-span-2 font-medium text-gray-900">
                : {student.studentId || "N/A"}
              </span>
            </div>
            <div className="flex text-sm gap-3">
              <div className="w-28 shrink-0 text-gray-500 flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Full Name</span>
              </div>
              <span className="col-span-2 font-medium text-gray-900">
                : {student.name || "N/A"}
              </span>
            </div>
            <div className="flex text-sm gap-3">
              <div className="w-28 shrink-0 text-gray-500 flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Gender</span>
              </div>
              <span className="col-span-2 font-medium text-gray-900">
                : {student.gender || "N/A"}
              </span>
            </div>
            <div className="flex text-sm gap-3">
              <div className="w-28 shrink-0 text-gray-500 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>Organization</span>
              </div>

              <div className="flex-1 break-words font-medium text-gray-900">
                : {organizationName}
              </div>
            </div>
            <div className="flex text-sm gap-3">
              <div className="w-28 shrink-0 text-gray-500 flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span>Hostel</span>
              </div>
              <span className="col-span-2 font-medium text-gray-900">
                : {hostelName}
              </span>
            </div>
            <div className="flex text-sm gap-3">
              <div className="w-28 shrink-0 text-gray-500 flex items-center gap-2">
                {isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span>Status</span>
              </div>
              <span className="col-span-2 font-medium text-gray-900 flex items-center">
                :
                <span
                  className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"} mx-2`}
                ></span>
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
              parents: (current.parents || []).map((parent) => ({
                ...parent,
                defaultGuardian: getParentId(parent) === String(parentId),
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
    </Modal>
  );
};

export default StudentDetailView;
