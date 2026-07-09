import React from "react";
import {
  Pencil,
  Building2,
  Home,
} from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";
import ListTable from "@/components/ui/ListTable";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants/roles";

const COLUMNS = [
  { key: "admissionNo", label: "Admission No" },
  { key: "studentName", label: "Student Name" },
  { key: "organization", label: "Organization" },
  { key: "hostel", label: "Hostel" },
  { key: "status", label: "Status" },
  { key: "action", label: "Action" },
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

  const headers = visibleColumns.map((col) => {
    if (col.key === "action" || col.key === "status") {
      return { label: col.label, align: "center" };
    }
    return col.label;
  });

  const renderRow = (s, index, isSelected, isStatusLoading) => {
    const studentId = getStudentId(s);
    const isActive = Boolean(s.isActive);

    return (
      <>
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
            <div className="flex items-center gap-2 text-gray-500">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              <span>
                {getOrganizationName(s.organization, s.organizationId)}
              </span>
            </div>
          </td>
        )}

        {/* Hostel */}
        <td className="p-4 text-start text-gray-500">
          <div className="flex items-center gap-2 text-gray-500">
            <Home className="w-3.5 h-3.5 text-gray-400" />
            <span>{getHostelName(s.hostel)}</span>
          </div>
        </td>

        {/* Status */}
        <td className="p-4 text-center">
          {canManage ? (
            <div className="relative inline-block w-[105px]">
              <Dropdown
                minWidth=""
                options={[
                  { value: "Active", label: t("active") },
                  { value: "Inactive", label: t("inactive") },
                ]}
                value={isActive ? "Active" : "Inactive"}
                onChange={() => onStatusChange?.(studentId)}
                triggerClassName={`px-3 py-1.5 text-xs font-regular border transition-colors ${isActive ? "bg-green-50 text-success border-green-200 hover:bg-green-100" : "bg-red-50 text-danger border-red-200 hover:bg-red-100"}`}
              />
            </div>
          ) : (
            <div className={`inline-flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-regular border rounded-md ${isActive ? "bg-green-50 text-success border-green-200" : "bg-red-50 text-danger border-red-200"}`}>
              {isActive ? t("active") : t("inactive")}
            </div>
          )}
        </td>

        {/* Actions */}
        {showActionsColumn && (
          <td className="p-4">
            <div className="flex gap-3 items-center justify-center">
              {canManage && (
                <button
                  onClick={() => !isStatusLoading && onEditClick?.(s)}
                  className="p-1.5 text-gray-400 hover:text-[#0A437A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Edit student"
                >
                  <Pencil className="w-4 h-4 text-secondary" />
                </button>
              )}
            </div>
          </td>
        )}
      </>
    );
  };

  return (
    <ListTable
      headers={headers}
      items={students}
      loading={loading}
      error={error}
      selectedIds={selectedIds}
      onSelectAll={onSelectAll}
      onSelect={onSelectRow}
      canSelect={true}
      statusLoadingIds={statusLoadingIds}
      emptyText="No records found matching your search criteria."
      renderRow={renderRow}
    />
  );
}
