import React, { useCallback, useMemo, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants/roles";
import { getStudentPermissions } from "@/features/dashboard/config/studentPermissions";
import { useStudents } from "@/features/dashboard/hooks/useStudents";
import {
  createStudent,
  toggleStudentStatus,
  bulkUpdateStudentStatus,
  updateStudent,
} from "@/services/student.service";
import StudentsTable from "../components/students/StudentsTable";
import StudentsHeader from "../components/students/StudentsHeader";
import StudentsToolbar from "../components/students/StudentsToolbar";
import StudentFormModal from "../components/students/StudentFormModal";
import StudentFilterModal from "../components/students/StudentFilterModal";
import StudentDetailView from "../components/students/StudentDetailView";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

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
      await bulkUpdateStudentStatus(role, {
        ids: idsToToggle,
        isActive: targetActive,
      });
      setStudents((prev) =>
        prev.map((student) =>
          idsToToggle.includes(getStudentId(student))
            ? { ...student, isActive: targetActive }
            : student,
        ),
      );
      setSelectedIds([]);
    } finally {
      setStatusLoadingIds((prev) =>
        prev.filter((id) => !idsToToggle.includes(id)),
      );
    }
  };

  const prepareBulkStatusChange = (targetActive) => {
    if (!selectedIds.length) return;

    const idsToToggle = selectedIds.filter((id) => {
      const student = students.find((student) => getStudentId(student) === id);
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
    } finally {
      setStatusLoadingIds((prev) =>
        prev.filter((loadingId) => loadingId !== id),
      );
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

  const handleStatusChange = async (id) => {
    if (!canEdit) return;
    setStatusLoadingIds((prev) => [...new Set([...prev, id])]);

    try {
      const response = await toggleStudentStatus(role, id);
      applyStatusChange(id, response);
    } finally {
      setStatusLoadingIds((prev) =>
        prev.filter((loadingId) => loadingId !== id),
      );
    }
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
    if (editingStudent) {
      await updateStudent(getStudentId(editingStudent), payload);
    } else {
      await createStudent(payload);
    }

    setActiveModal(null);
    setEditingStudent(null);
    refetch();
  };

  const handleExport = () => {
    const headers = [
      "Student ID",
      "Name",
      "Email",
      "Phone",
      "Course",
      "Department",
      "Status",
    ];
    const rows = students.map((student) => [
      student.studentId,
      student.name,
      student.email,
      student.phone,
      student.course,
      student.department,
      student.isActive ? "Active" : "Inactive",
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "students.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full sticky   h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
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

      <div className="flex flex-col sm:flex-row p-4 bg-white border border-gray-50 items-center justify-between text-xs font-medium text-gray-500 rounded-b-xl shadow-sm  gap-3">
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
            onClick={() =>
              setPage((prev) => Math.min(prev + 1, pagination.totalPages))
            }
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

      <ConfirmationModal
        isOpen={!!pendingConfirm}
        onClose={() => setPendingConfirm(null)}
        onConfirm={() => pendingConfirm?.confirmAction?.()}
        title={pendingConfirm?.title}
        message={pendingConfirm?.message}
        confirmText={pendingConfirm?.confirmText}
        cancelText="Cancel"
      />
    </div>
  );
}
