import React from "react";
import {
  Square,
  CheckSquare,
  Pencil,
  Eye,
  ChevronDown,
  Building2,
  Home,
  Badge,
} from "lucide-react";
import TableSkeletonLoader from "@/components/ui/TableSkeletonLoader";
import MobileSkeletonLoader from "@/components/ui/MobileSkeletonLoader";

const COLUMNS = [
  { key: "admissionNo", label: "Admission No" },
  { key: "studentName", label: "Student Name" },
  { key: "organization", label: "Organization" },
  { key: "hostel", label: "Hostel" },
  { key: "status", label: "Status" },
];

export default function StudentsTable({
  students,
  loading,
  error,
  canEdit,
  showOrganizationColumn = false,
  selectedIds,
  onSelectAll,
  onSelectRow,
  onViewClick,
  onEditClick,
  onStatusChange,
  statusLoadingIds = [],
}) {
  const { t } = useTranslation();
  
  const COLUMNS = [
    t('admission_no'),
    t('student_name'),
    t('organization'),
    t('hostel'),
    t('status'),
  ];

  const showActionsColumn = canEdit || !!onViewClick;
  const getStudentId = (s) => s._id ?? s.id;

  const getHostelName = (hostel) => {
    if (!hostel || typeof hostel !== "object") return hostel || "-";
    return hostel.name ?? hostel.hostelName ?? "-";
  };

  const getOrganizationName = (organization, organizationId) => {
    if (!organization || typeof organization !== "object")
      return organizationId || "-";
    return organization.name ?? "-";
  };

  const getInitials = (name = "") =>
    name.trim().substring(0, 2).toUpperCase() || "NA";

  const visibleColumns = COLUMNS.filter(
    (c) => c.key !== "organization" || showOrganizationColumn
  );

  const colSpan =
    1 + visibleColumns.length + (showActionsColumn ? 1 : 0);

  return (
    <div className="overflow-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Desktop Table */}
      <table className="hidden md:table w-full text-left border-collapse">
        <thead className="sticky top-0 z-10 bg-[#FAFBFD] shadow-sm">
          <tr className="bg-[#FAFBFD] border-b border-gray-100 text-[#222222] text-sm tracking-wider">
            <th className="p-4 w-12 text-center">
              <button
                onClick={onSelectAll}
                className="focus:outline-none text-gray-300 hover:text-gray-500 cursor-pointer"
              >
                {students.length > 0 &&
                students.every((s) => selectedIds.includes(getStudentId(s))) ? (
                  <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
            </th>
            {visibleColumns.map((col) => (
              <th key={col.key} className="p-4 font-semibold">
                {col.label}
              </th>
            ))}
            {showActionsColumn && (
              <th className="p-4 font-semibold text-center rounded-tr-xl">
                Action
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-sm text-center">
          {loading ? (
            <TableSkeletonLoader columns={colSpan} />
          ) : error ? (
            <tr>
              <td colSpan={colSpan} className="p-8 text-start text-red-500">
                {error}
              </td>
            </tr>
          ) : students.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="p-8 text-start text-gray-400">
                No records found matching your search criteria.
              </td>
            </tr>
          ) : (
            students.map((s) => {
              const studentId = getStudentId(s);
              const isSelected = selectedIds.includes(studentId);
              const isActive = Boolean(s.isActive);
              const isStatusLoading = statusLoadingIds.includes(studentId);

              return (
                <tr
                  key={studentId}
                  className={`hover:bg-gray-50/40 transition-colors cursor-pointer ${isSelected ? "bg-blue-50/40" : ""}`}
                >
                  <td className="p-4 text-center">
                    <button
                      onClick={() => onSelectRow(studentId)}
                      className="focus:outline-none text-gray-300 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>

                  {/* Admission No */}
                  <td className="p-4 font-medium text-[#777777] text-start">
                    {s.studentId || "-"}
                  </td>

                  {/* Student Name with avatar */}
                  <td className="p-4 font-medium text-[#777777]">
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:text-[#0A437A]"
                      onClick={() => onViewClick?.(s)}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {getInitials(s.name)}
                      </div>
                      <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors">
                        {s.name || "-"}
                      </span>
                    </div>
                  </td>

                  {/* Organization */}
                  {showOrganizationColumn && (
                    <td className="p-4 text-start text-gray-500">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Building2 size={14} className="text-gray-400" />
                        <span>
                          {getOrganizationName(s.organization, s.organizationId)}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Hostel */}
                  <td className="p-4 text-start text-gray-500">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Home size={14} className="text-gray-400" />
                      <span>{getHostelName(s.hostel)}</span>
                    </div>
                  </td>

                  {/* Status dropdown */}
                  <td className="p-4 text-center">
                    <div className="relative inline-block w-[105px]">
                      <select
                        value={isActive ? "Active" : "Inactive"}
                        disabled={isStatusLoading}
                        onChange={() => onStatusChange?.(studentId)}
                        className={`w-full appearance-none px-3 py-1.5 text-xs font-regular border rounded-md outline-none cursor-pointer transition-colors
                          ${isActive ? "bg-green-50 text-success border-green-200 hover:bg-green-100" : "bg-red-50 text-danger border-red-200 hover:bg-red-100"}
                          ${isStatusLoading ? "opacity-60 cursor-wait" : ""}`}
                      >
                        {isStatusLoading ? (
                          <option>{isActive ? "Active" : "Inactive"}</option>
                        ) : (
                          <>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </>
                        )}
                      </select>
                      <ChevronDown
                        size={12}
                        className={`absolute right-2.5 top-2 pointer-events-none ${isActive ? "text-success" : "text-danger"}`}
                      />
                    </div>
                  </td>

                  {/* Actions */}
                  {showActionsColumn && (
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3 text-gray-400">
                        {canEdit && (
                          <button
                            onClick={() => !isStatusLoading && onEditClick?.(s)}
                            className="text-secondary cursor-pointer transition-colors"
                            title="Edit student"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-4 mt-4">
        {!error && !loading && students.length > 0 && (
          <div className="flex items-center gap-2 px-1 mb-1">
            <button
              onClick={onSelectAll}
              className="focus:outline-none text-gray-400 cursor-pointer flex items-center gap-2"
            >
              {students.every((s) => selectedIds.includes(getStudentId(s))) ? (
                <CheckSquare className="w-5 h-5 text-[#0A437A]" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span className="text-sm font-medium text-gray-600">
                Select All
              </span>
            </button>
          </div>
        )}

        {loading ? (
          <MobileSkeletonLoader />
        ) : error ? (
          <div className="text-center text-red-500 p-8 bg-white rounded-xl shadow-sm border border-gray-100">
            {error}
          </div>
        ) : students.length === 0 ? (
          <div className="text-center text-gray-400 p-8 bg-white rounded-xl shadow-sm border border-gray-100">
            No records found matching your search criteria.
          </div>
        ) : (
          students.map((s) => {
            const studentId = getStudentId(s);
            const isSelected = selectedIds.includes(studentId);
            const isActive = Boolean(s.isActive);
            const isStatusLoading = statusLoadingIds.includes(studentId);

            return (
              <div
                key={studentId}
                className={`bg-white p-4 rounded-xl shadow-sm flex flex-col relative transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}
              >
                {/* Edit button top-right */}
                {canEdit && (
                  <button
                    onClick={() => !isStatusLoading && onEditClick?.(s)}
                    className="absolute top-4 right-4 text-blue-400 hover:text-[#0A437A] cursor-pointer transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}

                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className="mt-3">
                    <button
                      onClick={() => onSelectRow(studentId)}
                      className="focus:outline-none text-gray-300 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-[#0A437A]" />
                      ) : (
                        <Square className="w-5 h-5" />n
                      )}
                    </button>
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full bg-[#0A437A] text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 mt-1 cursor-pointer hover:bg-[#083561] transition-colors"
                    onClick={() => onViewClick?.(s)}
                  >
                    {getInitials(s.name)}
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    {/* Name */}
                    <div
                      className="font-bold text-gray-900 text-base mb-1 cursor-pointer truncate hover:text-[#0A437A] transition-colors"
                      onClick={() => onViewClick?.(s)}
                    >
                      {s.name || "-"}
                    </div>

                    {/* Admission No + Hostel */}
                    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[10px] sm:text-xs text-gray-500 mb-2">
                      <span className="font-medium text-gray-600">
                        #{s.studentId || "-"}
                      </span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Home className="w-3 h-3 text-gray-400" />
                        <span>{getHostelName(s.hostel)}</span>
                      </div>
                    </div>

                    {/* Organization */}
                    {showOrganizationColumn && (
                      <div className="text-[10px] sm:text-xs text-gray-400 mb-3 truncate flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>
                          {getOrganizationName(s.organization, s.organizationId)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status pill bottom-right */}
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    disabled={isStatusLoading}
                    onClick={() => !isStatusLoading && onStatusChange?.(studentId)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-colors
                      ${isActive ? "bg-green-50 text-success hover:bg-green-100" : "bg-red-50 text-danger hover:bg-red-100"}
                      ${isStatusLoading ? "opacity-60 cursor-wait" : ""}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-600" : "bg-red-600"}`}
                    />
                    {isStatusLoading
                      ? "Updating..."
                      : isActive
                        ? "Active"
                        : "Inactive"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}