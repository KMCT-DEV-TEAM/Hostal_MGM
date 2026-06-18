import React from "react";
import { Square, CheckSquare, Pencil, Trash2, ChevronDown } from "lucide-react";

const COLUMNS = [
  "Admission No",
  "Name",
  "Course",
  "Department",
  "Organization",
  "Hostel",
  "Status",
];

export default function StudentsTable({
  students,
  loading,
  error,
  canEdit,
  canDelete,
  selectedIds,
  onSelectAll,
  onSelectRow,
  onEditClick,
  onDeleteClick,
  onStatusChange,
  statusLoadingIds = [],
}) {
  const showActionsColumn = canEdit || canDelete;
  const getStudentId = (student) => student._id ?? student.id;
  const getHostelName = (hostel) => {
    if (!hostel || typeof hostel !== "object") return hostel || "-";
    return hostel.name ?? hostel.hostelName ?? hostel._id ?? "-";
  };
  const getOrganizationName = (organization, organizationId) => {
    if (!organization || typeof organization !== "object")
      return organizationId || "-";
    return organization.name ?? "-";
  };
  const getStatus = (student) => (student.isActive ? "Active" : "Inactive");

  if (loading)
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-sm text-gray-400">
        Loading students...
      </div>
    );
  if (error)
    return (
      <div className="bg-white rounded-xl border border-red-100 p-10 text-center text-sm text-danger">
        Failed to load students. Please try again.
      </div>
    );
  if (students.length === 0)
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-sm text-gray-400">
        No students found.
      </div>
    );

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[#222222] text-sm font-semibold border-b border-gray-50">
            <th className="p-4 text-gray-300">
              <button onClick={onSelectAll}>
                {selectedIds.length === students.length ? (
                  <CheckSquare className="h-5 w-5 text-[#0A437A]" />
                ) : (
                  <Square className="h-5 w-5 text-gray-300" />
                )}
              </button>
            </th>
            {COLUMNS.map((h) => (
              <th key={h} className="p-4">
                {h}
              </th>
            ))}
            {showActionsColumn && <th className="p-4">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-sm">
          {students.map((s) => {
            const studentId = getStudentId(s);
            const status = getStatus(s);
            const isActive = status === "Active";
            const isStatusLoading = statusLoadingIds.includes(studentId);

            return (
              <tr key={studentId} className="hover:bg-gray-50 text-[#777777]">
                <td className="p-4">
                  <button onClick={() => onSelectRow(studentId)}>
                    {selectedIds.includes(studentId) ? (
                      <CheckSquare className="h-5 w-5 text-[#0A437A]" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-300" />
                    )}
                  </button>
                </td>
                <td className="p-4">{s.studentId || "-"}</td>
                <td className="p-4 ">{s.name || "-"}</td>
                <td className="p-4">{s.course || "-"}</td>
                <td className="p-4">{s.department || "-"}</td>
                <td className="p-4">
                  {getOrganizationName(s.organization, s.organizationId)}
                </td>
                <td className="p-4">{getHostelName(s.hostel)}</td>
                <td className="p-4">
                  <div className="relative w-fit">
                    <select
                      value={status}
                      disabled={isStatusLoading}
                      onChange={(e) => {
                        if (e.target.value !== status) {
                          onStatusChange?.(studentId);
                        }
                      }}
                      className={`appearance-none rounded-full pl-3 pr-8 py-1.5 text-xs font-semibold border outline-none cursor-pointer
                                                ${
                                                  isActive
                                                    ? "bg-green-50 text-success border-green-200/60"
                                                    : "bg-red-50 text-danger border-red-200/60"
                                                } ${isStatusLoading ? "opacity-60 cursor-wait" : ""}`}
                    >
                      {isStatusLoading ? (
                        <option value={status}>Updating...</option>
                      ) : (
                        <>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </>
                      )}
                    </select>

                    <ChevronDown
                      size={14}
                      className={`absolute right-2.5 top-1.5 pointer-events-none
                                                ${isActive ? "text-success" : "text-danger"}`}
                    />
                  </div>
                </td>
                {showActionsColumn && (
                  <td className="p-4 flex gap-3 text-secondary">
                    {canDelete && (
                      <Trash2
                        className={`w-4 h-4 ${isStatusLoading ? "cursor-wait opacity-50" : "cursor-pointer"}`}
                        aria-disabled={isStatusLoading}
                        onClick={() => !isStatusLoading && onDeleteClick(studentId)}
                      />
                    )}
                    {canEdit && (
                      <Pencil
                        className={`w-4 h-4 ${isStatusLoading ? "cursor-wait opacity-50" : "cursor-pointer"}`}
                        aria-disabled={isStatusLoading}
                        onClick={() => !isStatusLoading && onEditClick(s)}
                      />
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
