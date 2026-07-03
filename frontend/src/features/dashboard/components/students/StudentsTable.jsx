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
import Dropdown from "@/components/ui/Dropdown";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants/roles";

const COLUMNS = [
  { key: "admissionNo", label: "Admission No" },
  { key: "studentName", label: "Student Name" },
  { key: "organization", label: "Organization" },
  { key: "hostel", label: "Hostel" },
  { key: "status", label: "Status" },
  { key: "action", label: "Action", className: "text-center rounded-tr-xl" },
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
  const role = useAuthStore((state) => state.user?.role);
  // Only Admin and Super Admin can edit a student or toggle status.
  // Everyone else (Warden, Student, Parent) gets a view-only table:
  // no Edit pencil, and Status renders as a static badge instead of
  // an interactive dropdown.
  const canManage =
    canEdit && (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN);

  const showActionsColumn = canManage;
  const getStudentId = (s) => s._id ?? s.id;
    const { t } = useTranslation();

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

  const visibleColumns = COLUMNS.filter((c) => {
    if (c.key === "organization") return showOrganizationColumn;
    if (c.key === "action") return showActionsColumn;
    return true;
  });

  const colSpan = 1 + visibleColumns.length;

  return (
    <div className="hidden md:block overflow-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
              <th key={col.key} className={`p-4 font-semibold ${col.className || ""}`}>
                {col.label}
              </th>
            ))}
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
                  className={`hover:bg-gray-50/40 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}
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
                          {getOrganizationName(
                            s.organization,
                            s.organizationId,
                          )}
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

                  {/* Status: interactive dropdown for Admin/Super Admin,
                      read-only badge for everyone else (incl. Warden) */}
                  <td className="p-4 text-center">
                    {canManage ? (
                      <div className="relative inline-block w-[105px]">
                        <Dropdown
                          minWidth=""
                          options={[
                            { value: "Active", label: t("active") },
                            { value: "Inactive", label: t("inactive") },
                          ]}
                          value={s.isActive ? "Active" : "Inactive"}
                          onChange={() => onStatusChange?.(studentId)}
                          triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${s.isActive ? "bg-green-50 text-success border-green-200 hover:bg-green-100" : "bg-red-50 text-danger border-red-200 hover:bg-red-100"}`}
                        />
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                          isActive
                            ? "bg-green-50 text-success border-green-200"
                            : "bg-red-50 text-danger border-red-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-600" : "bg-red-600"}`}
                        />
                        {isActive ? t("active") : t("inactive")}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  {showActionsColumn && (
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3 text-gray-400">
                        {canManage && (
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

    </div>
  );
}