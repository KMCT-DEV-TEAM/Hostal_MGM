"use client"
import React, { useCallback, useMemo, useState } from "react";
import PageHeader from '@/components/ui/PageHeader';
import ListToolbar from '@/components/ui/ListToolbar';
import BulkActionMenu from '@/components/ui/BulkActionMenu';
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants/roles";
import { getStudentPermissions } from "@/features/dashboard/config/studentPermissions";
import { useStudents } from "@/features/dashboard/hooks/useStudents";
import {
  createStudent,
  toggleStudentStatus,
  bulkUpdateStudentStatus,
  updateStudentByRole,
  getStudents,
} from "@/services/student.service";
import StudentsTable from "../components/students/StudentsTable";
import StudentsHeader from "../components/students/StudentsHeader";

import StudentFormModal from "../components/students/StudentFormModal";
import StudentFilterModal from "../components/students/StudentFilterModal";
import StudentExportFilterModal from "../components/Studentexportfiltermodal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { exportToExcel } from "@/utils/exportUtils";

export default function Students() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const { canEdit, canDelete, canCreate } = getStudentPermissions(role);

  const [activeModal, setActiveModal] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [statusLoadingIds, setStatusLoadingIds] = useState([]);
  const [pendingConfirm, setPendingConfirm] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    search: "",
    courseId: "",
    departmentId: "",
    hostelId: "",
    organizationId: "",
    isActive: "",
  });
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const studentQuery = useMemo(
    () => ({ ...filters, page, limit }),
    [filters, page, limit],
  );
  const { students, setStudents, loading, error, pagination, refetch } =
    useStudents(studentQuery);
  const getStudentId = (student) => student._id ?? student.id;
  const updateStudentState = useCallback(
    (studentId, updater) => {
      setStudents((prev) =>
        prev.map((student) => {
          if (getStudentId(student) !== studentId) return student;
          return typeof updater === "function" ? updater(student) : updater;
        }),
      );
    },
    [setStudents],
  );

  const handleStudentTreeUpdate = useCallback(
    (studentId, updater) => {
      updateStudentState(studentId, updater);
    },
    [updateStudentState],
  );

  const applyStatusChange = (ids, response) => {
    const changedIds = new Set(Array.isArray(ids) ? ids : [ids]);
    const nextIsActive = response?.isActive;

    if (typeof nextIsActive !== "boolean") return;

    setStudents((prev) =>
      prev.map((student) =>
        changedIds.has(getStudentId(student))
          ? { ...student, isActive: nextIsActive }
          : student,
      ),
    );
  };

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setActiveModal("student");
  };

  const handleViewClick = (student) => {
    navigate(`/dashboard/students/${getStudentId(student)}`);
  };

  const handleAddClick = () => {
    setEditingStudent(null);
    setActiveModal("student");
  };

  const handleSelectAll = (customIds) => {
    const idsToSelect = Array.isArray(customIds) ? customIds : students.map(getStudentId);
    setSelectedIds(
      selectedIds.length === idsToSelect.length ? [] : idsToSelect,
    );
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBulkStatusChange = async (targetActive, idsToToggle) => {
    if (!idsToToggle.length) return;
    setStatusLoadingIds((prev) => [...new Set([...prev, ...idsToToggle])]);
    try {
      await bulkUpdateStudentStatus(role, { ids: idsToToggle, isActive: targetActive });
      setStudents((prev) =>
        prev.map((student) =>
          idsToToggle.includes(getStudentId(student))
            ? { ...student, isActive: targetActive }
            : student,
        ),
      );
      setSelectedIds([]);
      showSuccessToast(
        `${idsToToggle.length} students ${targetActive ? "activated" : "deactivated"} successfully`
      );
    } catch (err) {
      showErrorToast(
        err?.response?.data?.message ||
        `Failed to ${targetActive ? "activate" : "deactivate"} students`
      );
    } finally {
      setStatusLoadingIds((prev) => prev.filter((id) => !idsToToggle.includes(id)));
    }
  };

  const prepareBulkStatusChange = (targetActive) => {
    if (!selectedIds.length) return;
    const idsToToggle = selectedIds.filter((id) => {
      const student = students.find((s) => getStudentId(s) === id);
      return student ? student.isActive !== targetActive : false;
    });
    if (!idsToToggle.length) {
      setSelectedIds([]);
      return;
    }
    setPendingConfirm({
      title: targetActive ? "Confirm Activation" : "Confirm Deactivation",
      message: `Are you sure you want to ${targetActive ? "activate" : "deactivate"} ${idsToToggle.length} selected student(s)?`,
      confirmText: targetActive ? "Activate" : "Deactivate",
      confirmAction: () => handleBulkStatusChange(targetActive, idsToToggle),
    });
  };

  const handleActivateSelected = () => {
    if (!canEdit) return;
    prepareBulkStatusChange(true);
  };

  const handleDeactivateSelected = () => {
    if (!canDelete) return;
    prepareBulkStatusChange(false);
  };

  const confirmDeleteRow = async (id) => {
    setStatusLoadingIds((prev) => [...new Set([...prev, id])]);
    try {
      const response = await toggleStudentStatus(role, id);
      applyStatusChange(id, response);
      showSuccessToast("Student status updated successfully");
    } catch (err) {
      showErrorToast(
        err?.response?.data?.message || "Failed to update student status"
      );
    } finally {
      setStatusLoadingIds((prev) => prev.filter((loadingId) => loadingId !== id));
    }
  };

  const handleDeleteRow = async (id) => {
    if (!canDelete) return;
    setPendingConfirm({
      title: "Confirm Deactivation",
      message: "Are you sure you want to deactivate this student?",
      confirmText: "Deactivate",
      confirmAction: () => confirmDeleteRow(id),
    });
  };

  const confirmStatusChange = async (id) => {
    setStatusLoadingIds((prev) => [...new Set([...prev, id])]);
    try {
      const response = await toggleStudentStatus(role, id);
      applyStatusChange(id, response);
      showSuccessToast("Student status updated successfully");
    } catch (err) {
      showErrorToast(
        err?.response?.data?.message || "Failed to update student status"
      );
    } finally {
      setStatusLoadingIds((prev) => prev.filter((loadingId) => loadingId !== id));
    }
  };

  const handleStatusChange = (id) => {
    if (!canEdit) return;
    const student = students.find((s) => getStudentId(s) === id);
    const targetActive = !student?.isActive;
    setPendingConfirm({
      title: targetActive ? "Confirm Activation" : "Confirm Deactivation",
      message: `Are you sure you want to ${targetActive ? "activate" : "deactivate"} ${student?.name || "this student"}?`,
      confirmText: targetActive ? "Activate" : "Deactivate",
      confirmAction: () => confirmStatusChange(id),
    });
  };

  const handleSearch = useCallback((query) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, search: query }));
  }, []);

  const handleApplyFilter = (next) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...next }));
    setIsFilterModalOpen(false);
  };

  const handleSaveStudent = async (payload) => {
    try {
      if (editingStudent) {
        await updateStudentByRole(role, getStudentId(editingStudent), payload);
        showSuccessToast("Student updated successfully");
      } else {
        await createStudent(payload);
        showSuccessToast("Student created successfully");
      }
      setActiveModal(null);
      setEditingStudent(null);
      refetch();
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.message ||
        err?.data?.message ||
        (editingStudent ? "Failed to update student" : "Failed to create student");
      showErrorToast(message);
    }
  };

  // Export flow: open the filter modal (mirrors Parents.js handleExport)
  const handleExport = () => {
    setIsExportConfirmOpen(true);
  };

  const confirmExport = async (exportFilters) => {
    setIsExporting(true);
    try {
      const mergedFilters = { ...filters, ...exportFilters };

      const params = Object.fromEntries(
        Object.entries(mergedFilters).filter(([, value]) => value !== ""),
      );

      const response = await getStudents(role, { ...params, page: 1, limit: 99990 });

      const dataToExport = response?.students || response?.data || [];

      if (dataToExport.length === 0) {
        showErrorToast("Export failed", "No students match the selected filters");
        setIsExportConfirmOpen(false);
        return;
      }

      const exportData = dataToExport.map((student, index) => ({
        "S.No": index + 1,
        "Admission No": student.studentId,
        "Name": student.name,
        "Email": student.email,
        "Phone": student.phone,
        "Course": student.course?.name ?? student.course ?? "N/A",
        "Department": student.department?.name ?? student.department ?? "N/A",
        "Status": student.isActive ? "Active" : "Inactive",
      }));

      const isSuccess = exportToExcel(exportData, "Students_Export", "Students");

      if (isSuccess) {
        showSuccessToast("Exported successfully");
      } else {
        showErrorToast("Export failed", "Could not generate the Excel file");
      }

      setIsExportConfirmOpen(false);
    } catch (err) {
      console.error("Failed to export students:", err);
      showErrorToast(
        "Export failed",
        err?.response?.data?.message || err.message,
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
      <div className="p-4 md:p-6 flex-1 flex flex-col">
        <StudentsHeader
          selectedIds={selectedIds}
          students={students}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleEditClick}
          onActivateSelected={handleActivateSelected}
          onDeactivateSelected={handleDeactivateSelected}
        />

        <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col">
          <StudentsTable
            canCreate={canCreate}
            searchValue={filters.search}
            onSearch={handleSearch}
            onFilterClick={() => setIsFilterModalOpen(true)}
            onExport={handleExport}
            onAddClick={handleAddClick}
            onActivateSelected={handleActivateSelected}
            onDeactivateSelected={handleDeactivateSelected}
            students={students}
            loading={loading}
            error={error}
            canEdit={canEdit}
            canDelete={canDelete}
            showOrganizationColumn={role === ROLES.SUPER_ADMIN}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            onViewClick={handleViewClick}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteRow}
            onStatusChange={handleStatusChange}
            statusLoadingIds={statusLoadingIds}
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
            totalItems={pagination.totalRecords}
            totalPages={pagination.totalPages}
          />
        </div>

        {activeModal === "student" && (
          <StudentFormModal
            editingStudent={editingStudent}
            onClose={() => {
              setActiveModal(null);
              setEditingStudent(null);
            }}
            onSave={handleSaveStudent}
          />
        )}

        {isFilterModalOpen && (
          <StudentFilterModal
            initialFilters={filters}
            onClose={() => setIsFilterModalOpen(false)}
            onApply={handleApplyFilter}
          />
        )}

        <StudentExportFilterModal
          isOpen={isExportConfirmOpen}
          onClose={() => setIsExportConfirmOpen(false)}
          onExport={confirmExport}
          isExporting={isExporting}
          role={role}
        />

        <ConfirmationModal
          isOpen={!!pendingConfirm}
          onClose={() => setPendingConfirm(null)}
          onConfirm={async () => {
            setIsConfirming(true);
            try {
              await pendingConfirm?.confirmAction?.();
            } finally {
              setIsConfirming(false);
              setPendingConfirm(null);
            }
          }}
          isSubmitting={isConfirming}
          title={pendingConfirm?.title}
          message={pendingConfirm?.message}
          confirmText={pendingConfirm?.confirmText}
          cancelText="Cancel"
        />
      </div>
    </div>
  );
}
