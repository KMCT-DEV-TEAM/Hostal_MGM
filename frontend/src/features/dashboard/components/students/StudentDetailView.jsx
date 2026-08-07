import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
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
  Box,
  Hash,
  X
} from "lucide-react";
import Button from "@/components/ui/Button";
import DetailCard from "@/components/ui/DetailCard";
import DetailRow from "@/components/ui/DetailRow";
import Modal from "@/components/ui/Modal";
import SetDefaultParentModal from "../parents/SetDefaultParentModal";
import ParentFormModal from "../parents/ParentFormModal";
import ChangeEmailModal from "./ChangeEmailModal";
import AssignFurnitureModal from "./AssignFurnitureModal";
import ParentConflictModal from "@/components/ui/ParentConflictModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import ManageHostelModal from "./ManageHostelModal";
import { useCreateParent } from "../../hooks/parent/useCreateParent";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants/roles";
import { changeStudentEmail, getStudentFurnitures, getStudentById } from "@/services/student.service";
import { changeParentEmail, resolveParentConflict } from "@/services/parent.service";
import { formatDateReadable, formatDateStandard } from "@/utils/formatters";
import furnitureApi from "@/features/furniture/api/furnitureApi";
import { getHostels } from "@/services/hostel.service";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { vacateHostel, getStudentHostelTimeline } from "@/services/studentHostel.service";
import TimelineStep from "@/components/ui/TimelineStep";
import BackButton from "@/components/ui/BackButton";
import PageHeader from "@/components/ui/PageHeader";

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

const StudentDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.user?.role);

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isDefaultParentModalOpen, setIsDefaultParentModalOpen] = useState(false);
  const [isAddParentModalOpen, setIsAddParentModalOpen] = useState(false);
  const [emailChangeTarget, setEmailChangeTarget] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isManageHostelModalOpen, setIsManageHostelModalOpen] = useState(false);

  const [assignedFurnitures, setAssignedFurnitures] = useState([]);
  const [loadingFurnitures, setLoadingFurnitures] = useState(false);
  const [timelineData, setTimelineData] = useState([]);
  const [returnConfirmModal, setReturnConfirmModal] = useState({ isOpen: false, asset: null });
  const [isReturning, setIsReturning] = useState(false);

  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState(null);

  const [isVacateConfirmOpen, setIsVacateConfirmOpen] = useState(false);
  const [isVacating, setIsVacating] = useState(false);

  const [conflictData, setConflictData] = useState(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);

  const handleModalCloseRequest = (closeAction) => {
    setPendingCloseAction(() => closeAction);
    setIsDiscardConfirmOpen(true);
  };

  const confirmDiscard = () => {
    if (pendingCloseAction) {
      pendingCloseAction();
    }
    setIsDiscardConfirmOpen(false);
    setPendingCloseAction(null);
  };

  const fetchTimeline = React.useCallback(async () => {
    if (!id) return;
    try {
      const data = await getStudentHostelTimeline(id);
      setTimelineData(data?.data?.timeline || data?.timeline || []);
    } catch (err) {
      console.error('Failed to fetch hostel timeline', err);
    }
  }, [id]);

  const handleVacateHostel = async () => {
    setIsVacating(true);
    try {
      await vacateHostel(student._id);
      showSuccessToast("Student vacated from hostel successfully");
      setIsVacateConfirmOpen(false);
      onStudentChange?.(student._id, (current) => ({
        ...current,
        hostelStatus: "vacated",
        hostelId: null,
        hostel: null,
        roomNumber: null,
        activeAllocation: null
      }));
      fetchTimeline(); // Re-fetch timeline on vacate
    } catch (error) {
      showErrorToast(error?.response?.data?.message || error.message || "Failed to vacate hostel");
    } finally {
      setIsVacating(false);
    }
  };

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const data = await getStudentById(role, id);
        setStudent(data?.data || data);
      } catch (err) {
        setError(err.message || "Failed to load student details");
      } finally {
        setLoading(false);
      }
    };
    if (id && role) {
      fetchStudent();
    }
  }, [id, role]);

  useEffect(() => {
    const fetchFurnitures = async () => {
      try {
        setLoadingFurnitures(true);
        const data = await getStudentFurnitures(role, id);
        setAssignedFurnitures(data?.assets || []);
      } catch (err) {
        console.error('Failed to fetch assigned furnitures', err);
      } finally {
        setLoadingFurnitures(false);
      }
    };

    if (id) {
      fetchFurnitures();
      fetchTimeline();
    }
  }, [id, role, fetchTimeline]);

  const onStudentChange = (studentId, updater) => {
    setStudent(prev => prev ? updater(prev) : prev);
  };

  const [availableFurnitures, setAvailableFurnitures] = useState([]);

  useEffect(() => {
    if (isAssignModalOpen) {
      const fetchModalData = async () => {
        try {
          const params = { status: "Available", limit: 1000 };
          const hostelId = student?.hostel?._id || student?.hostelId || (typeof student?.hostel === 'string' ? student?.hostel : null);
          if (hostelId) {
            params.hostelId = hostelId;
          }
          const furnituresRes = await furnitureApi.getAllFurnitureAssets(params);
          setAvailableFurnitures(furnituresRes.data?.data?.assets || furnituresRes.data?.assets || []);
        } catch (error) {
          console.error("Failed to fetch data for modal", error);
        }
      };
      fetchModalData();
    }
  }, [isAssignModalOpen]);

  const handleAssignSave = async (data) => {
    try {
      const studentId = student?._id || student?.id;
      if (!studentId) {
        showErrorToast("Error: Student ID is missing. Cannot save.");
        console.error("Student ID is missing. Student object:", student);
        return;
      }

      const { furnitures } = data; // hostelId and roomNo are ignored for now if not implemented on backend
      const newAssetIds = furnitures.map(String);

      await furnitureApi.allocateAssetsBulk({ studentId, assetIds: newAssetIds });

      // Re-fetch assigned furnitures
      const furnData = await getStudentFurnitures(role, studentId);
      setAssignedFurnitures(furnData?.assets || []);

      setIsAssignModalOpen(false);
      showSuccessToast("Furniture assignment updated successfully.");
    } catch (error) {
      console.log('error assignment:', error)
      showErrorToast(error.message || "Failed to update assignment.");
    }
  };

  const handleReturnClick = (asset) => {
    setReturnConfirmModal({ isOpen: true, asset });
  };

  const handleReturnConfirm = async () => {
    if (!returnConfirmModal.asset) return;
    setIsReturning(true);
    try {
      const studentId = student?._id || student?.id;
      const assetId = returnConfirmModal.asset._id || returnConfirmModal.asset.id;
      await furnitureApi.returnAsset(studentId, assetId);

      // Re-fetch assigned furnitures
      const data = await getStudentFurnitures(role, studentId);
      setAssignedFurnitures(data?.assets || []);

      showSuccessToast("Furniture returned successfully");
      setReturnConfirmModal({ isOpen: false, asset: null });
    } catch (error) {
      showErrorToast(error.message || "Failed to return furniture");
    } finally {
      setIsReturning(false);
    }
  };

  const { handleCreateParent } = useCreateParent((result, payload) => {
    const parentData = result?.parent || result?.data || result;
    const createdParent = normalizeParent(parentData, payload);
    const studentId = createdParent.studentId ?? student._id ?? student.id;
    onStudentChange?.(studentId, (current) => {
      const existingParents = current.parents || [];
      const parentIdStr = String(createdParent._id);

      const isAlreadyLinked = existingParents.some(p =>
        String(p._id) === parentIdStr || String(p.parentId?._id) === parentIdStr
      );

      return {
        ...current,
        parents: isAlreadyLinked
          ? existingParents.map(p =>
            (String(p._id) === parentIdStr || String(p.parentId?._id) === parentIdStr)
              ? { ...p, ...createdParent }
              : p
          )
          : [...existingParents, createdParent],
      };
    });
    setIsAddParentModalOpen(false);
  });

  const handleResolveConflict = async (action) => {
    setIsResolvingConflict(true);
    try {
      const result = await resolveParentConflict(role, {
        ...conflictData.payload,
        resolutionAction: action
      });

      const parentData = result?.parent || result?.data || result;
      const createdParent = normalizeParent(parentData, conflictData.payload);
      const sId = createdParent.studentId ?? student._id ?? student.id;
      onStudentChange?.(sId, (current) => {
        const existingParents = current.parents || [];
        const parentIdStr = String(createdParent._id);

        const isAlreadyLinked = existingParents.some(p =>
          String(p._id) === parentIdStr || String(p.parentId?._id) === parentIdStr
        );

        return {
          ...current,
          parents: isAlreadyLinked
            ? existingParents.map(p =>
              (String(p._id) === parentIdStr || String(p.parentId?._id) === parentIdStr)
                ? { ...p, ...createdParent }
                : p
            )
            : [...existingParents, createdParent],
        };
      });

      showSuccessToast("Parent linked successfully");
      setIsConflictModalOpen(false);
      setConflictData(null);
    } catch (error) {
      showErrorToast(error?.response?.data?.message || "Failed to resolve conflict");
    } finally {
      setIsResolvingConflict(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="h-8 bg-gray-200 rounded-md w-64 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded-md w-48"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-3 space-y-6">
            {[1, 2].map((card) => (
              <div key={card} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="h-5 bg-gray-200 rounded-md w-1/4 mb-6"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((row) => (
                    <div key={row} className="flex flex-col sm:grid sm:grid-cols-3 gap-2">
                      <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                      <div className="sm:col-span-2 h-4 bg-gray-200 rounded-md w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {[1, 2].map((card) => (
              <div key={card} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="h-5 bg-gray-200 rounded-md w-1/3 mb-6"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((row) => (
                    <div key={row} className="flex flex-col sm:grid sm:grid-cols-3 gap-2">
                      <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                      <div className="sm:col-span-2 h-4 bg-gray-200 rounded-md w-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="flex h-[50vh] items-center justify-center text-red-500">{error}</div>;
  }

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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">

          <div className="flex flex-col">
            <PageHeader
              title={student.name}
              subtitle={`Student - ${hostelName}`}
              actionButton={<BackButton text="Back to Students" />}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 [&>*:first-child]:order-2 [&>*:last-child]:order-1 lg:[&>*:first-child]:order-none lg:[&>*:last-child]:order-none">
        {" "}
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Basic Info */}
          {/* Basic Info */}
          <DetailCard title="Basic Info" subtitle="Basic contact information of the Student">
            <div className="space-y-1">
              <DetailRow icon={<Badge className="w-4 h-4" />} label="Admission No" value={student.studentId || "N/A"} />
              <DetailRow icon={<User className="w-4 h-4" />} label="Full Name" value={student.name || "N/A"} />
              <DetailRow icon={<User className="w-4 h-4" />} label="Gender" value={student.gender || "N/A"} />
              <DetailRow icon={<Calendar className="w-4 h-4" />} label="Date Of Birth" value={student.dob ? formatDateStandard(student.dob) : "N/A"} />
              <DetailRow
                icon={isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                label="Status"
                value={
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
                    {isActive ? "Active" : "Inactive"}
                  </span>
                }
              />
            </div>
          </DetailCard>

          {/* Academic Information */}
          <DetailCard title="Academic Information" subtitle="Academic details and institutional information">
            <div className="space-y-1">
              <DetailRow icon={<Building2 className="w-4 h-4" />} label="Organization" value={organizationName} />
              <DetailRow icon={<BookOpen className="w-4 h-4" />} label="Course" value={student.course?.name || "N/A"} />
              <DetailRow icon={<FileText className="w-4 h-4" />} label="Department" value={student.department?.name || "N/A"} />
              <DetailRow icon={<Users className="w-4 h-4" />} label="Batch" value={student.batch?.name || "N/A"} />
              <DetailRow icon={<User className="w-4 h-4" />} label="Mentor" value={student.mentor?.name || "N/A"} />
              <DetailRow icon={<Mail className="w-4 h-4" />} label="Mentor Email" value={student.mentor?.email || "N/A"} />
              <DetailRow icon={<Phone className="w-4 h-4" />} label="Mentor Phone" value={student.mentor?.phone || "N/A"} />
            </div>
          </DetailCard>

          <DetailCard title="Contact Information" subtitle="Contact Information of The Student">
            <div className="space-y-1">
              <DetailRow icon={<Phone className="w-4 h-4" />} label="Phone No" value={student.phone || "N/A"} />
              <DetailRow
                icon={<Mail className="w-4 h-4" />}
                label="Email"
                valueClassName="flex-1"
                value={
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="truncate">{student.email || "N/A"}</span>
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
                }
              />
            </div>
          </DetailCard>

          {/* Current Hostel */}
          <DetailCard
            title="Current Hostel"
            subtitle="Current hostel allocation details"
            headerAction={
              (ROLES.SUPER_ADMIN === role || ROLES.ADMIN === role) ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsManageHostelModalOpen(true)}
                  >
                    {!student.hostelId ? "Allocate Hostel" : "Change Hostel"}
                  </Button>
                  {student.hostelStatus === 'active' && student.hostelId && <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setIsVacateConfirmOpen(true)}
                    disabled={!student.hostelId || student.hostelStatus !== 'active'}
                  >
                    Vacate Hostel
                  </Button>}
                </div>
              ) : null
            }
          >
            <div className="space-y-1">
              <DetailRow icon={<Building2 className="w-4 h-4" />} label="Hostel" value={hostelName} />
              <DetailRow icon={<Home className="w-4 h-4" />} label="Room" value={student.roomNumber || "N/A"} />
              <DetailRow
                icon={<Calendar className="w-4 h-4" />}
                label="Joined On"
                value={student.activeAllocation?.joinedAt ? formatDateStandard(student.activeAllocation.joinedAt) : "N/A"}
              />
              <DetailRow
                icon={student.hostelStatus === "active" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                label="Status"
                value={
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${student.hostelStatus === "active" ? "bg-green-500" : "bg-red-500"}`} />
                    {student.hostelStatus ? student.hostelStatus.charAt(0).toUpperCase() + student.hostelStatus.slice(1) : "N/A"}
                  </span>
                }
              />
              <DetailRow icon={<User className="w-4 h-4" />} label="Allocated By" value={student.activeAllocation?.allocatedBy?.name || "N/A"} />
            </div>
          </DetailCard>

          {/* Address Information */}
          <DetailCard title="Address Information" subtitle="Current residential address">
            <div className="space-y-1">
              <DetailRow
                icon={<MapPin className="w-4 h-4" />}
                label="Full Address"
                value={
                  <span className="leading-relaxed break-words whitespace-pre-wrap overflow-hidden" style={{ wordBreak: 'break-word' }}>
                    {student.address || "N/A"}
                  </span>
                }
              />
            </div>
          </DetailCard>

          {/* Parent Information */}
          <DetailCard
            title="Parent Information"
            subtitle="Primary parent/guardian contact details"
            headerAction={
              (ROLES.SUPER_ADMIN === role || ROLES.ADMIN === role) ? (
                <div className="flex items-center w-fit gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth={false}
                    className="whitespace-nowrap"
                    onClick={() => setIsAddParentModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Parent
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth={false}
                    className="whitespace-nowrap"
                    onClick={() => setIsDefaultParentModalOpen(true)}
                  >
                    Set Default
                  </Button>
                </div>
              ) : null
            }
          >
            <div className="space-y-1">
              <DetailRow icon={<User className="w-4 h-4" />} label="Parent Name" value={parent?.parentName || "N/A"} />
              <DetailRow icon={<FileText className="w-4 h-4" />} label="Relation" value={parent?.relationship || "N/A"} />
              <DetailRow icon={<Phone className="w-4 h-4" />} label="Phone No" value={parent?.phone || parent?.parentPhone || "N/A"} />
              <DetailRow
                icon={<Mail className="w-4 h-4" />}
                label="Email"
                valueClassName="flex-1"
                value={
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="truncate">{parent?.email || parent?.parentEmail || "N/A"}</span>
                    {canChangeEmail && parent && (
                      <button
                        type="button"
                        onClick={() =>
                          setEmailChangeTarget({
                            type: "parent",
                            parent,
                            subjectName: parent.parentName || "the parent",
                            currentEmail: parent.email || parent.parentEmail || "",
                          })
                        }
                        className="p-1 rounded-md text-gray-500 hover:text-primary hover:bg-gray-50 cursor-pointer shrink-0"
                        aria-label="Change parent email"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                }
              />
            </div>
          </DetailCard>

          {/* Assign Information */}
          <DetailCard
            title="Assign Information"
            subtitle="Details of Assigned Hostel and Furniture"
            headerAction={
              (ROLES.SUPER_ADMIN === role || ROLES.ADMIN === role || ROLES.WARDEN === role) && (student?.hostelStatus === "active") ? (
                <div className="flex items-center w-fit gap-2">
                  <Button
                    className="px-6 py-2 rounded-md text-white cursor-pointer text-sm bg-primary hover:bg-secondary"
                    onClick={() => setIsAssignModalOpen(true)}
                    size="sm"
                  >
                    Add Furniture
                  </Button>
                </div>
              ) : null
            }
          >
            {!student.hostel ? (
              /* ── Empty state: no hostel assigned ── */
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                  <Home className="w-7 h-7 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">No Hostel Assigned</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
                    This student has not been allocated a hostel yet.
                  </p>
                </div>
                {(ROLES.SUPER_ADMIN === role || ROLES.ADMIN === role || ROLES.WARDEN === role) && (
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth={false}
                    onClick={() => setIsManageHostelModalOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Allocate Hostel
                  </Button>
                )}
              </div>
            ) : (
              /* ── Hostel assigned: show details ── */
              <div className="space-y-1">
                <DetailRow icon={<Home className="w-4 h-4" />} label="Assigned Hostel" value={hostelName} />
                <DetailRow
                  icon={<Box className="w-4 h-4" />}
                  label="Furnitures"
                  value={
                    <div className="flex flex-wrap gap-2 items-center">
                      {loadingFurnitures ? (
                        <div className="h-6 bg-gray-200 rounded-md w-32 animate-pulse"></div>
                      ) : assignedFurnitures.length > 0 ? (
                        assignedFurnitures.map((f, i) => (
                          <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                            {f.furnitureTypeId?.name || "Unknown"}
                            <button
                              type="button"
                              className="hover:text-red-500 transition-colors ml-1 cursor-pointer"
                              onClick={() => handleReturnClick(f)}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">No furniture assigned</span>
                      )}
                    </div>
                  }
                />
                <DetailRow
                  icon={<Hash className="w-4 h-4" />}
                  label="Furniture Id"
                  value={
                    loadingFurnitures ? (
                      <div className="h-4 bg-gray-200 rounded-md w-40 animate-pulse mt-0.5"></div>
                    ) : assignedFurnitures.length > 0 ? (
                      assignedFurnitures.map((f) => f.furnitureId).join(", ")
                    ) : (
                      "N/A"
                    )
                  }
                />
                <DetailRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Assigned On"
                  value={
                    loadingFurnitures ? (
                      <div className="h-4 bg-gray-200 rounded-md w-28 animate-pulse mt-0.5"></div>
                    ) : assignedFurnitures.length > 0 && assignedFurnitures[0].createdAt ? (
                      formatDateReadable(assignedFurnitures[0].createdAt)
                    ) : (
                      "N/A"
                    )
                  }
                />
                <DetailRow
                  icon={<User className="w-4 h-4" />}
                  label="Assigned By"
                  value={
                    loadingFurnitures ? (
                      <div className="h-4 bg-gray-200 rounded-md w-20 animate-pulse mt-0.5"></div>
                    ) : (
                      "Warden"
                    )
                  }
                />
              </div>
            )}
          </DetailCard>
        </div>
        <div className="lg:col-span-2 space-y-6">
          {/* Right Summary Sidebar */}
          {/* Right Summary Sidebar */}
          <DetailCard
            title={
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <span>Student Summary</span>
              </div>
            }
          >
            <div className="space-y-1">
              <DetailRow icon={<Badge className="w-4 h-4" />} label="Admission No" value={student.studentId || "N/A"} />
              <DetailRow icon={<User className="w-4 h-4" />} label="Full Name" value={student.name || "N/A"} />
              <DetailRow icon={<Users className="w-4 h-4" />} label="Gender" value={student.gender || "N/A"} />
              <DetailRow
                icon={<Building2 className="w-4 h-4" />}
                label="Organization"
                valueClassName="break-words"
                value={organizationName}
              />
              <DetailRow icon={<Home className="w-4 h-4" />} label="Hostel" value={hostelName} />
              <DetailRow
                icon={isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                label="Status"
                value={
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
                    {isActive ? "Active" : "Inactive"}
                  </span>
                }
              />
            </div>
          </DetailCard>

          {/* Timeline Section */}
          <DetailCard
            title={
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Hostel History</span>
              </div>
            }
          >
            {timelineData.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">No hostel history available.</div>
            ) : (
              <div className="pl-6 border-l-2 border-gray-100 space-y-8 relative ml-3">
                {timelineData.map((item, index) => {
                  let badgeColor = "#6b7280";
                  let badgeBg = "#f3f4f6";
                  let nodeColor = "#9ca3af";
                  let badgeLabel = item.status;

                  if (item.status === 'active') {
                    badgeColor = "#16a34a"; // green-600
                    badgeBg = "#dcfce7"; // green-100
                    nodeColor = "#22c55e"; // green-500
                  } else if (item.status === 'vacated') {
                    badgeColor = "#dc2626"; // red-600
                    badgeBg = "#fee2e2"; // red-100
                    nodeColor = "#ef4444"; // red-500
                  } else if (item.status === 'transferred') {
                    badgeColor = "#2563eb"; // blue-600
                    badgeBg = "#dbeafe"; // blue-100
                    nodeColor = "#3b82f6"; // blue-500
                  } else if (item.status === 'cancelled') {
                    badgeColor = "#d97706"; // amber-600
                    badgeBg = "#fef3c7"; // amber-100
                    nodeColor = "#f59e0b"; // amber-500
                  }

                  const hostelInfo = `${item.hostelId?.name || item.hostel?.name || 'Unknown'} (${item.roomNumber || 'N/A'})`;
                  let title = `Allocated to ${hostelInfo}`;
                  let subtitle = `${item.allocatedBy?.name || 'Admin'} - Allocation`;

                  if (item.status === 'vacated') {
                    title = `Vacated from ${hostelInfo}`;
                    subtitle = `${item.vacatedBy?.name || item.allocatedBy?.name || 'Admin'} - Vacated`;
                  } else if (item.status === 'transferred') {
                    title = `Transferred from ${hostelInfo}`;
                    subtitle = `${item.vacatedBy?.name || item.allocatedBy?.name || 'Admin'} - Transferred`;
                  } else if (item.status === 'cancelled') {
                    title = `Cancelled Allocation for ${hostelInfo}`;
                    subtitle = `${item.vacatedBy?.name || item.allocatedBy?.name || 'Admin'} - Cancelled`;
                  }

                  return (
                    <TimelineStep
                      key={item._id || index}
                      title={title}
                      subtitle={subtitle}
                      status={item.status}
                      formattedDate={formatDateStandard(item.joinedAt)}
                      badgeLabel={badgeLabel}
                      badgeColor={badgeColor}
                      badgeBg={badgeBg}
                      nodeColor={nodeColor}
                      avatarBg="#f3f4f6"
                      avatarColor="#374151"
                    />
                  );
                })}
              </div>
            )}
          </DetailCard>
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
          onClose={() => handleModalCloseRequest(() => setIsAddParentModalOpen(false))}
          onSave={async (payload) => {
            try {
              await handleCreateParent(payload);
            } catch (err) {
              const errorCode = err?.code || err?.response?.data?.code;
              if (errorCode === 'PARENT_EXISTS_WITH_DIFFERENT_DATA') {
                const conflictDataResponse = err?.data?.data || err?.response?.data?.data;

                setConflictData({
                  existing: conflictDataResponse.existing,
                  submitted: conflictDataResponse.submitted,
                  payload: payload
                });
                setIsConflictModalOpen(true);
                setIsAddParentModalOpen(false);
              }
            }
          }}
        />
      )}

      <ParentConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflictData={conflictData}
        isResolvingConflict={isResolvingConflict}
        onResolve={handleResolveConflict}
      />

      <ChangeEmailModal
        isOpen={!!emailChangeTarget}
        title="Change Email"
        subjectName={emailChangeTarget?.subjectName}
        currentEmail={emailChangeTarget?.currentEmail}
        onClose={() => handleModalCloseRequest(closeEmailChangeModal)}
        onConfirmChange={handleEmailChange}
      />

      <AssignFurnitureModal
        isOpen={isAssignModalOpen}
        onClose={() => handleModalCloseRequest(() => setIsAssignModalOpen(false))}
        isEdit={assignedFurnitures.length > 0}
        student={student}
        assignedFurnitures={assignedFurnitures}
        onSave={handleAssignSave}
      />

      <ConfirmationModal
        isOpen={isVacateConfirmOpen}
        onClose={() => setIsVacateConfirmOpen(false)}
        onConfirm={handleVacateHostel}
        title="Vacate Hostel"
        message="Are you sure you want to vacate this student from the hostel? This action will mark their current allocation as vacated."
        confirmText="Vacate"
        isSubmitting={isVacating}
        confirmButtonVariant="danger"
      />

      <ConfirmationModal
        isOpen={returnConfirmModal.isOpen}
        onClose={() => setReturnConfirmModal({ isOpen: false, asset: null })}
        onConfirm={handleReturnConfirm}
        title="Return Furniture"
        message={`Are you sure you want to return ${returnConfirmModal.asset?.furnitureTypeId?.name || "this furniture"} (${returnConfirmModal.asset?.furnitureId || "Unknown ID"})?`}
        confirmText="Return"
        isSubmitting={isReturning}
        confirmButtonVariant="danger"
      />

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

      <ManageHostelModal
        isOpen={isManageHostelModalOpen}
        onClose={() => handleModalCloseRequest(() => setIsManageHostelModalOpen(false))}
        student={student}
        onSave={(data) => {
          onStudentChange?.(student._id, (current) => ({
            ...current,
            hostelId: data.hostelId,
            hostel: data.hostel,
            roomNumber: data.roomNumber,
            hostelStatus: data.hostelStatus,
            activeAllocation: data.activeAllocation,
          }));
          setIsManageHostelModalOpen(false);
          fetchTimeline();
        }}
      />
    </div>
  );
};

export default StudentDetailView;
