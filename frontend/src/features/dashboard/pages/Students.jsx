"use client"
import React, { useCallback, useMemo, useState } from "react";
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
import StudentsToolbar from "../components/students/StudentsToolbar";
import StudentFormModal from "../components/students/StudentFormModal";
import StudentFilterModal from "../components/students/StudentFilterModal";
import StudentDetailView from "../components/students/StudentDetailView";
import StudentExportFilterModal from "../components/Studentexportfiltermodal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { exportToExcel } from "@/utils/exportUtils";

export default function Students() {
  const role = useAuthStore((s) => s.user?.role);
  const { canEdit, canDelete, canCreate } = getStudentPermissions(role);

  const [activeModal, setActiveModal] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [statusLoadingIds, setStatusLoadingIds] = useState([]);
  const [pendingConfirm, setPendingConfirm] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState({
    search: "",
    course: "",
    department: "",
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

      setViewingStudent((current) => {
        if (!current || getStudentId(current) !== studentId) return current;
        return typeof updater === "function" ? updater(current) : updater;
      });
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

  const handleAddClick = () => {
    setEditingStudent(null);
    setActiveModal("student");
  };

  const handleSelectAll = () => {
    setSelectedIds(
      selectedIds.length === students.length ? [] : students.map(getStudentId),
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

           const response = await getStudents(role, { ...params, page: 1, limit: 0 });

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
    <div className="w-full sticky h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
      <StudentsHeader
        selectedIds={selectedIds}
        students={students}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={handleEditClick}
        onActivateSelected={handleActivateSelected}
        onDeactivateSelected={handleDeactivateSelected}
      />

      <StudentsToolbar
        canCreate={canCreate}
        searchValue={filters.search}
        onSearch={handleSearch}
        onFilterClick={() => setIsFilterModalOpen(true)}
        onExport={handleExport}
        onAddClick={handleAddClick}
      />

      <StudentsTable
        students={students}
        loading={loading}
        error={error}
        canEdit={canEdit}
        canDelete={canDelete}
        showOrganizationColumn={role === ROLES.SUPER_ADMIN}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
        onViewClick={setViewingStudent}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteRow}
        onStatusChange={handleStatusChange}
        statusLoadingIds={statusLoadingIds}
      />

      <div className="flex flex-col sm:flex-row p-4 bg-white border border-gray-50 items-center justify-between text-xs font-medium text-gray-500 rounded-b-xl shadow-sm gap-3">
        <div>
          Showing {pagination.totalRecords === 0 ? 0 : (page - 1) * limit + 1}{" "}
          to {Math.min(page * limit, pagination.totalRecords)} of{" "}
          {pagination.totalRecords} entries
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {Array.from({ length: pagination.totalPages }, (_, index) => {
            const pageNum = index + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-8 h-8 rounded flex items-center justify-center transition-all cursor-pointer ${
                  page === pageNum
                    ? "bg-[#0A437A] text-white shadow-sm font-bold"
                    : "border border-transparent text-gray-600 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
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

      {viewingStudent && (
        <StudentDetailView
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
          onStudentChange={handleStudentTreeUpdate}
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
      />

      <ConfirmationModal
        isOpen={!!pendingConfirm}
        onClose={() => setPendingConfirm(null)}
        onConfirm={async () => {
          try {
            await pendingConfirm?.confirmAction?.();
          } finally {
            setPendingConfirm(null);
          }
        }}
        title={pendingConfirm?.title}
        message={pendingConfirm?.message}
        confirmText={pendingConfirm?.confirmText}
        cancelText="Cancel"
      />
    </div>
  );
}